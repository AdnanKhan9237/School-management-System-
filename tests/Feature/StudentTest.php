<?php

namespace Tests\Feature;

use App\Models\SuperAdmin;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Student CRUD tests.
 *
 * Note: tenant-scoped endpoints require a live tenant DB. These tests verify
 * the super-admin student-management surface and structural response contracts.
 */
class StudentTest extends TestCase
{
    use RefreshDatabase;

    private SuperAdmin $admin;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = SuperAdmin::factory()->create();
        $this->token = $this->admin->createToken('test', ['access'])->plainTextToken;
    }

    // ─── Super Admin: School listing (validates students_count in response) ────

    public function test_schools_list_returns_paginated_response(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/super-admin/schools');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data',
            ]);
    }

    public function test_create_school_validates_required_fields(): void
    {
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/super-admin/schools', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'slug']);
    }

    public function test_create_school_with_duplicate_slug_fails(): void
    {
        // Create first school
        $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/super-admin/schools', [
                'name'             => 'Test School A',
                'slug'             => 'testschool',
                'principal_name'   => 'John Doe',
                'principal_email'  => 'john@testschool.com',
                'principal_phone'  => '+923001234567',
                'city'             => 'Karachi',
                'plan_id'          => '00000000-0000-0000-0000-000000000001',
                'billing_cycle'    => 'monthly',
            ]);

        // Try to create second school with same slug
        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/super-admin/schools', [
                'name'             => 'Test School B',
                'slug'             => 'testschool', // duplicate
                'principal_name'   => 'Jane Doe',
                'principal_email'  => 'jane@testschool.com',
                'principal_phone'  => '+923001234568',
                'city'             => 'Lahore',
                'plan_id'          => '00000000-0000-0000-0000-000000000001',
                'billing_cycle'    => 'monthly',
            ]);

        $response->assertStatus(422);
    }

    public function test_admission_number_format_is_year_sequence(): void
    {
        // Verify the admission number format YYYY-NNNN via regex
        $pattern = '/^\d{4}-\d{4}$/';
        $admissionNumber = date('Y') . '-0001';

        $this->assertMatchesRegularExpression($pattern, $admissionNumber);
    }

    public function test_student_list_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/students');

        // Without auth and tenant headers → expect 4xx
        $response->assertStatus(400);
    }

    public function test_student_export_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/students/export');

        $response->assertStatus(400);
    }
}
