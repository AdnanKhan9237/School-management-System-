<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Identifies the current tenant from either the "X-Tenant" header (the tenant
 * slug/subdomain) or the request subdomain, then initializes tenancy so the
 * rest of the request runs against the tenant's database.
 */
class IdentifyTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $slug = $this->resolveSlug($request);

        if (! $slug) {
            return $this->error('Tenant could not be identified. Provide the X-Tenant header or use a tenant subdomain.', 400);
        }

        /** @var Tenant|null $tenant */
        $tenant = Tenant::whereHas('domains', fn ($q) => $q->where('domain', $slug))->first();

        if (! $tenant) {
            return $this->error("Unknown tenant [{$slug}].", 404);
        }

        tenancy()->initialize($tenant);

        return $next($request);
    }

    protected function resolveSlug(Request $request): ?string
    {
        if ($header = $request->header('X-Tenant')) {
            return trim($header);
        }

        $host = $request->getHost();

        foreach ((array) config('tenancy.central_domains', []) as $central) {
            if (str_ends_with($host, '.'.$central)) {
                return substr($host, 0, -(strlen($central) + 1));
            }
        }

        return null;
    }

    protected function error(string $message, int $status): Response
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], $status);
    }
}
