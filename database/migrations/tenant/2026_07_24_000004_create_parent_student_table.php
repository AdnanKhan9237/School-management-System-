<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parent_student', function (Blueprint $table) {
            // Pivot rows are inserted via belongsToMany::attach(), which bypasses
            // Eloquent's HasUuids id generation, so default the uuid at the DB level.
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('school_id');

            $table->uuid('parent_id');
            $table->uuid('student_id');
            $table->enum('relation', ['father', 'mother', 'guardian']);
            $table->boolean('is_primary')->default(false);

            $table->timestamps();

            $table->index('school_id');
            $table->unique(['parent_id', 'student_id']);
            $table->index('student_id');

            $table->foreign('parent_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parent_student');
    }
};
