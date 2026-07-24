<?php

declare(strict_types=1);

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreStudentRequest extends FormRequest
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
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['nullable', 'string', Password::defaults()],
            'phone' => ['nullable', 'string', 'max:50'],
            'gender' => ['nullable', 'in:male,female,other'],
            'date_of_birth' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:120'],

            'class_id' => ['required', 'uuid', 'exists:classes,id'],
            'roll_number' => ['nullable', 'string', 'max:50'],
            'admission_date' => ['nullable', 'date'],
            'father_name' => ['required', 'string', 'max:255'],
            'mother_name' => ['required', 'string', 'max:255'],
            'guardian_name' => ['required', 'string', 'max:255'],
            'guardian_relation' => ['required', 'string', 'max:100'],
            'emergency_contact' => ['required', 'string', 'max:50'],
            'blood_group' => ['nullable', 'string', 'max:10'],
            'previous_school' => ['nullable', 'string', 'max:255'],

            'parent' => ['nullable', 'array'],
            'parent.name' => ['required_with:parent', 'string', 'max:255'],
            'parent.email' => ['required_with:parent', 'email', 'max:255'],
            'parent.phone' => ['nullable', 'string', 'max:50'],
            'parent.relation' => ['nullable', 'in:father,mother,guardian'],
        ];
    }

    /**
     * Urdu-friendly validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'طالب علم کا نام درکار ہے۔',
            'email.required' => 'ای میل ایڈریس درکار ہے۔',
            'email.email' => 'درست ای میل ایڈریس درج کریں۔',
            'email.unique' => 'یہ ای میل پہلے سے موجود ہے۔',
            'class_id.required' => 'کلاس کا انتخاب ضروری ہے۔',
            'class_id.exists' => 'منتخب کردہ کلاس موجود نہیں ہے۔',
            'father_name.required' => 'والد کا نام درکار ہے۔',
            'mother_name.required' => 'والدہ کا نام درکار ہے۔',
            'guardian_name.required' => 'سرپرست کا نام درکار ہے۔',
            'guardian_relation.required' => 'سرپرست سے رشتہ درکار ہے۔',
            'emergency_contact.required' => 'ہنگامی رابطہ نمبر درکار ہے۔',
            'parent.name.required_with' => 'والدین کا نام درکار ہے۔',
            'parent.email.required_with' => 'والدین کی ای میل درکار ہے۔',
        ];
    }
}
