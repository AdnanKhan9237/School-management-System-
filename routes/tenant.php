<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyBySubdomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| These routes are only reachable on tenant subdomains (e.g. acme.localhost)
| and are automatically scoped to the resolved tenant's database.
|
*/

// Note: tenant routes are registered without a domain constraint, so avoid
// declaring a central "/" web route here — it would shadow the central
// landing page (routes/web.php). Tenant-scoped endpoints live under /api/*.
Route::middleware([
    'api',
    InitializeTenancyBySubdomain::class,
    PreventAccessFromCentralDomains::class,
])->prefix('api')->group(function () {
    Route::get('/tenant', function () {
        return response()->json([
            'tenant_id' => tenant('id'),
            'database' => tenant()->database()->getName(),
            'message' => 'Hello from tenant context!',
        ]);
    });
});
