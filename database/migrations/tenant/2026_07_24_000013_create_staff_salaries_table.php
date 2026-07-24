<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_salaries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');

            $table->uuid('teacher_id');
            $table->string('month_year'); // "2024-01"
            $table->bigInteger('basic_salary'); // paisa
            $table->bigInteger('allowances')->default(0);
            $table->bigInteger('deductions')->default(0);
            $table->bigInteger('net_salary');
            $table->enum('status', ['pending', 'paid']);
            $table->date('paid_date')->nullable();
            $table->string('payment_method')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('school_id');
            $table->index(['teacher_id', 'month_year']);
            $table->index('status');

            $table->foreign('teacher_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_salaries');
    }
};
