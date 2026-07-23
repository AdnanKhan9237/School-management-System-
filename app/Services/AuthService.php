<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\SuperAdmin;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Authenticate a platform super admin (central) and issue a Sanctum token.
     *
     * @return array{user: SuperAdmin, token: string}
     */
    public function login(string $email, string $password, string $deviceName = 'api'): array
    {
        $admin = SuperAdmin::where('email', $email)->where('is_active', true)->first();

        if (! $admin || ! Hash::check($password, $admin->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $admin->forceFill(['last_login_at' => now()])->save();

        return [
            'user' => $admin,
            'token' => $admin->createToken($deviceName)->plainTextToken,
        ];
    }

    public function logout(SuperAdmin $admin): void
    {
        $admin->currentAccessToken()?->delete();
    }
}
