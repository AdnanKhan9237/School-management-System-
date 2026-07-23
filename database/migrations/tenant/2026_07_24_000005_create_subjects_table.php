<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subjects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');

            $table->string('name');
            $table->string('code');
            $table->uuid('class_id');
            $table->uuid('teacher_id')->nullable();
            $table->decimal('credit_hours', 8, 2)->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['school_id', 'code']);
            $table->index('school_id');
            $table->index('class_id');
            $table->index('teacher_id');

            $table->foreign('class_id')->references('id')->on('classes')->cascadeOnDelete();
            $table->foreign('teacher_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};
