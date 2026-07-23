<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\TenantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function __construct(private readonly TenantService $tenantService) {}

    public function index(): JsonResponse
    {
        return response()->json(Tenant::with('domains')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => ['required', 'string', 'alpha_dash', 'unique:tenants,id'],
            'name' => ['required', 'string'],
            'subdomain' => ['required', 'string'],
            'plan' => ['sometimes', 'string'],
        ]);

        $tenant = $this->tenantService->createTenant(
            $validated['id'],
            $validated['name'],
            $validated['subdomain'],
            $validated['plan'] ?? 'free',
        );

        return response()->json($tenant->load('domains'), 201);
    }
}
