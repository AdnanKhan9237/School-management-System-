<?php

declare(strict_types=1);

namespace App\Imports;

use App\Services\StudentService;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Throwable;

/**
 * Bulk student import. Each row is admitted through StudentService so the full
 * admission flow (user + student + admission number + fees) is applied.
 * Expected heading row columns: name, email, phone, father_name, mother_name,
 * guardian_name, guardian_relation, emergency_contact, roll_number.
 */
class StudentImport implements ToCollection, WithHeadingRow
{
    public int $imported = 0;

    /** @var array<int, array{row:int, message:string}> */
    public array $errors = [];

    public function __construct(
        private readonly StudentService $students,
        private readonly string $classId,
    ) {}

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2; // account for heading row

            if (blank($row['name'] ?? null) || blank($row['email'] ?? null)) {
                continue;
            }

            try {
                $this->students->admit([
                    'name' => (string) $row['name'],
                    'email' => (string) $row['email'],
                    'phone' => isset($row['phone']) ? (string) $row['phone'] : null,
                    'class_id' => $this->classId,
                    'roll_number' => isset($row['roll_number']) ? (string) $row['roll_number'] : null,
                    'father_name' => (string) ($row['father_name'] ?? 'N/A'),
                    'mother_name' => (string) ($row['mother_name'] ?? 'N/A'),
                    'guardian_name' => (string) ($row['guardian_name'] ?? ($row['father_name'] ?? 'N/A')),
                    'guardian_relation' => (string) ($row['guardian_relation'] ?? 'father'),
                    'emergency_contact' => (string) ($row['emergency_contact'] ?? ($row['phone'] ?? '0000000')),
                ]);
                $this->imported++;
            } catch (Throwable $e) {
                $this->errors[] = ['row' => $rowNumber, 'message' => $e->getMessage()];
            }
        }
    }
}
