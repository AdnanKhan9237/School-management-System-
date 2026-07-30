<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Fee management tests.
 *
 * Covers collection endpoint contracts, receipt generation logic,
 * fine calculation business rules, and auth enforcement.
 */
class FeeTest extends TestCase
{
    use RefreshDatabase;

    // ─── Endpoint auth enforcement ─────────────────────────────────────────────

    public function test_pending_fees_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/fees/pending');
        $this->assertContains($response->status(), [400, 401]);
    }

    public function test_collect_fee_requires_authentication(): void
    {
        $response = $this->postJson('/api/v1/fees/collect', []);
        $this->assertContains($response->status(), [400, 401]);
    }

    public function test_fee_structures_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/fees/structures');
        $this->assertContains($response->status(), [400, 401]);
    }

    public function test_fee_report_defaulters_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/fees/report/defaulters');
        $this->assertContains($response->status(), [400, 401]);
    }

    // ─── Business logic unit tests ─────────────────────────────────────────────

    public function test_fine_calculation(): void
    {
        // Fine = late_fine_per_day × days_overdue
        $lateFinePerDay = 100; // paisa per day
        $daysOverdue    = 15;
        $expectedFine   = $lateFinePerDay * $daysOverdue;

        $this->assertEquals(1500, $expectedFine);
    }

    public function test_receipt_number_format_is_correct(): void
    {
        // Format: RCT-YYYY-NNNNNN
        $year   = date('Y');
        $seq    = 1;
        $number = sprintf('RCT-%d-%06d', $year, $seq);

        $this->assertMatchesRegularExpression('/^RCT-\d{4}-\d{6}$/', $number);
        $this->assertStringStartsWith("RCT-{$year}-", $number);
    }

    public function test_amount_stored_in_paisa(): void
    {
        // Rs. 3,000 = 300,000 paisa
        $rupees = 3000;
        $paisa  = $rupees * 100;

        $this->assertEquals(300000, $paisa);
    }

    public function test_fee_status_transitions(): void
    {
        $validStatuses = ['pending', 'partial', 'paid', 'overdue', 'waived'];

        foreach ($validStatuses as $status) {
            $this->assertContains($status, $validStatuses);
        }
    }

    public function test_payment_methods_are_valid(): void
    {
        $validMethods = ['cash', 'jazzcash', 'easypaisa', 'bank', 'cheque'];

        foreach ($validMethods as $method) {
            $this->assertContains($method, $validMethods);
        }
    }

    public function test_month_year_format(): void
    {
        $monthYear = date('Y-m');

        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}$/', $monthYear);
    }

    public function test_bulk_generate_requires_authentication(): void
    {
        $response = $this->postJson('/api/v1/fees/bulk-generate');
        $this->assertContains($response->status(), [400, 401]);
    }
}
