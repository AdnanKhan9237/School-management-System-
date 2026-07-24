<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');

            $table->uuid('student_id');
            $table->uuid('class_id');
            $table->date('date');
            $table->enum('status', ['present', 'absent', 'late', 'leave']);
            $table->uuid('marked_by');
            $table->string('remarks')->nullable();

            $table->timestamps();

            $table->index('school_id');
            $table->index(['student_id', 'date']);
            $table->index(['class_id', 'date']);
            $table->index('marked_by');

            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('class_id')->references('id')->on('classes')->cascadeOnDelete();
            $table->foreign('marked_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
