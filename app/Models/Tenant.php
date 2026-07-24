<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase;
    use HasDomains;
    use SoftDeletes;

    /**
     * Attributes that are stored as top-level columns (everything else is
     * stored in the JSON "data" column by stancl/tenancy's virtual columns).
     */
    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'slug',
            'domain',
            'database',
            'plan',
            'status',
            'trial_ends_at',
            'max_students',
            'max_teachers',
            'onboarded_at',
            'suspended_at',
            'suspension_reason',
            'deleted_at',
        ];
    }

    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
            'onboarded_at' => 'datetime',
            'suspended_at' => 'datetime',
            'max_students' => 'integer',
            'max_teachers' => 'integer',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(TenantSubscription::class, 'tenant_id');
    }

    public function activeSubscription(): HasOne
    {
        return $this->hasOne(TenantSubscription::class, 'tenant_id')
            ->where('status', 'active')
            ->latestOfMany('ends_at');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'tenant_id');
    }
}
