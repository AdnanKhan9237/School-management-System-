<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    protected function central(): string
    {
        return (string) config('tenancy.database.central_connection');
    }

    public function overview(): JsonResponse
    {
        $conn = DB::connection($this->central());

        $byStatus = $conn->table('tenants')
            ->whereNull('deleted_at')
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $revenue = (int) $conn->table('invoices')->where('status', 'paid')->sum('total_amount');
        $pending = (int) $conn->table('invoices')->where('status', 'pending')->sum('total_amount');

        // Active users across all non-cancelled tenants (queried per tenant DB).
        $activeUsers = 0;
        Tenant::whereNotIn('status', ['cancelled'])->get()->each(function (Tenant $tenant) use (&$activeUsers) {
            $tenant->run(function () use (&$activeUsers) {
                $activeUsers += User::where('is_active', true)->count();
            });
        });

        return response()->json([
            'success' => true,
            'data' => [
                'total_schools' => (int) $byStatus->sum(),
                'active_schools' => (int) ($byStatus['active'] ?? 0),
                'trial_schools' => (int) ($byStatus['trial'] ?? 0),
                'suspended_schools' => (int) ($byStatus['suspended'] ?? 0),
                'cancelled_schools' => (int) ($byStatus['cancelled'] ?? 0),
                'total_plans' => (int) $conn->table('subscription_plans')->count(),
                'total_revenue' => $revenue,
                'pending_revenue' => $pending,
                'active_users' => $activeUsers,
            ],
        ]);
    }

    public function revenue(): JsonResponse
    {
        $rows = DB::connection($this->central())
            ->table('invoices')
            ->where('status', 'paid')
            ->whereNotNull('paid_at')
            ->where('paid_at', '>=', now()->subMonths(12)->startOfMonth())
            ->selectRaw("to_char(paid_at, 'YYYY-MM') as month, sum(total_amount) as revenue")
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($row) => ['month' => $row->month, 'revenue' => (int) $row->revenue]);

        return response()->json([
            'success' => true,
            'data' => $rows,
        ]);
    }

    public function schools(): JsonResponse
    {
        $rows = DB::connection($this->central())
            ->table('tenants')
            ->whereNull('deleted_at')
            ->where('created_at', '>=', now()->subMonths(12)->startOfMonth())
            ->selectRaw("to_char(created_at, 'YYYY-MM') as month, count(*) as count")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $cumulative = 0;
        $data = $rows->map(function ($row) use (&$cumulative) {
            $cumulative += (int) $row->count;

            return [
                'month' => $row->month,
                'new_schools' => (int) $row->count,
                'total_schools' => $cumulative,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
