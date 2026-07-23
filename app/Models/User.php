<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\BelongsToSchool;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Activitylog\Traits\CausesActivity;
use Spatie\Permission\Traits\HasRoles;

/**
 * Per-tenant (school) user: principal, teacher, student, parent, accountant.
 *
 * Note: roles/permissions (spatie) require the permission tables to exist in
 * the tenant database if you use tenant-scoped roles.
 */
class User extends Authenticatable
{
    use BelongsToSchool;
    use CausesActivity;
    use HasApiTokens;
    use HasRoles;
    use HasUuids;
    use Notifiable;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'avatar',
        'gender',
        'date_of_birth',
        'address',
        'city',
        'is_active',
        'email_verified_at',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'school_id' => 'string',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'date_of_birth' => 'date',
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    public function student(): HasOne
    {
        return $this->hasOne(Student::class, 'user_id');
    }

    public function taughtClasses(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'class_teacher_id');
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class, 'teacher_id');
    }

    public function children(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'parent_student', 'parent_id', 'student_id')
            ->withPivot(['relation', 'is_primary'])
            ->withPivotValue('school_id', tenant()?->getTenantKey())
            ->withTimestamps();
    }

    public function salaries(): HasMany
    {
        return $this->hasMany(StaffSalary::class, 'teacher_id');
    }
}
