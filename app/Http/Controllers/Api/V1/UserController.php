<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * List staff members (teachers, accountants, principals).
     * Exclude student & parent roles — those are managed via StudentController / ParentController.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'role'     => ['nullable', 'string', Rule::in(['principal', 'teacher', 'accountant'])],
            'search'   => ['nullable', 'string', 'max:100'],
            'active'   => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = User::query()
            ->whereIn('role', ['principal', 'teacher', 'accountant'])
            ->orderBy('name');

        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $paginator = $query->paginate((int) $request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => $paginator->items(),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * Create a new staff member (teacher / accountant).
     * Principals can only be created during school onboarding.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'email'         => ['required', 'email', 'unique:users,email'],
            'phone'         => ['nullable', 'string', 'max:20'],
            'role'          => ['required', Rule::in(['teacher', 'accountant'])],
            'gender'        => ['nullable', Rule::in(['male', 'female', 'other'])],
            'date_of_birth' => ['nullable', 'date'],
            'address'       => ['nullable', 'string', 'max:500'],
            'city'          => ['nullable', 'string', 'max:100'],
            'password'      => ['required', 'string', 'min:8'],
        ]);

        $user = User::create([
            ...$data,
            'password'           => Hash::make($data['password']),
            'email_verified_at'  => now(),
            'is_active'          => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Staff member created successfully.',
            'data'    => $user,
        ], 201);
    }

    /**
     * Show a single staff member.
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $user,
        ]);
    }

    /**
     * Update staff member details.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name'          => ['sometimes', 'string', 'max:255'],
            'email'         => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'phone'         => ['nullable', 'string', 'max:20'],
            'role'          => ['sometimes', Rule::in(['teacher', 'accountant'])],
            'gender'        => ['nullable', Rule::in(['male', 'female', 'other'])],
            'date_of_birth' => ['nullable', 'date'],
            'address'       => ['nullable', 'string', 'max:500'],
            'city'          => ['nullable', 'string', 'max:100'],
            'is_active'     => ['sometimes', 'boolean'],
        ]);

        $user->fill($data)->save();

        return response()->json([
            'success' => true,
            'message' => 'Staff member updated successfully.',
            'data'    => $user->fresh(),
        ]);
    }

    /**
     * Soft-delete a staff member.
     */
    public function destroy(User $user): JsonResponse
    {
        // Prevent deleting the authenticated user themselves.
        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Staff member removed successfully.',
        ]);
    }

    /**
     * Reset a staff member's password (principal action).
     */
    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user->update([
            'password'               => Hash::make($data['password']),
            'failed_login_attempts'  => 0,
            'locked_until'           => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully.',
        ]);
    }
}
