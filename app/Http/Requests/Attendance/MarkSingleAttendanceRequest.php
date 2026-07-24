<?php

declare(strict_types=1);

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;

class MarkSingleAttendanceRequest extends FormRequest
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
            'student_id' => ['required', 'uuid', 'exists:students,id'],
            'class_id' => ['required', 'uuid', 'exists:classes,id'],
            'date' => ['required', 'date'],
            'status' => ['required', 'in:present,absent,late,leave'],
            'remarks' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'student_id.required' => 'طالب علم کا انتخاب ضروری ہے۔',
            'class_id.required' => 'کلاس کا انتخاب ضروری ہے۔',
            'date.required' => 'تاریخ درکار ہے۔',
            'status.required' => 'حاضری کی حالت درکار ہے۔',
            'status.in' => 'حاضری کی حالت درست نہیں ہے۔',
        ];
    }
}
