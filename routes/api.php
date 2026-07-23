<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\PasswordController;
use App\Http\Controllers\Api\V1\Auth\SuperAdminAuthController;
use App\Http\Controllers\Api\V1\SuperAdmin\TenantController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (V1)
|--------------------------------------------------------------------------
|
| Central (super admin) routes run on the central domain. Tenant (school user)
| routes resolve the tenant from the "X-Tenant" header or the request subdomain
| via the IdentifyTenant middleware, then run against the tenant database.
|
*/

Route::prefix('v1')->group(function () {
    // ---- Central: Super Admin -------------------------------------------
    Route::prefix('super-admin')->group(function () {
        Route::post('login', [SuperAdminAuthController::class, 'login'])->middleware('throttle:login');

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [SuperAdminAuthController::class, 'logout']);
            Route::get('me', [SuperAdminAuthController::class, 'me']);

            // Tenant (school) management
            Route::get('tenants', [TenantController::class, 'index']);
            Route::post('tenants', [TenantController::class, 'store']);
        });
    });

    // ---- Tenant: School Users -------------------------------------------
    Route::prefix('auth')->middleware(['tenant.identify', 'tenant.active'])->group(function () {
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
        Route::post('forgot-password', [PasswordController::class, 'forgotPassword']);
        Route::post('reset-password', [PasswordController::class, 'resetPassword']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::post('refresh', [AuthController::class, 'refresh']);
            Route::get('me', [AuthController::class, 'me']);
            Route::post('change-password', [PasswordController::class, 'changePassword']);
        });
    });
});
