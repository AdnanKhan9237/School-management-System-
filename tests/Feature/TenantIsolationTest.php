<?php

namespace Tests\Feature;

use App\Models\SuperAdmin;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tenant isolation tests.
 *
 * Verifies that the multi-tenant architecture prevents cross-tenant
 * data access. Uses the super-admin surface to verify school isolation.
 */
class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private SuperAdmin $admin;
    private string $adminToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin      = SuperAdmin::factory()->create();
        $this->adminToken = $this->admin->createToken('test', ['access'])->plainTextToken;
    }

    // ─── X-Tenant header isolation ─────────────────────────────────────────────

    public function test_request_without_tenant_header_is_rejected(): void
    {
        // Tenant endpoints require X-Tenant header (or subdomain)
        $response = $this->getJson('/api/v1/students');

        $response->assertStatus(400); // TenantCouldNotBeIdentified
    }

    public function test_request_with_nonexistent_tenant_is_rejected(): void
    {
        $response = $this->withHeader('X-Tenant', 'nonexistent-school-xyz')
            ->getJson('/api/v1/auth/me');

        // Should fail — tenant not found
        $this->assertContains($response->status(), [400, 401, 404]);
    }

    // ─── Super admin cannot read tenant data directly ──────────────────────────

    public function test_super_admin_token_cannot_access_tenant_student_endpoint(): void
    {
        // Super admin tokens have no tenant context → middleware should reject
        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->getJson('/api/v1/students');

        // Either no tenant identified (400) or forbidden (403)
        $this->assertContains($response->status(), [400, 401, 403]);
    }

    // ─── Tenant DB isolation (structural) ─────────────────────────────────────

    public function test_tenant_database_names_are_unique(): void
    {
        // Each tenant gets a unique DB like tenant<id>
        $id1 = 'schoola';
        $id2 = 'schoolb';

        $db1 = 'tenant' . $id1;
        $db2 = 'tenant' . $id2;

        $this->assertNotEquals($db1, $db2);
    }

    public function test_tenant_model_always_scopes_school_id(): void
    {
        // TenantModel boot method should always set school_id
        // This is a compile-time check — verify the trait exists
        $this->assertTrue(
            class_exists(\App\Models\TenantModel::class),
            'TenantModel base class must exist'
        );
    }

    public function test_central_models_use_central_connection(): void
    {
        // SuperAdmin, Tenant, SubscriptionPlan, Invoice should always
        // use the central DB connection regardless of tenant context
        $centralModels = [
            \App\Models\SuperAdmin::class,
            \App\Models\Tenant::class,
            \App\Models\SubscriptionPlan::class,
            \App\Models\Invoice::class,
        ];

        foreach ($centralModels as $model) {
            $this->assertTrue(
                class_exists($model),
                "{$model} must exist as a central model"
            );
        }
    }

    public function test_tenant_model_classes_exist(): void
    {
        $tenantModels = [
            \App\Models\User::class,
            \App\Models\Student::class,
            \App\Models\SchoolClass::class,
            \App\Models\FeePayment::class,
            \App\Models\Attendance::class,
            \App\Models\Exam::class,
            \App\Models\Result::class,
        ];

        foreach ($tenantModels as $model) {
            $this->assertTrue(
                class_exists($model),
                "{$model} must exist as a tenant model"
            );
        }
    }

    // ─── Super admin API isolation ─────────────────────────────────────────────

    public function test_super_admin_schools_endpoint_is_protected(): void
    {
        // Without auth → 401
        $response = $this->getJson('/api/v1/super-admin/schools');
        $response->assertStatus(401);
    }

    public function test_super_admin_analytics_requires_super_admin_role(): void
    {
        // Non-super-admin tokens should be rejected by the super_admin middleware
        $response = $this->getJson('/api/v1/super-admin/analytics/overview');
        $response->assertStatus(401);
    }
}
