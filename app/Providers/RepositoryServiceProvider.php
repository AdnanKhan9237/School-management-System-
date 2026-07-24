<?php

declare(strict_types=1);

namespace App\Providers;

use App\Repositories\Eloquent\StudentRepository;
use App\Repositories\Interfaces\StudentRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Bind repository interfaces to their Eloquent implementations here.
     */
    public function register(): void
    {
        $this->app->bind(StudentRepositoryInterface::class, StudentRepository::class);
    }

    public function boot(): void
    {
        //
    }
}
