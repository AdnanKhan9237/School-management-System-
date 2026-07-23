<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

class SubscriptionPlan extends Model
{
    use CentralConnection;
    use HasUuids;

    protected $table = 'subscription_plans';

    protected $fillable = [
        'name',
        'slug',
        'price_monthly',
        'price_yearly',
        'max_students',
        'max_teachers',
        'features',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'price_monthly' => 'integer',
            'price_yearly' => 'integer',
            'max_students' => 'integer',
            'max_teachers' => 'integer',
            'features' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(TenantSubscription::class, 'plan_id');
    }
}
