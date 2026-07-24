<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FeeStructure extends TenantModel
{
    use SoftDeletes;

    protected $table = 'fee_structures';

    protected $fillable = [
        'name',
        'class_id',
        'amount',
        'frequency',
        'due_day',
        'late_fine_per_day',
        'academic_year',
        'is_active',
    ];

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'class_id' => 'string',
            'amount' => 'integer',
            'due_day' => 'integer',
            'late_fine_per_day' => 'integer',
            'is_active' => 'boolean',
        ]);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function feePayments(): HasMany
    {
        return $this->hasMany(FeePayment::class, 'fee_structure_id');
    }
}
