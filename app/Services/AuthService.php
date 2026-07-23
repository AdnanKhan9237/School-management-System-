<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Concerns\Lockable;
use App\Models\LoginLog;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public const ACCESS_TOKEN_HOURS = 24;

    public const REFRESH_TOKEN_DAYS = 30;

    /**
     * Attempt to authenticate a user of the given model class. Handles account
     * lockout, credential verification, activity flags, and audit logging.
     *
     * @param  class-string  $modelClass
     */
    public function attempt(string $modelClass, string $email, string $password, string $userType): Authenticatable
    {
        /** @var Lockable|Authenticatable|null $user */
        $user = $modelClass::where('email', $email)->first();

        if ($user && $user->isLocked()) {
            $this->log($email, false, 'account_locked', $userType, $user);
            $this->fail('Your account is temporarily locked due to too many failed attempts. Try again later.', 423);
        }

        if (! $user || ! Hash::check($password, $user->password)) {
            $user?->registerFailedLogin();
            $this->log($email, false, 'invalid_credentials', $userType, $user);
            $this->fail('The provided credentials are incorrect.', 401);
        }

        if (isset($user->is_active) && ! $user->is_active) {
            $this->log($email, false, 'inactive_account', $userType, $user);
            $this->fail('Your account is inactive. Please contact your administrator.', 403);
        }

        $user->clearFailedLogins();
        $user->forceFill(['last_login_at' => now()])->save();
        $this->log($email, true, null, $userType, $user);

        return $user;
    }

    /**
     * Issue an access token (24h) and a refresh token (30d).
     *
     * @return array{token: string, refresh_token: string, expires_at: string}
     */
    public function issueTokens(Authenticatable $user): array
    {
        $accessExpiresAt = Carbon::now()->addHours(self::ACCESS_TOKEN_HOURS);
        $refreshExpiresAt = Carbon::now()->addDays(self::REFRESH_TOKEN_DAYS);

        $access = $user->createToken('access-token', ['access'], $accessExpiresAt);
        $refresh = $user->createToken('refresh-token', ['refresh'], $refreshExpiresAt);

        return [
            'token' => $access->plainTextToken,
            'refresh_token' => $refresh->plainTextToken,
            'expires_at' => $accessExpiresAt->toIso8601String(),
        ];
    }

    /**
     * Record a login attempt in the central login_logs table.
     */
    public function log(string $email, bool $successful, ?string $reason, string $userType, ?Authenticatable $user = null): void
    {
        LoginLog::create([
            'user_type' => $userType,
            'tenant_id' => tenant()?->getTenantKey(),
            'user_id' => $user?->getAuthIdentifier(),
            'email' => $email,
            'successful' => $successful,
            'reason' => $reason,
            'ip_address' => request()->ip(),
            'user_agent' => substr((string) request()->userAgent(), 0, 255),
        ]);
    }

    protected function fail(string $message, int $status): never
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => $message,
        ], $status));
    }
}
