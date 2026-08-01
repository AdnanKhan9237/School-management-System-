<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Expense::with(['approvedBy', 'addedBy']);

        if ($request->has('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->has('from_date')) {
            $query->where('expense_date', '>=', $request->input('from_date'));
        }

        if ($request->has('to_date')) {
            $query->where('expense_date', '<=', $request->input('to_date'));
        }

        $expenses = $query->orderBy('expense_date', 'desc')->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $expenses->items(),
            'meta' => [
                'current_page' => $expenses->currentPage(),
                'per_page' => $expenses->perPage(),
                'total' => $expenses->total(),
                'last_page' => $expenses->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'amount' => 'required|integer|min:0', // in paisa
            'expense_date' => 'required|date',
            'payment_method' => 'required|string|max:50',
            'receipt_number' => 'nullable|string|max:100',
        ]);

        $validated['added_by'] = $request->user()?->id;

        $expense = Expense::create($validated);
        $expense->load(['approvedBy', 'addedBy']);

        return response()->json([
            'success' => true,
            'message' => 'Expense logged successfully.',
            'data' => $expense,
        ], 201);
    }

    public function show(Expense $expense): JsonResponse
    {
        $expense->load(['approvedBy', 'addedBy']);

        return response()->json([
            'success' => true,
            'data' => $expense,
        ]);
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $validated = $request->validate([
            'category' => 'sometimes|string|max:100',
            'description' => 'nullable|string|max:500',
            'amount' => 'sometimes|integer|min:0',
            'expense_date' => 'sometimes|date',
            'payment_method' => 'sometimes|string|max:50',
            'receipt_number' => 'nullable|string|max:100',
            'approved_by' => 'nullable|uuid|exists:users,id',
        ]);

        $expense->update($validated);
        $expense->load(['approvedBy', 'addedBy']);

        return response()->json([
            'success' => true,
            'message' => 'Expense updated successfully.',
            'data' => $expense,
        ]);
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $expense->delete();

        return response()->json([
            'success' => true,
            'message' => 'Expense record deleted successfully.',
        ]);
    }
}
