<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');

            $table->string('name'); // "Mid Term 2024", "Final Exam"
            $table->uuid('class_id');
            $table->string('academic_year');
            $table->date('start_date');
            $table->date('end_date');
            $table->date('result_date')->nullable();
            $table->enum('status', ['upcoming', 'ongoing', 'completed', 'published']);

            $table->timestamps();
            $table->softDeletes();

            $table->index('school_id');
            $table->index(['school_id', 'academic_year']);
            $table->index(['class_id', 'academic_year']);
            $table->index('status');

            $table->foreign('class_id')->references('id')->on('classes')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};
