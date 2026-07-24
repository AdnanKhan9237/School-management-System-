<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

class LoginLog extends Model
{
    use CentralConnection;
    use HasUuids;

    protected $table = 'login_logs';

    protected $fillable = [
        'user_type',
        'tenant_id',
        'user_id',
        'email',
        'successful',
        'reason',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'tenant_id' => 'string',
            'user_id' => 'string',
            'successful' => 'boolean',
        ];
    }
}
