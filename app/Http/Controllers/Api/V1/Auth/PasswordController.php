<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

/**
 * Tenant password flows. The tenant is resolved by IdentifyTenant middleware,
 * so the password broker uses the tenant database (users + password_reset_tokens).
 */
class PasswordController extends Controller
{
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $status = Password::sendResetLink($request->only('email'));

        // Always return a generic message to avoid leaking which emails exist.
        return response()->json([
            'success' => true,
            'message' => 'If the email exists, a password reset link has been sent.',
            'status' => __($status),
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                // The model's "hashed" cast hashes the value on save.
                $user->forceFill(['password' => $password])->save();
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PasswordReset) {
            return response()->json([
                'success' => false,
                'message' => __($status),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Password has been reset successfully.',
        ]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check((string) $request->input('current_password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'The current password is incorrect.',
            ], 422);
        }

        $user->forceFill(['password' => (string) $request->input('password')])->save();

        // Revoke all other tokens for safety, keep the current session token.
        $currentId = $user->currentAccessToken()?->id;
        $user->tokens()->when($currentId, fn ($q) => $q->where('id', '!=', $currentId))->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }
}
