<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\MarkInvoicePaidRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::query()->with('tenant');

        $query->when($request->input('status'), fn ($q, $status) => $q->where('status', $status));
        $query->when($request->input('tenant_id'), fn ($q, $id) => $q->where('tenant_id', $id));

        $invoices = $query->latest('created_at')->paginate((int) $request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => InvoiceResource::collection($invoices->items()),
            'meta' => [
                'current_page' => $invoices->currentPage(),
                'per_page' => $invoices->perPage(),
                'total' => $invoices->total(),
                'last_page' => $invoices->lastPage(),
            ],
        ]);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new InvoiceResource($invoice->load('tenant', 'subscription')),
        ]);
    }

    public function markPaid(MarkInvoicePaidRequest $request, Invoice $invoice): JsonResponse
    {
        if ($invoice->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Invoice is already paid.',
            ], 422);
        }

        $invoice->forceFill([
            'status' => 'paid',
            'paid_at' => $request->filled('paid_at') ? Carbon::parse($request->input('paid_at')) : now(),
            'payment_method' => $request->input('payment_method'),
            'payment_reference' => $request->input('payment_reference'),
        ])->save();

        return response()->json([
            'success' => true,
            'message' => 'Invoice marked as paid.',
            'data' => new InvoiceResource($invoice->fresh('tenant')),
        ]);
    }
}
