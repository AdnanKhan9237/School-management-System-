<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
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
        try {
            Tenant::whereNotIn('status', ['cancelled'])->get()->each(function (Tenant $tenant) use (&$activeUsers) {
                try {
                    $tenant->run(function () use (&$activeUsers) {
                        $activeUsers += User::where('is_active', true)->count();
                    });
                } catch (\Throwable $e) {
                    // skip failed tenant DB connection
                }
            });
        } catch (\Throwable $e) {
            $activeUsers = 0;
        }

        $totalSchools = (int) $byStatus->sum();
        if ($totalSchools === 0) {
            $totalSchools = $conn->table('tenants')->whereNull('deleted_at')->count();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_schools' => $totalSchools,
                'active_schools' => (int) ($byStatus['active'] ?? $totalSchools),
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
        try {
            $invoices = DB::connection($this->central())
                ->table('invoices')
                ->where('status', 'paid')
                ->whereNotNull('paid_at')
                ->get();

            $grouped = $invoices->groupBy(function ($row) {
                return Carbon::parse($row->paid_at)->format('Y-m');
            });

            $rows = $grouped->map(function ($items, $month) {
                return [
                    'month' => $month,
                    'revenue' => (int) $items->sum('total_amount'),
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data' => $rows,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }
    }

    public function schools(): JsonResponse
    {
        try {
            $tenants = DB::connection($this->central())
                ->table('tenants')
                ->whereNull('deleted_at')
                ->orderBy('created_at')
                ->get();

            $grouped = $tenants->groupBy(function ($row) {
                return Carbon::parse($row->created_at)->format('Y-m');
            });

            $cumulative = 0;
            $data = $grouped->map(function ($items, $month) use (&$cumulative) {
                $count = $items->count();
                $cumulative += $count;

                return [
                    'month' => $month,
                    'new_schools' => $count,
                    'total_schools' => $cumulative,
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }
    }
}
