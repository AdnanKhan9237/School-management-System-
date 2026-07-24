<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\SuperAdmin;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SuperAdmin
 */
class SuperAdminResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => 'super_admin',
            'permissions' => ['*'],
            'avatar' => $this->avatar,
            'phone' => $this->phone,
            'last_login_at' => optional($this->last_login_at)->toIso8601String(),
        ];
    }
}
