<?php

declare(strict_types=1);

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSchoolRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'plan' => ['sometimes', 'in:basic,standard,premium'],
            'max_students' => ['sometimes', 'integer', 'min:1'],
            'max_teachers' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
