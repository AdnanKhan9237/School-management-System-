<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends TenantModel
{
    protected $table = 'notifications';

    protected $fillable = [
        'title',
        'message',
        'type',
        'channel',
        'recipient_type',
        'recipient_id',
        'sent_at',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'recipient_id' => 'string',
            'created_by' => 'string',
            'sent_at' => 'datetime',
        ]);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
