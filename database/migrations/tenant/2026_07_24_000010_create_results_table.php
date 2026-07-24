<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');

            $table->uuid('exam_id');
            $table->uuid('student_id');
            $table->uuid('subject_id');
            $table->decimal('total_marks', 8, 2);
            $table->decimal('obtained_marks', 8, 2);
            $table->string('grade')->nullable();
            $table->string('remarks')->nullable();
            $table->uuid('entered_by');

            $table->timestamps();

            $table->index('school_id');
            $table->unique(['exam_id', 'student_id', 'subject_id']);
            $table->index(['student_id', 'subject_id']);
            $table->index('subject_id');
            $table->index('entered_by');

            $table->foreign('exam_id')->references('id')->on('exams')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->foreign('subject_id')->references('id')->on('subjects')->cascadeOnDelete();
            $table->foreign('entered_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('results');
    }
};
