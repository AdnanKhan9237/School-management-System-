<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subject extends TenantModel
{
    use SoftDeletes;

    protected $table = 'subjects';

    protected $fillable = [
        'name',
        'code',
        'class_id',
        'teacher_id',
        'credit_hours',
        'is_active',
    ];

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'class_id' => 'string',
            'teacher_id' => 'string',
            'credit_hours' => 'decimal:2',
            'is_active' => 'boolean',
        ]);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(Result::class, 'subject_id');
    }

    public function timetables(): HasMany
    {
        return $this->hasMany(Timetable::class, 'subject_id');
    }
}
