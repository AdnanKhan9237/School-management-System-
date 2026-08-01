<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

class FeePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'principal', 'admin', 'accountant'], true);
    }

    public function collect(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'principal', 'admin', 'accountant'], true);
    }

    public function manageStructures(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'principal', 'admin'], true);
    }
}
