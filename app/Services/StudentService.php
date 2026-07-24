<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Attendance;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\Notification;
use App\Models\Result;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\ImageManager;

class StudentService
{
    /**
     * Full admission flow, run in a single tenant-DB transaction.
     *
     * @param  array<string, mixed>  $data
     */
    public function admit(array $data): Student
    {
        $password = $data['password'] ?? Str::password(10);

        $student = DB::transaction(function () use ($data, $password) {
            // 1. Create the student's user account.
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $password,
                'role' => 'student',
                'gender' => $data['gender'] ?? null,
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'address' => $data['address'] ?? null,
                'city' => $data['city'] ?? null,
                'is_active' => true,
            ]);

            // 2-4. Create the student record with an auto-generated admission number.
            $student = Student::create([
                'user_id' => $user->id,
                'class_id' => $data['class_id'],
                'admission_number' => $this->generateAdmissionNumber(),
                'roll_number' => $data['roll_number'] ?? null,
                'admission_date' => $data['admission_date'] ?? now()->toDateString(),
                'father_name' => $data['father_name'],
                'mother_name' => $data['mother_name'],
                'guardian_name' => $data['guardian_name'],
                'guardian_relation' => $data['guardian_relation'],
                'emergency_contact' => $data['emergency_contact'],
                'blood_group' => $data['blood_group'] ?? null,
                'previous_school' => $data['previous_school'] ?? null,
                'status' => 'active',
            ]);

            // Optional: create + link a parent account.
            if (! empty($data['parent']) && ! empty($data['parent']['email'])) {
                $parent = User::firstOrCreate(
                    ['email' => $data['parent']['email']],
                    [
                        'name' => $data['parent']['name'] ?? 'Parent',
                        'phone' => $data['parent']['phone'] ?? null,
                        'password' => Str::password(10),
                        'role' => 'parent',
                        'is_active' => true,
                    ]
                );

                $student->parents()->syncWithoutDetaching([
                    $parent->id => [
                        'relation' => $data['parent']['relation'] ?? 'guardian',
                        'is_primary' => true,
                    ],
                ]);
            }

            // 5. Generate fee records for the current month.
            $this->generateMonthlyFees($student);

            return $student;
        });

        // 6. Welcome SMS to parent (side effect, after commit).
        $this->sendWelcomeSms($student, $data, $password);

        return $student->load(['user', 'schoolClass', 'parents']);
    }

    public function generateAdmissionNumber(): string
    {
        $year = now()->year;
        $sequence = Student::withTrashed()
            ->where('admission_number', 'like', $year.'-%')
            ->count() + 1;

        return sprintf('%d-%04d', $year, $sequence);
    }

    public function transfer(Student $student, string $classId): Student
    {
        $student->forceFill(['class_id' => $classId])->save();

        return $student->load(['user', 'schoolClass']);
    }

    public function linkParent(Student $student, string $parentId, string $relation, bool $isPrimary = false): void
    {
        $student->parents()->syncWithoutDetaching([
            $parentId => ['relation' => $relation, 'is_primary' => $isPrimary],
        ]);
    }

    public function uploadPhoto(Student $student, UploadedFile $file): string
    {
        $manager = new ImageManager(new Driver);
        $image = $manager->decodePath($file->getRealPath());
        $image->cover(400, 400);
        $encoded = $image->encode(new JpegEncoder(quality: 80));

        $path = 'students/'.$student->id.'.jpg';
        Storage::disk('public')->put($path, (string) $encoded);

        $student->user?->forceFill(['avatar' => $path])->save();

        return $path;
    }

    /**
     * @return array<string, mixed>
     */
    public function attendanceSummary(Student $student): array
    {
        $build = function ($query) {
            $total = (clone $query)->count();
            $present = (clone $query)->whereIn('status', ['present', 'late'])->count();

            return [
                'total_marked' => $total,
                'present' => $present,
                'percentage' => $total > 0 ? round($present / $total * 100, 2) : 0.0,
            ];
        };

        $base = Attendance::where('student_id', $student->id);
        $month = Attendance::where('student_id', $student->id)
            ->whereBetween('date', [now()->startOfMonth(), now()->endOfMonth()]);

        return [
            'overall' => $build($base),
            'current_month' => $build($month),
        ];
    }

    public function feeHistory(Student $student): EloquentCollection
    {
        return FeePayment::where('student_id', $student->id)
            ->with('feeStructure')
            ->latest('created_at')
            ->get();
    }

    public function results(Student $student): EloquentCollection
    {
        return Result::where('student_id', $student->id)
            ->with(['exam', 'subject'])
            ->latest('created_at')
            ->get();
    }

    /**
     * Attach attendance_percentage (current month) and fee_status to each model
     * using batched aggregate queries (avoids N+1 in list views).
     *
     * @param  EloquentCollection<int, Student>  $students
     */
    public function attachStats(EloquentCollection $students): void
    {
        $ids = $students->pluck('id')->all();

        if (empty($ids)) {
            return;
        }

        $attendance = Attendance::whereIn('student_id', $ids)
            ->whereBetween('date', [now()->startOfMonth(), now()->endOfMonth()])
            ->selectRaw("student_id, count(*) as total, sum(case when status in ('present','late') then 1 else 0 end) as present")
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        $fees = FeePayment::whereIn('student_id', $ids)
            ->selectRaw("student_id,
                sum(case when status = 'overdue' then 1 else 0 end) as overdue,
                sum(case when status in ('pending','partial') then 1 else 0 end) as pending,
                sum(case when status = 'paid' then 1 else 0 end) as paid")
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        foreach ($students as $student) {
            $a = $attendance->get($student->id);
            $student->attendance_percentage = ($a && $a->total > 0)
                ? round($a->present / $a->total * 100, 2)
                : 0.0;

            $student->fee_status = $this->deriveFeeStatus($fees->get($student->id));
        }
    }

    public function attachStatsToOne(Student $student): void
    {
        $this->attachStats(new EloquentCollection([$student]));
    }

    protected function deriveFeeStatus(?object $fees): string
    {
        if (! $fees) {
            return 'none';
        }

        if ((int) $fees->overdue > 0) {
            return 'overdue';
        }

        if ((int) $fees->pending > 0) {
            return 'pending';
        }

        if ((int) $fees->paid > 0) {
            return 'paid';
        }

        return 'none';
    }

    public function generateMonthlyFees(Student $student): void
    {
        $monthYear = now()->format('Y-m');

        $structures = FeeStructure::where('is_active', true)
            ->where(function ($q) use ($student) {
                $q->whereNull('class_id')->orWhere('class_id', $student->class_id);
            })
            ->get();

        foreach ($structures as $structure) {
            $exists = FeePayment::where('student_id', $student->id)
                ->where('fee_structure_id', $structure->id)
                ->where('month_year', $monthYear)
                ->exists();

            if ($exists) {
                continue;
            }

            $dueDay = $structure->due_day ?? 10;
            $dueDate = now()->startOfMonth()->addDays(max(0, $dueDay - 1));

            FeePayment::create([
                'student_id' => $student->id,
                'fee_structure_id' => $structure->id,
                'amount_due' => $structure->amount,
                'amount_paid' => 0,
                'month_year' => $monthYear,
                'due_date' => $dueDate->toDateString(),
                'status' => 'pending',
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function sendWelcomeSms(Student $student, array $data, string $password): void
    {
        $recipient = $data['parent']['phone'] ?? $data['emergency_contact'] ?? null;
        $message = sprintf(
            'Welcome to %s! %s has been admitted (Admission #%s). Login: %s / %s',
            optional(tenant())->name ?? 'our school',
            $data['name'],
            $student->admission_number,
            $data['email'],
            $password,
        );

        // No SMS gateway is configured in this environment; log it and record a
        // notification row so the delivery is auditable.
        Log::info('[SMS] '.($recipient ?? 'n/a').': '.$message);

        Notification::create([
            'title' => 'Admission Confirmation',
            'message' => $message,
            'type' => 'general',
            'channel' => 'sms',
            'recipient_type' => 'parent',
            'recipient_id' => null,
            'sent_at' => now(),
            'status' => 'sent',
            'created_by' => Auth::id() ?? $student->user_id,
        ]);
    }
}
