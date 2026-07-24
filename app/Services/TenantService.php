<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Str;

class TenantService
{
    /**
     * Create a new tenant (school) and attach a subdomain to it.
     *
     * Creating the tenant fires stancl/tenancy's TenantCreated event, which
     * provisions the tenant database and runs the tenant migrations.
     */
    public function createTenant(string $name, string $slug, string $plan = 'basic'): Tenant
    {
        $id = (string) Str::uuid();

        $prefix = config('tenancy.database.prefix', 'tenant');
        $suffix = config('tenancy.database.suffix', '');

        /** @var Tenant $tenant */
        $tenant = Tenant::create([
            'id' => $id,
            'name' => $name,
            'slug' => $slug,
            'database' => $prefix.$id.$suffix,
            'plan' => $plan,
            'status' => 'trial',
            'trial_ends_at' => now()->addDays(14),
        ]);

        // Subdomain identification matches the subdomain label only (e.g. "acme").
        $tenant->domains()->create([
            'domain' => $slug,
        ]);

        return $tenant;
    }

    public function deleteTenant(Tenant $tenant): void
    {
        $tenant->delete();
    }
}
