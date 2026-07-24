<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $tenant = tenant();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'permissions' => $this->permissions(),
            'avatar' => $this->avatar,
            'school' => $tenant ? [
                'id' => $tenant->getTenantKey(),
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo' => $tenant->logo ?? null,
            ] : null,
        ];
    }
}
