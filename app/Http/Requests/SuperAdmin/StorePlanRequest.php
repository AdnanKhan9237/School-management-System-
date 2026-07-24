<?php

declare(strict_types=1);

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class StorePlanRequest extends FormRequest
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
            'slug' => ['required', 'string', 'alpha_dash:ascii', 'max:255', 'unique:subscription_plans,slug'],
            'price_monthly' => ['required', 'integer', 'min:0'],
            'price_yearly' => ['required', 'integer', 'min:0'],
            'max_students' => ['required', 'integer', 'min:1'],
            'max_teachers' => ['required', 'integer', 'min:1'],
            'features' => ['required', 'array'],
            'features.*' => ['string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
