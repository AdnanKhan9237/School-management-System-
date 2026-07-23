<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('school_id');

            $table->string('title');
            $table->text('message');
            $table->enum('type', ['general', 'fee_reminder', 'exam', 'attendance', 'result', 'custom']);
            $table->enum('channel', ['app', 'whatsapp', 'sms', 'email']);
            $table->enum('recipient_type', ['all', 'class', 'student', 'parent', 'teacher']);
            $table->uuid('recipient_id')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->enum('status', ['pending', 'sent', 'failed']);
            $table->uuid('created_by');

            $table->timestamps();

            $table->index('school_id');
            $table->index(['school_id', 'type']);
            $table->index('status');
            $table->index(['recipient_type', 'recipient_id']);
            $table->index('created_by');

            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
