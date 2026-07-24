<?php

declare(strict_types=1);

namespace App\Services;

use App\Jobs\MarkAttendanceJob;
use App\Models\Attendance;
use App\Models\Student;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AttendanceService
{
    public const LOW_ATTENDANCE_THRESHOLD = 75.0;

    /**
     * Bulk mark attendance for a class on a date.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function markBulk(array $data, string $markedById): array
    {
        $classId = $data['class_id'];
        $date = $data['date'];
        $absent = [];
        $studentIds = [];

        DB::transaction(function () use ($data, $classId, $date, $markedById, &$absent, &$studentIds) {
            foreach ($data['attendance'] as $row) {
                Attendance::updateOrCreate(
                    ['student_id' => $row['student_id'], 'class_id' => $classId, 'date' => $date],
                    ['status' => $row['status'], 'marked_by' => $markedById, 'remarks' => $row['remarks'] ?? null],
                );

                $studentIds[] = $row['student_id'];

                if ($row['status'] === 'absent') {
                    $absent[] = $row['student_id'];
                }
            }
        });

        // Queue parent notifications for absentees (WhatsApp/SMS).
        if (! empty($absent)) {
            MarkAttendanceJob::dispatch($absent, $classId, $date, $markedById);
        }

        // Refresh cached attendance percentages for the affected students.
        $this->updatePercentageCache($studentIds);

        return array_merge($this->classSummary($classId, $date), [
            'absentees_notified' => count($absent),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function markSingle(array $data, string $markedById): Attendance
    {
        $attendance = Attendance::updateOrCreate(
            ['student_id' => $data['student_id'], 'class_id' => $data['class_id'], 'date' => $data['date']],
            ['status' => $data['status'], 'marked_by' => $markedById, 'remarks' => $data['remarks'] ?? null],
        );

        if ($data['status'] === 'absent') {
            MarkAttendanceJob::dispatch([$data['student_id']], $data['class_id'], $data['date'], $markedById);
        }

        $this->updatePercentageCache([$data['student_id']]);

        return $attendance->load(['student.user', 'schoolClass']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Attendance $attendance, array $data): Attendance
    {
        $attendance->fill($data)->save();
        $this->updatePercentageCache([$attendance->student_id]);

        return $attendance->load(['student.user', 'schoolClass']);
    }

    /**
     * School-wide attendance summary for a date.
     *
     * @return array<string, mixed>
     */
    public function summary(?string $date = null): array
    {
        $date = $date ?: now()->toDateString();

        $totals = $this->aggregate(Attendance::whereDate('date', $date));

        $byClass = Attendance::query()
            ->whereDate('attendances.date', $date)
            ->join('classes', 'attendances.class_id', '=', 'classes.id')
            ->groupBy('classes.id', 'classes.name')
            ->selectRaw($this->aggregateSelect('classes.id as class_id, classes.name as class_name'))
            ->get()
            ->map(fn ($row) => $this->formatAggregateRow($row));

        return array_merge(['date' => $date], $totals, ['by_class' => $byClass]);
    }

    /**
     * @return array<string, mixed>
     */
    public function classSummary(string $classId, string $date): array
    {
        return array_merge(
            ['class_id' => $classId, 'date' => $date],
            $this->aggregate(Attendance::where('class_id', $classId)->whereDate('date', $date)),
        );
    }

    /**
     * Monthly report: per-day for a student, per-student for a class, else per-class.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function monthlyReport(array $filters): array
    {
        $month = $filters['month'] ?? now()->format('Y-m');
        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $end = (clone $start)->endOfMonth();

        $base = Attendance::whereBetween('date', [$start->toDateString(), $end->toDateString()]);

        if (! empty($filters['student_id'])) {
            $records = (clone $base)->where('student_id', $filters['student_id'])
                ->orderBy('date')->get(['date', 'status', 'remarks']);

            return [
                'month' => $month,
                'scope' => 'student',
                'student_id' => $filters['student_id'],
                'summary' => $this->aggregate((clone $base)->where('student_id', $filters['student_id'])),
                'days' => $records->map(fn ($r) => [
                    'date' => optional($r->date)->toDateString(),
                    'status' => $r->status,
                    'remarks' => $r->remarks,
                ]),
            ];
        }

        if (! empty($filters['class_id'])) {
            $rows = (clone $base)->where('attendances.class_id', $filters['class_id'])
                ->groupBy('student_id')
                ->selectRaw($this->aggregateSelect('student_id'))
                ->get()
                ->map(fn ($row) => $this->formatAggregateRow($row));

            return ['month' => $month, 'scope' => 'class', 'class_id' => $filters['class_id'], 'students' => $rows];
        }

        $rows = (clone $base)
            ->join('classes', 'attendances.class_id', '=', 'classes.id')
            ->groupBy('classes.id', 'classes.name')
            ->selectRaw($this->aggregateSelect('classes.id as class_id, classes.name as class_name'))
            ->get()
            ->map(fn ($row) => $this->formatAggregateRow($row));

        return ['month' => $month, 'scope' => 'school', 'by_class' => $rows];
    }

    /**
     * Students below the given attendance percentage threshold.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function lowAttendance(float $threshold = self::LOW_ATTENDANCE_THRESHOLD): Collection
    {
        $rows = Attendance::query()
            ->groupBy('student_id')
            ->havingRaw('(sum(case when status = \'present\' then 1 else 0 end)::float / count(*)) * 100 < ?', [$threshold])
            ->selectRaw($this->aggregateSelect('student_id'))
            ->get();

        $students = Student::whereIn('id', $rows->pluck('student_id'))->with('user')->get()->keyBy('id');

        return $rows->map(function ($row) use ($students) {
            $formatted = $this->formatAggregateRow($row);
            $student = $students->get($row->student_id);
            $formatted['student_name'] = $student?->user?->name;
            $formatted['admission_number'] = $student?->admission_number;

            return $formatted;
        })->values();
    }

    /**
     * Recompute and cache the overall attendance percentage per student
     * (cache is tenant-scoped via stancl's CacheTenancyBootstrapper).
     *
     * @param  array<int, string>  $studentIds
     */
    public function updatePercentageCache(array $studentIds): void
    {
        $studentIds = array_values(array_unique($studentIds));

        if (empty($studentIds)) {
            return;
        }

        $rows = Attendance::whereIn('student_id', $studentIds)
            ->groupBy('student_id')
            ->selectRaw('student_id, count(*) as total, sum(case when status = \'present\' then 1 else 0 end) as present')
            ->get()
            ->keyBy('student_id');

        foreach ($studentIds as $id) {
            $row = $rows->get($id);
            $pct = ($row && $row->total > 0) ? round($row->present / $row->total * 100, 1) : 0.0;
            Cache::put($this->cacheKey($id), $pct, now()->addDay());
        }
    }

    public function cachedPercentage(string $studentId): ?float
    {
        $value = Cache::get($this->cacheKey($studentId));

        // Redis stores numeric values as strings; normalise back to float.
        return $value === null ? null : (float) $value;
    }

    protected function cacheKey(string $studentId): string
    {
        return "attendance:pct:{$studentId}";
    }

    /**
     * @return array<string, mixed>
     */
    protected function aggregate($query): array
    {
        $row = $query->selectRaw($this->aggregateSelect())->first();

        return $this->formatAggregateRow($row);
    }

    protected function aggregateSelect(?string $extra = null): string
    {
        $agg = "count(*) as total,
            sum(case when status = 'present' then 1 else 0 end) as present,
            sum(case when status = 'absent' then 1 else 0 end) as absent,
            sum(case when status = 'late' then 1 else 0 end) as late,
            sum(case when status = 'leave' then 1 else 0 end) as leaves";

        return $extra ? "{$extra}, {$agg}" : $agg;
    }

    /**
     * @return array<string, mixed>
     */
    protected function formatAggregateRow(?object $row): array
    {
        $total = (int) ($row->total ?? 0);
        $present = (int) ($row->present ?? 0);

        $result = [
            'total_students' => $total,
            'present' => $present,
            'absent' => (int) ($row->absent ?? 0),
            'late' => (int) ($row->late ?? 0),
            'leave' => (int) ($row->leaves ?? 0),
            'percentage' => $total > 0 ? round($present / $total * 100, 1) : 0.0,
        ];

        foreach (['class_id', 'class_name', 'student_id'] as $key) {
            if (isset($row->{$key})) {
                $result[$key] = $row->{$key};
            }
        }

        return $result;
    }
}
