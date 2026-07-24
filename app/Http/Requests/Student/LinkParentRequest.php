<?php

declare(strict_types=1);

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class LinkParentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'parent_id' => ['required', 'uuid', 'exists:users,id'],
            'relation' => ['required', 'in:father,mother,guardian'],
            'is_primary' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'parent_id.required' => 'والدین کا انتخاب ضروری ہے۔',
            'parent_id.exists' => 'منتخب کردہ والدین موجود نہیں ہیں۔',
            'relation.required' => 'رشتہ منتخب کریں۔',
            'relation.in' => 'رشتہ درست نہیں ہے۔',
        ];
    }
}
