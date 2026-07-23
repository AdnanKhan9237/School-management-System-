<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Result extends TenantModel
{
    protected $table = 'results';

    protected $fillable = [
        'exam_id',
        'student_id',
        'subject_id',
        'total_marks',
        'obtained_marks',
        'grade',
        'remarks',
        'entered_by',
    ];

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'exam_id' => 'string',
            'student_id' => 'string',
            'subject_id' => 'string',
            'entered_by' => 'string',
            'total_marks' => 'decimal:2',
            'obtained_marks' => 'decimal:2',
        ]);
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class, 'exam_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function enteredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entered_by');
    }
}
