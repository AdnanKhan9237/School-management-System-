<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends TenantModel
{
    use SoftDeletes;

    protected $table = 'students';

    protected $fillable = [
        'user_id',
        'class_id',
        'admission_number',
        'roll_number',
        'admission_date',
        'father_name',
        'mother_name',
        'guardian_name',
        'guardian_relation',
        'emergency_contact',
        'blood_group',
        'previous_school',
        'status',
    ];

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'user_id' => 'string',
            'class_id' => 'string',
            'admission_date' => 'date',
        ]);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function parents(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'parent_student', 'student_id', 'parent_id')
            ->withPivot(['relation', 'is_primary'])
            ->withPivotValue('school_id', tenant()?->getTenantKey())
            ->withTimestamps();
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'student_id');
    }

    public function feePayments(): HasMany
    {
        return $this->hasMany(FeePayment::class, 'student_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(Result::class, 'student_id');
    }
}
