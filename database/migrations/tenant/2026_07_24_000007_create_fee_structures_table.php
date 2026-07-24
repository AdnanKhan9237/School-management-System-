<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_structures', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');

            $table->string('name'); // "Tuition Fee", "Lab Fee"
            $table->uuid('class_id')->nullable(); // null means all classes
            $table->bigInteger('amount'); // paisa
            $table->enum('frequency', ['monthly', 'quarterly', 'yearly', 'one_time']);
            $table->integer('due_day')->nullable(); // day of month
            $table->bigInteger('late_fine_per_day')->default(0);
            $table->string('academic_year');
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index('school_id');
            $table->index(['school_id', 'academic_year']);
            $table->index('class_id');

            $table->foreign('class_id')->references('id')->on('classes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_structures');
    }
};
