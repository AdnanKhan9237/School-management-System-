<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SuperAdminLoginRequest;
use App\Http\Resources\SuperAdminResource;
use App\Models\SuperAdmin;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperAdminAuthController extends Controller
{
    public function __construct(private readonly AuthService $auth) {}

    public function login(SuperAdminLoginRequest $request): JsonResponse
    {
        /** @var SuperAdmin $admin */
        $admin = $this->auth->attempt(
            SuperAdmin::class,
            (string) $request->input('email'),
            (string) $request->input('password'),
            'super_admin',
        );

        $tokens = $this->auth->issueTokens($admin);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => array_merge($tokens, [
                'user' => new SuperAdminResource($admin),
            ]),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ['user' => new SuperAdminResource($request->user())],
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
