<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Central "tenant registry" table.
     *
     * Note: this table is managed by stancl/tenancy's Tenant model, which uses
     * a virtual JSON "data" column for any attribute not declared as a custom
     * column (see App\Models\Tenant::getCustomColumns()). The "data" column is
     * kept nullable so the package continues to work.
     */
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('name'); // school name
            $table->string('slug')->unique(); // subdomain
            $table->string('domain')->nullable(); // custom domain
            $table->string('database'); // tenant DB name

            $table->enum('plan', ['basic', 'standard', 'premium']);
            $table->enum('status', ['active', 'suspended', 'trial', 'cancelled']);

            $table->timestamp('trial_ends_at')->nullable();
            $table->integer('max_students')->default(500);
            $table->integer('max_teachers')->default(50);
            $table->timestamp('onboarded_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->text('suspension_reason')->nullable();

            // Required by stancl/tenancy for virtual-column overflow storage.
            $table->json('data')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('domain');
            $table->index('database');
            $table->index('plan');
            $table->index('status');
            $table->index('trial_ends_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
