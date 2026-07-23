<?php

declare(strict_types=1);

namespace App\Models\Concerns;

/**
 * Adds account-lockout behaviour driven by failed_login_attempts + locked_until.
 * Requires those two columns on the model's table.
 */
trait Lockable
{
    public const MAX_LOGIN_ATTEMPTS = 10;

    public const LOCK_MINUTES = 15;

    public function isLocked(): bool
    {
        return $this->locked_until !== null && $this->locked_until->isFuture();
    }

    public function registerFailedLogin(): void
    {
        $this->increment('failed_login_attempts');

        if ($this->failed_login_attempts >= self::MAX_LOGIN_ATTEMPTS) {
            $this->forceFill([
                'locked_until' => now()->addMinutes(self::LOCK_MINUTES),
            ])->save();
        }
    }

    public function clearFailedLogins(): void
    {
        if ($this->failed_login_attempts > 0 || $this->locked_until !== null) {
            $this->forceFill([
                'failed_login_attempts' => 0,
                'locked_until' => null,
            ])->save();
        }
    }
}
