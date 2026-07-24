<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Exam extends TenantModel
{
    use SoftDeletes;

    protected $table = 'exams';

    protected $fillable = [
        'name',
        'class_id',
        'academic_year',
        'start_date',
        'end_date',
        'result_date',
        'status',
    ];

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'class_id' => 'string',
            'start_date' => 'date',
            'end_date' => 'date',
            'result_date' => 'date',
        ]);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(Result::class, 'exam_id');
    }
}
