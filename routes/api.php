<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\PasswordController;
use App\Http\Controllers\Api\V1\Auth\SuperAdminAuthController;
use App\Http\Controllers\Api\V1\SuperAdmin\AnalyticsController;
use App\Http\Controllers\Api\V1\SuperAdmin\InvoiceController;
use App\Http\Controllers\Api\V1\SuperAdmin\PlanController;
use App\Http\Controllers\Api\V1\SuperAdmin\SchoolController;
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

        Route::middleware(['auth:sanctum', 'super_admin'])->group(function () {
            Route::post('logout', [SuperAdminAuthController::class, 'logout']);
            Route::get('me', [SuperAdminAuthController::class, 'me']);

            // Tenant (school) management
            Route::get('schools', [SchoolController::class, 'index']);
            Route::post('schools', [SchoolController::class, 'store']);
            Route::get('schools/{school}', [SchoolController::class, 'show']);
            Route::put('schools/{school}', [SchoolController::class, 'update']);
            Route::delete('schools/{school}', [SchoolController::class, 'destroy']);
            Route::post('schools/{school}/suspend', [SchoolController::class, 'suspend']);
            Route::post('schools/{school}/activate', [SchoolController::class, 'activate']);
            Route::get('schools/{school}/stats', [SchoolController::class, 'stats']);
            Route::post('schools/{school}/subscribe', [SchoolController::class, 'subscribe']);

            // Subscription plans
            Route::get('plans', [PlanController::class, 'index']);
            Route::post('plans', [PlanController::class, 'store']);
            Route::put('plans/{plan}', [PlanController::class, 'update']);

            // Billing
            Route::get('invoices', [InvoiceController::class, 'index']);
            Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
            Route::post('invoices/{invoice}/mark-paid', [InvoiceController::class, 'markPaid']);

            // Analytics
            Route::get('analytics/overview', [AnalyticsController::class, 'overview']);
            Route::get('analytics/revenue', [AnalyticsController::class, 'revenue']);
            Route::get('analytics/schools', [AnalyticsController::class, 'schools']);
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
