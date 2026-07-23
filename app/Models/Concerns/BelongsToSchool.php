<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Applies automatic tenant (school) scoping to a model:
 *  - a global scope that filters every query by the current tenant's id
 *  - a creating hook that stamps school_id with the current tenant's id
 *
 * Scoping is only applied when tenancy is initialized (i.e. inside a tenant
 * context). In the central context the scope is a no-op.
 */
trait BelongsToSchool
{
    public static function bootBelongsToSchool(): void
    {
        static::creating(function ($model) {
            if (empty($model->school_id) && ($tenant = tenant()) !== null) {
                $model->school_id = $tenant->getTenantKey();
            }
        });

        static::addGlobalScope('school', function (Builder $builder) {
            if (($tenant = tenant()) !== null) {
                $builder->where(
                    $builder->getModel()->getTable().'.school_id',
                    $tenant->getTenantKey(),
                );
            }
        });
    }
}
