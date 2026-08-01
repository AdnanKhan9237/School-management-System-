<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Student;
use App\Models\User;

class StudentPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'principal', 'admin', 'teacher', 'accountant'], true);
    }

    public function view(User $user, Student $student): bool
    {
        if (in_array($user->role, ['super_admin', 'principal', 'admin', 'teacher', 'accountant'], true)) {
            return true;
        }

        if ($user->role === 'student' && $user->id === $student->user_id) {
            return true;
        }

        if ($user->role === 'parent') {
            return $user->children()->where('students.id', $student->id)->exists();
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'principal', 'admin'], true);
    }

    public function update(User $user, Student $student): bool
    {
        return in_array($user->role, ['super_admin', 'principal', 'admin'], true);
    }

    public function delete(User $user, Student $student): bool
    {
        return in_array($user->role, ['super_admin', 'principal', 'admin'], true);
    }
}
