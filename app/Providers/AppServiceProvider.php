<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Login rate limiting: 5 attempts per minute per IP.
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));

        // API password reset link (no web route); point at the SPA/frontend URL.
        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            return rtrim((string) config('app.url'), '/')
                .'/reset-password?token='.$token
                .'&email='.urlencode($notifiable->getEmailForPasswordReset());
        });
    }
}
