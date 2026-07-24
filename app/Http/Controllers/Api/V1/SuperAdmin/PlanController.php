<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StorePlanRequest;
use App\Http\Requests\SuperAdmin\UpdatePlanRequest;
use App\Http\Resources\PlanResource;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;

class PlanController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => PlanResource::collection(SubscriptionPlan::orderBy('price_monthly')->get()),
        ]);
    }

    public function store(StorePlanRequest $request): JsonResponse
    {
        $plan = SubscriptionPlan::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Plan created successfully.',
            'data' => new PlanResource($plan),
        ], 201);
    }

    public function update(UpdatePlanRequest $request, SubscriptionPlan $plan): JsonResponse
    {
        $plan->fill($request->validated())->save();

        return response()->json([
            'success' => true,
            'message' => 'Plan updated successfully.',
            'data' => new PlanResource($plan->fresh()),
        ]);
    }
}
