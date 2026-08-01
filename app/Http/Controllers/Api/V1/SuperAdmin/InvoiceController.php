<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\MarkInvoicePaidRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

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

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'tenant_id' => ['required', 'exists:tenants,id'],
            'amount' => ['required', 'numeric', 'min:1'], // in PKR
            'due_date' => ['required', 'date'],
        ]);

        $tenant = Tenant::findOrFail($request->input('tenant_id'));
        $amountPaisa = (int) (round((float) $request->input('amount') * 100));
        $dueDate = Carbon::parse($request->input('due_date'));
        $invNum = 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(6));

        $invoice = Invoice::create([
            'tenant_id' => $tenant->id,
            'subscription_id' => null,
            'invoice_number' => $invNum,
            'amount' => $amountPaisa,
            'tax_amount' => 0,
            'total_amount' => $amountPaisa,
            'status' => 'pending',
            'due_date' => $dueDate,
        ]);

        // Dispatch In-App Notification to Tenant School Principal
        try {
            $tenant->run(function () use ($invoice, $dueDate) {
                $user = User::first();
                if ($user) {
                    Notification::create([
                        'title' => 'New Subscription Invoice Issued',
                        'message' => "Invoice #{$invoice->invoice_number} for Rs. " . number_format($invoice->total_amount / 100) . " has been issued. Due Date: " . $dueDate->format('d/m/Y') . ".",
                        'type' => 'fee_reminder',
                        'channel' => 'app',
                        'recipient_type' => 'all',
                        'recipient_id' => null,
                        'sent_at' => now(),
                        'status' => 'sent',
                        'created_by' => $user->id,
                    ]);
                }
            });
        } catch (\Throwable $e) {
            Log::warning('Invoice notification delivery skipped: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Invoice generated and school notified successfully.',
            'data' => new InvoiceResource($invoice->load('tenant')),
        ], 201);
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
