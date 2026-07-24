<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Tenant
 */
class TenantResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->getTenantKey(),
            'name' => $this->name,
            'slug' => $this->slug,
            'domain' => $this->domain,
            'plan' => $this->plan,
            'status' => $this->status,
            'trial_ends_at' => optional($this->trial_ends_at)->toIso8601String(),
            'max_students' => $this->max_students,
            'max_teachers' => $this->max_teachers,
            'onboarded_at' => optional($this->onboarded_at)->toIso8601String(),
            'suspended_at' => optional($this->suspended_at)->toIso8601String(),
            'suspension_reason' => $this->suspension_reason,
            'domains' => $this->whenLoaded('domains', fn () => $this->domains->pluck('domain')),
            'active_subscription' => new SubscriptionResource($this->whenLoaded('activeSubscription')),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'deleted_at' => optional($this->deleted_at)->toIso8601String(),
        ];
    }
}
