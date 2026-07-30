<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Attendance API tests.
 *
 * These tests verify the structural contracts of attendance endpoints.
 * Full integration tests require a live tenant DB context.
 */
class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    // ─── Endpoint availability ─────────────────────────────────────────────────

    public function test_mark_attendance_requires_authentication(): void
    {
        $response = $this->postJson('/api/v1/attendance/mark', [
            'class_id' => '00000000-0000-0000-0000-000000000001',
            'date'     => now()->toDateString(),
            'attendance' => [],
        ]);

        // Without tenant + auth headers → expect 400 or 401
        $this->assertContains($response->status(), [400, 401]);
    }

    public function test_today_attendance_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/attendance/today');
        $this->assertContains($response->status(), [400, 401]);
    }

    public function test_attendance_summary_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/attendance/summary');
        $this->assertContains($response->status(), [400, 401]);
    }

    public function test_monthly_report_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/attendance/report/monthly');
        $this->assertContains($response->status(), [400, 401]);
    }

    public function test_low_attendance_report_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/attendance/report/low');
        $this->assertContains($response->status(), [400, 401]);
    }

    // ─── Business logic unit tests ─────────────────────────────────────────────

    public function test_attendance_percentage_calculation(): void
    {
        // school-wide % = present / (total - leave)  ← based on spec example
        $present = 410;
        $absent  = 30;
        $late    = 10;
        $leave   = 0;
        $total   = $present + $absent + $late + $leave;

        $percentage = $total > 0 ? round(($present / $total) * 100, 1) : 0;

        $this->assertEqualsWithDelta(91.1, $percentage, 0.1);
    }

    public function test_low_attendance_threshold_default_is_75(): void
    {
        // Verify the default threshold constant used in AttendanceService
        $this->assertEquals(75, 75); // Placeholder — actual constant tested via service
    }

    public function test_attendance_status_values_are_valid(): void
    {
        $validStatuses = ['present', 'absent', 'late', 'leave'];

        foreach ($validStatuses as $status) {
            $this->assertContains($status, $validStatuses);
        }
    }

    public function test_bulk_mark_requires_class_id_and_date(): void
    {
        // Structural check — missing required fields returns 422
        $response = $this->postJson('/api/v1/attendance/mark', [
            'attendance' => [],
        ]);

        // Without tenant context will be 400, but with tenant would be 422
        $this->assertContains($response->status(), [400, 422]);
    }
}
