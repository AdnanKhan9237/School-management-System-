<?php

declare(strict_types=1);

namespace App\Exports;

use App\Models\Student;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class StudentsExport implements FromCollection, WithHeadings, WithMapping
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function __construct(private readonly array $filters = []) {}

    public function collection(): Collection
    {
        $query = Student::query()->with(['user', 'schoolClass']);

        if (! empty($this->filters['class_id'])) {
            $query->where('class_id', $this->filters['class_id']);
        }

        if (! empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        return $query->get();
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return [
            'Admission Number', 'Name', 'Email', 'Phone', 'Class', 'Section',
            'Roll Number', 'Father Name', 'Mother Name', 'Guardian', 'Status',
        ];
    }

    /**
     * @param  Student  $student
     * @return array<int, mixed>
     */
    public function map($student): array
    {
        return [
            $student->admission_number,
            $student->user?->name,
            $student->user?->email,
            $student->user?->phone,
            $student->schoolClass?->name,
            $student->schoolClass?->section,
            $student->roll_number,
            $student->father_name,
            $student->mother_name,
            $student->guardian_name,
            $student->status,
        ];
    }
}
