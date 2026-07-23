<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Bind repository interfaces to their Eloquent implementations here.
     *
     * Example:
     *   $this->app->bind(
     *       \App\Repositories\Interfaces\StudentRepositoryInterface::class,
     *       \App\Repositories\Eloquent\StudentRepository::class,
     *   );
     */
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        //
    }
}
