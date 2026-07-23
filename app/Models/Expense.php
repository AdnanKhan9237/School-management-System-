<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Expense extends TenantModel
{
    use SoftDeletes;

    protected $table = 'expenses';

    protected $fillable = [
        'category',
        'description',
        'amount',
        'expense_date',
        'payment_method',
        'receipt_number',
        'approved_by',
        'added_by',
    ];

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'approved_by' => 'string',
            'added_by' => 'string',
            'amount' => 'integer',
            'expense_date' => 'date',
        ]);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }
}
