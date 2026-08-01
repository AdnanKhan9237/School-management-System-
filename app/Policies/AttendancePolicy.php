<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Attendance;
use App\Models\User;

class AttendancePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'principal', 'admin', 'teacher', 'accountant'], true);
    }

    public function mark(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'principal', 'admin', 'teacher'], true);
    }

    public function update(User $user, Attendance $attendance): bool
    {
        return in_array($user->role, ['super_admin', 'principal', 'admin', 'teacher'], true);
    }
}
