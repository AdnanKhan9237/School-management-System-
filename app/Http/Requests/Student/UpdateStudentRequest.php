<?php

declare(strict_types=1);

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
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
        $userId = $this->route('student')?->user_id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'gender' => ['sometimes', 'nullable', 'in:male,female,other'],
            'date_of_birth' => ['sometimes', 'nullable', 'date'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'city' => ['sometimes', 'nullable', 'string', 'max:120'],

            'roll_number' => ['sometimes', 'nullable', 'string', 'max:50'],
            'father_name' => ['sometimes', 'string', 'max:255'],
            'mother_name' => ['sometimes', 'string', 'max:255'],
            'guardian_name' => ['sometimes', 'string', 'max:255'],
            'guardian_relation' => ['sometimes', 'string', 'max:100'],
            'emergency_contact' => ['sometimes', 'string', 'max:50'],
            'blood_group' => ['sometimes', 'nullable', 'string', 'max:10'],
            'previous_school' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'in:active,alumni,transferred,expelled'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.email' => 'درست ای میل ایڈریس درج کریں۔',
            'email.unique' => 'یہ ای میل پہلے سے موجود ہے۔',
            'status.in' => 'حالت درست نہیں ہے۔',
        ];
    }
}
