<?php

declare(strict_types=1);

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlanRequest extends FormRequest
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
            'slug' => ['sometimes', 'string', 'alpha_dash:ascii', 'max:255', Rule::unique('subscription_plans', 'slug')->ignore($this->route('plan'))],
            'price_monthly' => ['sometimes', 'integer', 'min:0'],
            'price_yearly' => ['sometimes', 'integer', 'min:0'],
            'max_students' => ['sometimes', 'integer', 'min:1'],
            'max_teachers' => ['sometimes', 'integer', 'min:1'],
            'features' => ['sometimes', 'array'],
            'features.*' => ['string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
