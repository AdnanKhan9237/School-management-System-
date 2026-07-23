<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StaffSalary extends TenantModel
{
    use SoftDeletes;

    protected $table = 'staff_salaries';

    protected $fillable = [
        'teacher_id',
        'month_year',
        'basic_salary',
        'allowances',
        'deductions',
        'net_salary',
        'status',
        'paid_date',
        'payment_method',
    ];

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'teacher_id' => 'string',
            'basic_salary' => 'integer',
            'allowances' => 'integer',
            'deductions' => 'integer',
            'net_salary' => 'integer',
            'paid_date' => 'date',
        ]);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
