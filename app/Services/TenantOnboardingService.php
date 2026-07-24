<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Tenant;
use App\Models\User;
use App\Notifications\SchoolWelcomeNotification;
use Illuminate\Support\Str;
use Throwable;

/**
 * Handles the multi-step school onboarding flow. Creating the tenant database
 * and running its migrations happen outside of a SQL transaction (DDL such as
 * CREATE DATABASE cannot be rolled back), so onboarding uses a compensating
 * action: if any step fails, the tenant (and its freshly created database) is
 * force-deleted, effectively rolling everything back.
 */
class TenantOnboardingService
{
    /**
     * @param  array{name:string, slug:string, plan:string, max_students?:int, max_teachers?:int, principal:array{name:string, email:string, password?:string|null, phone?:string|null}}  $data
     * @return array{tenant: Tenant, principal: User, password: string}
     */
    public function onboard(array $data): array
    {
        $id = (string) Str::uuid();
        $slug = $data['slug'];
        $plainPassword = $data['principal']['password'] ?? Str::password(12);

        $prefix = config('tenancy.database.prefix', 'tenant');
        $suffix = config('tenancy.database.suffix', '');

        $tenant = null;

        try {
            // Steps 2-4: create the central tenant record, which triggers the
            // stancl TenantCreated pipeline (create database + run migrations).
            $tenant = Tenant::create(array_filter([
                'id' => $id,
                'name' => $data['name'],
                'slug' => $slug,
                'database' => $prefix.$id.$suffix,
                'plan' => $data['plan'],
                'status' => 'trial',
                'trial_ends_at' => now()->addDays(14),
                'max_students' => $data['max_students'] ?? null,
                'max_teachers' => $data['max_teachers'] ?? null,
                'onboarded_at' => now(),
            ], fn ($value) => $value !== null));

            // Step 6: assign the subdomain (identification matches the label).
            $tenant->domains()->create(['domain' => $slug]);

            // Step 5: create the principal account inside the tenant database.
            $principal = null;
            $tenant->run(function () use (&$principal, $data, $plainPassword) {
                $principal = User::create([
                    'name' => $data['principal']['name'],
                    'email' => $data['principal']['email'],
                    'phone' => $data['principal']['phone'] ?? null,
                    'password' => $plainPassword,
                    'role' => 'principal',
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]);
            });

            // Step 7: send the welcome email to the principal.
            $loginUrl = $this->buildLoginUrl($slug);
            $tenant->run(function () use ($principal, $tenant, $loginUrl, $plainPassword) {
                $principal->notify(new SchoolWelcomeNotification($tenant, $loginUrl, $plainPassword));
            });

            return [
                'tenant' => $tenant->fresh(['domains']),
                'principal' => $principal,
                'password' => $plainPassword,
            ];
        } catch (Throwable $e) {
            // Compensating rollback: force-delete drops the tenant database too.
            // First end any active tenancy so no open connection blocks DROP DATABASE
            // (a failure inside Tenant::run() leaves tenancy initialized).
            if (tenancy()->initialized) {
                tenancy()->end();
            }

            if ($tenant && $tenant->exists) {
                try {
                    $tenant->forceDelete();
                } catch (Throwable $ignored) {
                    // Swallow cleanup errors; surface the original failure.
                }
            }

            throw $e;
        }
    }

    protected function buildLoginUrl(string $slug): string
    {
        $appUrl = (string) config('app.url', 'http://localhost');

        // Turn e.g. http://localhost into http://<slug>.localhost/login
        return str_replace('://', '://'.$slug.'.', rtrim($appUrl, '/')).'/login';
    }
}
