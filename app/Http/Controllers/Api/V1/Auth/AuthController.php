<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Tenant (school user) authentication. The tenant is resolved by the
 * IdentifyTenant middleware before these actions run.
 */
class AuthController extends Controller
{
    public function __construct(private readonly AuthService $auth) {}

    public function login(LoginRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->auth->attempt(
            User::class,
            (string) $request->input('email'),
            (string) $request->input('password'),
            'tenant_user',
        );

        $tokens = $this->auth->issueTokens($user);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => array_merge($tokens, [
                'user' => new UserResource($user),
            ]),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ['user' => new UserResource($request->user())],
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        if (! $token || ! $token->can('refresh')) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'A valid refresh token is required.',
            ], 403));
        }

        // Invalidate the used refresh token, then issue a fresh pair.
        $token->delete();
        $tokens = $this->auth->issueTokens($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Token refreshed',
            'data' => array_merge($tokens, [
                'user' => new UserResource($request->user()),
            ]),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }
}
