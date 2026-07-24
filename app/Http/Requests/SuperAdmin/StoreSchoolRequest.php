<?php

declare(strict_types=1);

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreSchoolRequest extends FormRequest
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
            'slug' => ['required', 'string', 'alpha_dash:ascii', 'max:63', 'unique:tenants,slug'],
            'plan' => ['required', 'in:basic,standard,premium'],
            'max_students' => ['sometimes', 'integer', 'min:1'],
            'max_teachers' => ['sometimes', 'integer', 'min:1'],
            'principal' => ['required', 'array'],
            'principal.name' => ['required', 'string', 'max:255'],
            'principal.email' => ['required', 'email', 'max:255'],
            'principal.password' => ['nullable', 'string', Password::defaults()],
            'principal.phone' => ['nullable', 'string', 'max:50'],
        ];
    }
}
