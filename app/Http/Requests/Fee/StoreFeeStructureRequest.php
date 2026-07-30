<?php

declare(strict_types=1);

namespace App\Http\Requests\Fee;

use Illuminate\Foundation\Http\FormRequest;

class StoreFeeStructureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'class_id' => ['nullable', 'uuid'],
            'amount' => ['required', 'integer', 'min:1'],
            'frequency' => ['required', 'in:monthly,quarterly,yearly,one_time'],
            'due_day' => ['nullable', 'integer', 'min:1', 'max:28'],
            'late_fine_per_day' => ['nullable', 'integer', 'min:0'],
            'academic_year' => ['required', 'string', 'max:10'],
            'is_active' => ['boolean'],
        ];
    }
}
