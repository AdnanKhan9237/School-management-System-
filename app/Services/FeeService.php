<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\Student;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class FeeService
{
    public function collectFee(array $data, string $receivedBy): array
    {
        return DB::transaction(function () use ($data, $receivedBy) {
            $studentId = $data['student_id'];
            $paymentMethod = $data['payment_method'] ?? 'cash';
            $transactionId = $data['transaction_id'] ?? null;
            $createdPayments = [];

            foreach ($data['payments'] as $item) {
                $structure = FeeStructure::findOrFail($item['fee_structure_id']);
                $discount = $item['discount_amount'] ?? 0;
                $fine = $item['fine_amount'] ?? 0;
                $amountDue = $structure->amount;
                $amountPaid = $item['amount_paid'];

                $status = 'paid';
                if ($amountPaid < ($amountDue + $fine - $discount)) {
                    $status = 'partial';
                }

                $payment = FeePayment::create([
                    'student_id' => $studentId,
                    'fee_structure_id' => $structure->id,
                    'amount_due' => $amountDue,
                    'amount_paid' => $amountPaid,
                    'discount_amount' => $discount,
                    'fine_amount' => $fine,
                    'month_year' => $item['month_year'],
                    'due_date' => now()->startOfMonth()->addDays(($structure->due_day ?? 10) - 1),
                    'paid_date' => now(),
                    'status' => $status,
                    'payment_method' => $paymentMethod,
                    'transaction_id' => $transactionId,
                    'received_by' => $receivedBy,
                    'remarks' => $item['remarks'] ?? null,
                ]);

                $createdPayments[] = $payment;
            }

            return $createdPayments;
        });
    }

    public function generateBulkMonthlyFees(string $monthYear, ?string $classId = null): int
    {
        $structuresQuery = FeeStructure::query()->where('is_active', true)->where('frequency', 'monthly');
        if ($classId) {
            $structuresQuery->where(function ($q) use ($classId) {
                $q->whereNull('class_id')->orWhere('class_id', $classId);
            });
        }
        $structures = $structuresQuery->get();

        $studentsQuery = Student::query()->where('status', 'active');
        if ($classId) {
            $studentsQuery->where('class_id', $classId);
        }
        $students = $studentsQuery->get();

        $count = 0;
        foreach ($students as $student) {
            foreach ($structures as $structure) {
                if ($structure->class_id !== null && $structure->class_id !== $student->class_id) {
                    continue;
                }

                $exists = FeePayment::where('student_id', $student->id)
                    ->where('fee_structure_id', $structure->id)
                    ->where('month_year', $monthYear)
                    ->exists();

                if (! $exists) {
                    FeePayment::create([
                        'student_id' => $student->id,
                        'fee_structure_id' => $structure->id,
                        'amount_due' => $structure->amount,
                        'amount_paid' => 0,
                        'discount_amount' => 0,
                        'fine_amount' => 0,
                        'month_year' => $monthYear,
                        'due_date' => now()->startOfMonth()->addDays(($structure->due_day ?? 10) - 1),
                        'status' => 'pending',
                    ]);
                    $count++;
                }
            }
        }

        return $count;
    }

    public function calculateOutstanding(string $studentId): int
    {
        return (int) FeePayment::where('student_id', $studentId)
            ->whereIn('status', ['pending', 'partial', 'overdue'])
            ->selectRaw('SUM((amount_due + fine_amount - discount_amount) - amount_paid) as outstanding')
            ->value('outstanding') ?? 0;
    }

    public function getDefaulters(): Collection
    {
        return Student::whereHas('feePayments', function ($q) {
            $q->whereIn('status', ['pending', 'overdue', 'partial'])
                ->where('due_date', '<', now());
        })->with(['user', 'schoolClass', 'feePayments'])->get();
    }
}
