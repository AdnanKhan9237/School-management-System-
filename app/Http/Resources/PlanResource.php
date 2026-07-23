<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SubscriptionPlan
 */
class PlanResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'price_monthly' => $this->price_monthly,
            'price_yearly' => $this->price_yearly,
            'max_students' => $this->max_students,
            'max_teachers' => $this->max_teachers,
            'features' => $this->features,
            'is_active' => $this->is_active,
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
