<?php

declare(strict_types=1);

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;

class MarkAttendanceRequest extends FormRequest
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
            'class_id' => ['required', 'uuid', 'exists:classes,id'],
            'date' => ['required', 'date'],
            'attendance' => ['required', 'array', 'min:1'],
            'attendance.*.student_id' => ['required', 'uuid', 'exists:students,id'],
            'attendance.*.status' => ['required', 'in:present,absent,late,leave'],
            'attendance.*.remarks' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'class_id.required' => 'کلاس کا انتخاب ضروری ہے۔',
            'class_id.exists' => 'منتخب کردہ کلاس موجود نہیں ہے۔',
            'date.required' => 'تاریخ درکار ہے۔',
            'attendance.required' => 'حاضری کا ڈیٹا درکار ہے۔',
            'attendance.*.student_id.required' => 'طالب علم کی شناخت درکار ہے۔',
            'attendance.*.status.required' => 'حاضری کی حالت درکار ہے۔',
            'attendance.*.status.in' => 'حاضری کی حالت درست نہیں ہے۔',
        ];
    }
}
