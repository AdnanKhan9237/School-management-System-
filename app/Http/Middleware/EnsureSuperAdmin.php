<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\SuperAdmin;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensures the authenticated user is a platform super admin. Central Sanctum
 * tokens already belong to super admins, but this makes the intent explicit.
 */
class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() instanceof SuperAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Super admin access required.',
            ], 403);
        }

        return $next($request);
    }
}
