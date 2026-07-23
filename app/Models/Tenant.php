<?php

declare(strict_types=1);

namespace App\Models;

use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase;
    use HasDomains;

    /**
     * Attributes that are stored as top-level columns (everything else is
     * stored in the JSON "data" column by stancl/tenancy's virtual columns).
     */
    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'plan',
        ];
    }
}
