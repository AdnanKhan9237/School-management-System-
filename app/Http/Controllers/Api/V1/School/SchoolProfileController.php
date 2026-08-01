<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\School;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolProfileController extends Controller
{
    public function show(): JsonResponse
    {
        $tenant = tenant();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'domain' => $tenant->domain,
                'status' => $tenant->status,
                'plan' => $tenant->plan,
                'max_students' => $tenant->max_students,
                'max_teachers' => $tenant->max_teachers,
                'phone' => $tenant->phone ?? null,
                'email' => $tenant->email ?? null,
                'address' => $tenant->address ?? null,
                'logo_url' => $tenant->logo_url ?? null,
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'logo_url' => 'nullable|string|max:255',
        ]);

        $tenant = tenant();
        $tenant->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'School profile updated successfully.',
            'data' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'domain' => $tenant->domain,
                'status' => $tenant->status,
                'plan' => $tenant->plan,
                'phone' => $tenant->phone ?? null,
                'email' => $tenant->email ?? null,
                'address' => $tenant->address ?? null,
                'logo_url' => $tenant->logo_url ?? null,
            ],
        ]);
    }
}
