<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Timetable extends TenantModel
{
    protected $table = 'timetables';

    protected $fillable = [
        'class_id',
        'subject_id',
        'teacher_id',
        'day_of_week',
        'start_time',
        'end_time',
        'room_number',
        'academic_year',
        'is_active',
    ];

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'class_id' => 'string',
            'subject_id' => 'string',
            'teacher_id' => 'string',
            'is_active' => 'boolean',
        ]);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
