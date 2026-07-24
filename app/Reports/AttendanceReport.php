<?php

declare(strict_types=1);

namespace App\Reports;

use App\Models\Attendance;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

/**
 * Tabular attendance report, exportable to Excel via Maatwebsite/Excel.
 */
class AttendanceReport implements FromCollection, WithHeadings, WithMapping
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function __construct(private readonly array $filters = []) {}

    public function collection(): Collection
    {
        $query = Attendance::query()->with(['student.user', 'schoolClass']);

        if (! empty($this->filters['class_id'])) {
            $query->where('class_id', $this->filters['class_id']);
        }

        if (! empty($this->filters['from'])) {
            $query->whereDate('date', '>=', $this->filters['from']);
        }

        if (! empty($this->filters['to'])) {
            $query->whereDate('date', '<=', $this->filters['to']);
        }

        if (! empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        return $query->orderBy('date')->get();
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ['Date', 'Admission Number', 'Student', 'Class', 'Section', 'Status', 'Remarks'];
    }

    /**
     * @param  Attendance  $attendance
     * @return array<int, mixed>
     */
    public function map($attendance): array
    {
        return [
            optional($attendance->date)->toDateString(),
            $attendance->student?->admission_number,
            $attendance->student?->user?->name,
            $attendance->schoolClass?->name,
            $attendance->schoolClass?->section,
            $attendance->status,
            $attendance->remarks,
        ];
    }
}
