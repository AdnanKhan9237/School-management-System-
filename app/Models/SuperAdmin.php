<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\Lockable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

/**
 * Platform super administrator (central database). Manages tenants, plans and
 * billing. Uses the central connection so it is never resolved against a
 * tenant database while tenancy is initialized.
 */
class SuperAdmin extends Authenticatable
{
    use CentralConnection;
    use HasApiTokens;
    use HasUuids;
    use Lockable;
    use Notifiable;
    use SoftDeletes;

    protected $table = 'super_admins';

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'avatar',
        'is_active',
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
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
            'locked_until' => 'datetime',
            'failed_login_attempts' => 'integer',
        ];
    }
}
