<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StaffSalary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffSalaryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = StaffSalary::with('teacher');

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->input('teacher_id'));
        }

        if ($request->has('month_year')) {
            $query->where('month_year', $request->input('month_year'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $salaries = $query->orderBy('month_year', 'desc')->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $salaries->items(),
            'meta' => [
                'current_page' => $salaries->currentPage(),
                'per_page' => $salaries->perPage(),
                'total' => $salaries->total(),
                'last_page' => $salaries->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'teacher_id' => 'required|uuid|exists:users,id',
            'month_year' => 'required|string|max:10', // YYYY-MM
            'basic_salary' => 'required|integer|min:0', // in paisa
            'allowances' => 'nullable|integer|min:0',
            'deductions' => 'nullable|integer|min:0',
            'payment_method' => 'nullable|string|max:50',
            'status' => 'required|string|in:pending,paid,cancelled',
            'paid_date' => 'nullable|date',
        ]);

        $allowances = $validated['allowances'] ?? 0;
        $deductions = $validated['deductions'] ?? 0;
        $validated['net_salary'] = $validated['basic_salary'] + $allowances - $deductions;

        $salary = StaffSalary::create($validated);
        $salary->load('teacher');

        return response()->json([
            'success' => true,
            'message' => 'Staff salary record created successfully.',
            'data' => $salary,
        ], 201);
    }

    public function show(StaffSalary $salary): JsonResponse
    {
        $salary->load('teacher');

        return response()->json([
            'success' => true,
            'data' => $salary,
        ]);
    }

    public function update(Request $request, StaffSalary $salary): JsonResponse
    {
        $validated = $request->validate([
            'basic_salary' => 'sometimes|integer|min:0',
            'allowances' => 'sometimes|integer|min:0',
            'deductions' => 'sometimes|integer|min:0',
            'payment_method' => 'nullable|string|max:50',
            'status' => 'sometimes|string|in:pending,paid,cancelled',
            'paid_date' => 'nullable|date',
        ]);

        $basic = $validated['basic_salary'] ?? $salary->basic_salary;
        $allowances = $validated['allowances'] ?? $salary->allowances;
        $deductions = $validated['deductions'] ?? $salary->deductions;
        $validated['net_salary'] = $basic + $allowances - $deductions;

        $salary->update($validated);
        $salary->load('teacher');

        return response()->json([
            'success' => true,
            'message' => 'Staff salary record updated successfully.',
            'data' => $salary,
        ]);
    }

    public function destroy(StaffSalary $salary): JsonResponse
    {
        $salary->delete();

        return response()->json([
            'success' => true,
            'message' => 'Staff salary record deleted successfully.',
        ]);
    }
}
