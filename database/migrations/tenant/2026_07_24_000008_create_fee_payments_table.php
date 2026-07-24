<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');

            $table->uuid('student_id');
            $table->uuid('fee_structure_id');
            $table->bigInteger('amount_due'); // paisa
            $table->bigInteger('amount_paid'); // paisa
            $table->bigInteger('discount_amount')->default(0);
            $table->bigInteger('fine_amount')->default(0);
            $table->string('month_year'); // "2024-01"
            $table->date('due_date');
            $table->date('paid_date')->nullable();
            $table->enum('status', ['pending', 'partial', 'paid', 'overdue', 'waived']);
            // Nullable: only known once a payment is actually collected. Fee
            // records are generated in "pending" state at admission time.
            $table->enum('payment_method', ['cash', 'jazzcash', 'easypaisa', 'bank', 'cheque'])->nullable();
            $table->string('transaction_id')->nullable();
            $table->uuid('received_by')->nullable();
            $table->string('receipt_number')->nullable();
            $table->text('remarks')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('school_id');
            $table->index(['student_id', 'month_year']);
            $table->index('fee_structure_id');
            $table->index('status');
            $table->index('due_date');
            $table->index('received_by');

            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('fee_structure_id')->references('id')->on('fee_structures')->cascadeOnDelete();
            $table->foreign('received_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_payments');
    }
};
