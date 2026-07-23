<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolClass extends TenantModel
{
    use SoftDeletes;

    protected $table = 'classes';

    protected $fillable = [
        'name',
        'section',
        'academic_year',
        'class_teacher_id',
        'max_students',
        'is_active',
    ];

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'class_teacher_id' => 'string',
            'max_students' => 'integer',
            'is_active' => 'boolean',
        ]);
    }

    public function classTeacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'class_teacher_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'class_id');
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class, 'class_id');
    }

    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class, 'class_id');
    }

    public function timetables(): HasMany
    {
        return $this->hasMany(Timetable::class, 'class_id');
    }
}
