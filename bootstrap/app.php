<?php

use App\Http\Middleware\CheckRole;
use App\Http\Middleware\EnsureTenantIsActive;
use App\Http\Middleware\IdentifyTenant;
use Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Enable Sanctum's SPA/cookie authentication for the API, allowing
        // stateful requests from first-party subdomains (see SANCTUM_STATEFUL_DOMAINS).
        $middleware->statefulApi();

        $middleware->alias([
            'tenant.identify' => IdentifyTenant::class,
            'tenant.active' => EnsureTenantIsActive::class,
            'role' => CheckRole::class,
        ]);

        // Ensure tenant identification runs before route auth so Sanctum reads
        // tokens from the tenant database. The default priority list references
        // the AuthenticatesRequests contract (implemented by the Authenticate
        // middleware), so we anchor against that.
        $middleware->prependToPriorityList(
            before: AuthenticatesRequests::class,
            prepend: IdentifyTenant::class,
        );
        $middleware->prependToPriorityList(
            before: AuthenticatesRequests::class,
            prepend: EnsureTenantIsActive::class,
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
