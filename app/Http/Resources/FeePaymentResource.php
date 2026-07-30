<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeePaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'receipt_number' => $this->receipt_number,
            'student' => $this->whenLoaded('student', fn () => [
                'id' => $this->student->id,
                'name' => $this->student->user->name ?? null,
                'admission_number' => $this->student->admission_number,
                'class' => $this->student->schoolClass?->name,
            ]),
            'fee_structure' => $this->whenLoaded('feeStructure', fn () => [
                'id' => $this->feeStructure->id,
                'name' => $this->feeStructure->name,
            ]),
            'month_year' => $this->month_year,
            'amount_due' => $this->amount_due,
            'amount_paid' => $this->amount_paid,
            'discount_amount' => $this->discount_amount,
            'fine_amount' => $this->fine_amount,
            'amount_due_pkr' => number_format($this->amount_due / 100, 2),
            'amount_paid_pkr' => number_format($this->amount_paid / 100, 2),
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'transaction_id' => $this->transaction_id,
            'due_date' => $this->due_date?->format('Y-m-d'),
            'paid_date' => $this->paid_date?->format('Y-m-d'),
            'received_by' => $this->whenLoaded('receivedBy', fn () => $this->receivedBy?->name),
            'remarks' => $this->remarks,
            'created_at' => $this->created_at,
        ];
    }
}
