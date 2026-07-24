<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');

            $table->uuid('user_id');
            $table->uuid('class_id');
            $table->string('admission_number');
            $table->string('roll_number')->nullable();
            $table->date('admission_date');
            $table->string('father_name');
            $table->string('mother_name');
            $table->string('guardian_name');
            $table->string('guardian_relation');
            $table->string('emergency_contact');
            $table->string('blood_group')->nullable();
            $table->string('previous_school')->nullable();
            $table->enum('status', ['active', 'alumni', 'transferred', 'expelled']);

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['school_id', 'admission_number']);
            $table->index('school_id');
            $table->index(['school_id', 'class_id']);
            $table->index(['school_id', 'status']);
            $table->index('user_id');

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('class_id')->references('id')->on('classes')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
