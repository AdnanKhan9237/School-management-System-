<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\SuperAdmin\TenantController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Central API Routes (V1)
|--------------------------------------------------------------------------
|
| These routes run on the central domain (e.g. localhost). Tenant-specific
| API routes live in routes/tenant.php and are only reachable on subdomains.
|
*/

Route::prefix('v1')->group(function () {
    // Public auth endpoints
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // Super-admin: manage tenants (schools)
        Route::prefix('super-admin')->group(function () {
            Route::get('/tenants', [TenantController::class, 'index']);
            Route::post('/tenants', [TenantController::class, 'store']);
        });
    });
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
