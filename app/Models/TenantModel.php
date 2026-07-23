<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Base class for all per-tenant (per-school) models.
 *
 * - UUID primary keys (HasUuids sets keyType=string and incrementing=false).
 * - Automatic school_id scoping + stamping (BelongsToSchool).
 *
 * Tenant models use the default connection, which stancl/tenancy swaps to the
 * current tenant's database while a tenant is initialized.
 */
abstract class TenantModel extends Model
{
    use BelongsToSchool;
    use HasUuids;

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'school_id' => 'string',
        ];
    }
}
