<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Fee\StoreFeeStructureRequest;
use App\Http\Resources\FeeStructureResource;
use App\Models\FeeStructure;
use Illuminate\Http\JsonResponse;

class FeeStructureController extends Controller
{
    public function index(): JsonResponse
    {
        $structures = FeeStructure::with('schoolClass')->where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'data' => FeeStructureResource::collection($structures),
        ]);
    }

    public function store(StoreFeeStructureRequest $request): JsonResponse
    {
        $structure = FeeStructure::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Fee structure created successfully.',
            'data' => new FeeStructureResource($structure),
        ], 201);
    }

    public function update(StoreFeeStructureRequest $request, FeeStructure $feeStructure): JsonResponse
    {
        $feeStructure->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Fee structure updated successfully.',
            'data' => new FeeStructureResource($feeStructure->fresh('schoolClass')),
        ]);
    }

    public function destroy(FeeStructure $feeStructure): JsonResponse
    {
        $feeStructure->delete();

        return response()->json([
            'success' => true,
            'message' => 'Fee structure deleted.',
        ]);
    }
}
