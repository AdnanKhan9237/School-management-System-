<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Tenant;

class TenantService
{
    /**
     * Create a new tenant (school) and attach a subdomain to it.
     *
     * Creating the tenant fires stancl/tenancy's TenantCreated event, which
     * provisions the tenant database and runs the tenant migrations.
     */
    public function createTenant(string $id, string $name, string $subdomain, string $plan = 'free'): Tenant
    {
        /** @var Tenant $tenant */
        $tenant = Tenant::create([
            'id' => $id,
            'name' => $name,
            'plan' => $plan,
        ]);

        $tenant->domains()->create([
            'domain' => $subdomain,
        ]);

        return $tenant;
    }

    public function deleteTenant(Tenant $tenant): void
    {
        $tenant->delete();
    }
}
