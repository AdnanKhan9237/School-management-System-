<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\FeeService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Stancl\Tenancy\Contracts\TenantWithDatabase;

class MonthlyFeeGenerationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $monthYear,
    ) {}

    public function handle(FeeService $feeService): void
    {
        $tenant = \App\Models\Tenant::find($this->tenantId);
        if (! $tenant) {
            return;
        }

        tenancy()->initialize($tenant);

        $count = $feeService->generateBulkMonthlyFees($this->monthYear);

        \Illuminate\Support\Facades\Log::info("Monthly fee generation complete for tenant {$this->tenantId}: {$count} records created.");

        tenancy()->end();
    }
}
