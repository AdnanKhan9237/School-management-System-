<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks requests for tenants whose subscription/account is not usable
 * (suspended, cancelled, or an expired trial). Must run after IdentifyTenant.
 */
class EnsureTenantIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = tenant();

        if (! $tenant) {
            return $this->error('No active tenant context.', 400);
        }

        if (in_array($tenant->status, ['suspended', 'cancelled'], true)) {
            return $this->error('This school account is '.$tenant->status.'.', 403);
        }

        if ($tenant->status === 'trial'
            && $tenant->trial_ends_at !== null
            && $tenant->trial_ends_at->isPast()) {
            return $this->error('This school trial has expired.', 403);
        }

        return $next($request);
    }

    protected function error(string $message, int $status): Response
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], $status);
    }
}
