<?php

declare(strict_types=1);

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;

class StoreResultsRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'results' => ['required', 'array', 'min:1'],
            'results.*.student_id' => ['required', 'uuid'],
            'results.*.subject_id' => ['required', 'uuid'],
            'results.*.marks_obtained' => ['required', 'numeric', 'min:0'],
            'results.*.total_marks' => ['required', 'numeric', 'min:1'],
            'results.*.remarks' => ['nullable', 'string', 'max:500'],
        ];
    }
}
