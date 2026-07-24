<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');

            $table->string('name'); // "Grade 1", "KG-A"
            $table->string('section')->nullable(); // "A", "B"
            $table->string('academic_year'); // "2024-25"
            $table->uuid('class_teacher_id')->nullable();
            $table->integer('max_students')->default(40);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index('school_id');
            $table->index(['school_id', 'academic_year']);
            $table->index('class_teacher_id');

            $table->foreign('class_teacher_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
