<?php

namespace Tests\Feature;

use App\Models\SuperAdmin;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ─── Super Admin Auth ──────────────────────────────────────────────────────

    public function test_super_admin_can_login_with_valid_credentials(): void
    {
        $admin = SuperAdmin::factory()->create([
            'email'    => 'admin@test.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/super-admin/login', [
            'email'    => 'admin@test.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => ['token', 'user'],
            ]);
    }

    public function test_super_admin_login_fails_with_wrong_password(): void
    {
        SuperAdmin::factory()->create([
            'email'    => 'admin@test.com',
            'password' => Hash::make('correct-password'),
        ]);

        $response = $this->postJson('/api/v1/super-admin/login', [
            'email'    => 'admin@test.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401);
    }

    public function test_super_admin_can_get_their_profile(): void
    {
        $admin = SuperAdmin::factory()->create();
        $token = $admin->createToken('test', ['access'])->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/super-admin/me');

        $response->assertOk()
            ->assertJsonPath('data.user.email', $admin->email);
    }

    public function test_super_admin_can_logout(): void
    {
        $admin = SuperAdmin::factory()->create();
        $token = $admin->createToken('test', ['access'])->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/super-admin/logout');

        $response->assertOk();
    }

    // ─── Tenant Auth ───────────────────────────────────────────────────────────

    public function test_tenant_login_fails_without_tenant_header(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'user@school.com',
            'password' => 'password',
        ]);

        // Should fail — no tenant could be identified
        $response->assertStatus(400);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->getJson('/api/v1/super-admin/me');
        $response->assertStatus(401);
    }

    public function test_login_requires_email(): void
    {
        $response = $this->postJson('/api/v1/super-admin/login', [
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_requires_password(): void
    {
        $response = $this->postJson('/api/v1/super-admin/login', [
            'email' => 'admin@test.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}
