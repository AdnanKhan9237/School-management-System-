<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class FeePayment extends TenantModel
{
    use SoftDeletes;

    protected $table = 'fee_payments';

    protected $fillable = [
        'student_id',
        'fee_structure_id',
        'amount_due',
        'amount_paid',
        'discount_amount',
        'fine_amount',
        'month_year',
        'due_date',
        'paid_date',
        'status',
        'payment_method',
        'transaction_id',
        'received_by',
        'receipt_number',
        'remarks',
    ];

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'student_id' => 'string',
            'fee_structure_id' => 'string',
            'received_by' => 'string',
            'amount_due' => 'integer',
            'amount_paid' => 'integer',
            'discount_amount' => 'integer',
            'fine_amount' => 'integer',
            'due_date' => 'date',
            'paid_date' => 'date',
        ]);
    }

    protected static function booted(): void
    {
        static::creating(function (FeePayment $payment) {
            if (empty($payment->receipt_number)) {
                $payment->receipt_number = static::generateReceiptNumber();
            }
        });
    }

    public static function generateReceiptNumber(): string
    {
        return 'RCP-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function feeStructure(): BelongsTo
    {
        return $this->belongsTo(FeeStructure::class, 'fee_structure_id');
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}
