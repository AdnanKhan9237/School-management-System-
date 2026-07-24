<?php

declare(strict_types=1);

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class StoreClassRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'section' => ['nullable', 'string', 'max:50'],
            'academic_year' => ['required', 'string', 'max:20'],
            'class_teacher_id' => ['nullable', 'uuid', 'exists:users,id'],
            'max_students' => ['sometimes', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'کلاس کا نام درکار ہے۔',
            'academic_year.required' => 'تعلیمی سال درکار ہے۔',
            'class_teacher_id.exists' => 'منتخب کردہ استاد موجود نہیں ہے۔',
        ];
    }
}
