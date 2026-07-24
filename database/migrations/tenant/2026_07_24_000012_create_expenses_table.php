<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');

            $table->string('category'); // "Salary", "Utilities", "Maintenance"
            $table->text('description');
            $table->bigInteger('amount'); // paisa
            $table->date('expense_date');
            $table->string('payment_method');
            $table->string('receipt_number')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->uuid('added_by');

            $table->timestamps();
            $table->softDeletes();

            $table->index('school_id');
            $table->index(['school_id', 'expense_date']);
            $table->index('category');
            $table->index('approved_by');
            $table->index('added_by');

            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('added_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
