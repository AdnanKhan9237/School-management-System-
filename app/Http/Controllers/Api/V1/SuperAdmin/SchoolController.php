<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\IndexSchoolsRequest;
use App\Http\Requests\SuperAdmin\StoreSchoolRequest;
use App\Http\Requests\SuperAdmin\SubscribeSchoolRequest;
use App\Http\Requests\SuperAdmin\SuspendSchoolRequest;
use App\Http\Requests\SuperAdmin\UpdateSchoolRequest;
use App\Http\Resources\SubscriptionResource;
use App\Http\Resources\TenantResource;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\User;
use App\Services\TenantOnboardingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class SchoolController extends Controller
{
    public function index(IndexSchoolsRequest $request): JsonResponse
    {
        $query = Tenant::query()->with('domains');

        if ($request->boolean('trashed')) {
            $query->withTrashed();
        }

        $query->when($request->input('status'), fn ($q, $status) => $q->where('status', $status));
        $query->when($request->input('plan'), fn ($q, $plan) => $q->where('plan', $plan));
        $query->when($request->input('search'), function ($q, $search) {
            $q->where(function ($inner) use ($search) {
                $inner->where('name', 'ilike', "%{$search}%")
                    ->orWhere('slug', 'ilike', "%{$search}%");
            });
        });

        $schools = $query->latest('created_at')->paginate((int) $request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => TenantResource::collection($schools->items()),
            'meta' => [
                'current_page' => $schools->currentPage(),
                'per_page' => $schools->perPage(),
                'total' => $schools->total(),
                'last_page' => $schools->lastPage(),
            ],
        ]);
    }

    public function store(StoreSchoolRequest $request, TenantOnboardingService $onboarding): JsonResponse
    {
        $result = $onboarding->onboard($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'School onboarded successfully.',
            'data' => [
                'school' => new TenantResource($result['tenant']),
                'credentials' => [
                    'login_url' => str_replace('://', '://'.$result['tenant']->slug.'.', rtrim((string) config('app.url'), '/')).'/login',
                    'email' => $result['principal']->email,
                    'password' => $result['password'],
                ],
            ],
        ], 201);
    }

    public function show(Tenant $school): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new TenantResource($school->load(['domains', 'activeSubscription.plan'])),
        ]);
    }

    public function update(UpdateSchoolRequest $request, Tenant $school): JsonResponse
    {
        $school->fill($request->validated())->save();

        return response()->json([
            'success' => true,
            'message' => 'School updated successfully.',
            'data' => new TenantResource($school->fresh(['domains'])),
        ]);
    }

    public function destroy(Tenant $school): JsonResponse
    {
        // Soft delete keeps the tenant database (see TenancyServiceProvider).
        $school->delete();

        return response()->json([
            'success' => true,
            'message' => 'School deleted (soft) successfully.',
        ]);
    }

    public function suspend(SuspendSchoolRequest $request, Tenant $school): JsonResponse
    {
        $school->forceFill([
            'status' => 'suspended',
            'suspended_at' => now(),
            'suspension_reason' => $request->input('reason'),
        ])->save();

        return response()->json([
            'success' => true,
            'message' => 'School suspended.',
            'data' => new TenantResource($school->fresh(['domains'])),
        ]);
    }

    public function activate(Tenant $school): JsonResponse
    {
        $school->forceFill([
            'status' => 'active',
            'suspended_at' => null,
            'suspension_reason' => null,
        ])->save();

        return response()->json([
            'success' => true,
            'message' => 'School activated.',
            'data' => new TenantResource($school->fresh(['domains'])),
        ]);
    }

    public function stats(Tenant $school): JsonResponse
    {
        $stats = [];

        $school->run(function () use (&$stats) {
            $stats = [
                'users' => User::count(),
                'students' => Student::count(),
                'teachers' => User::where('role', 'teacher')->count(),
                'principals' => User::where('role', 'principal')->count(),
                'classes' => SchoolClass::count(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'school' => new TenantResource($school),
                'limits' => [
                    'max_students' => $school->max_students,
                    'max_teachers' => $school->max_teachers,
                ],
                'counts' => $stats,
            ],
        ]);
    }

    public function subscribe(SubscribeSchoolRequest $request, Tenant $school): JsonResponse
    {
        /** @var SubscriptionPlan $plan */
        $plan = SubscriptionPlan::findOrFail($request->input('plan_id'));

        $cycle = $request->input('billing_cycle');
        $startsAt = $request->filled('starts_at') ? Carbon::parse($request->input('starts_at')) : now();
        $endsAt = $cycle === 'yearly' ? (clone $startsAt)->addYear() : (clone $startsAt)->addMonth();
        $amount = $cycle === 'yearly' ? $plan->price_yearly : $plan->price_monthly;

        $subscription = TenantSubscription::create([
            'tenant_id' => $school->getTenantKey(),
            'plan_id' => $plan->id,
            'billing_cycle' => $cycle,
            'amount' => $amount,
            'status' => 'active',
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'auto_renew' => $request->boolean('auto_renew', true),
        ]);

        // Generate an invoice for the subscription period.
        $subscription->invoices()->create([
            'tenant_id' => $school->getTenantKey(),
            'invoice_number' => 'INV-'.now()->format('Ymd').'-'.strtoupper(Str::random(6)),
            'amount' => $amount,
            'tax_amount' => 0,
            'total_amount' => $amount,
            'status' => 'pending',
            'due_date' => (clone $startsAt)->addDays(7)->toDateString(),
        ]);

        $school->forceFill(['status' => 'active'])->save();

        return response()->json([
            'success' => true,
            'message' => 'Plan assigned to school.',
            'data' => new SubscriptionResource($subscription->load('plan')),
        ], 201);
    }
}
