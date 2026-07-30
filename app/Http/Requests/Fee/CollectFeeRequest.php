<?php

declare(strict_types=1);

namespace App\Http\Requests\Fee;

use Illuminate\Foundation\Http\FormRequest;

class CollectFeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'uuid'],
            'payment_method' => ['required', 'in:cash,jazzcash,easypaisa,bank,cheque'],
            'transaction_id' => ['nullable', 'string', 'max:100'],
            'payments' => ['required', 'array', 'min:1'],
            'payments.*.fee_structure_id' => ['required', 'uuid'],
            'payments.*.month_year' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'payments.*.amount_paid' => ['required', 'integer', 'min:1'],
            'payments.*.discount_amount' => ['nullable', 'integer', 'min:0'],
            'payments.*.fine_amount' => ['nullable', 'integer', 'min:0'],
            'payments.*.remarks' => ['nullable', 'string', 'max:500'],
        ];
    }
}
