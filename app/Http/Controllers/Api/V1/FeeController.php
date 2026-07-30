<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Fee\CollectFeeRequest;
use App\Http\Resources\FeePaymentResource;
use App\Models\FeePayment;
use App\Models\Student;
use App\Services\FeeService;
use App\Services\ReceiptPdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class FeeController extends Controller
{
    public function __construct(
        protected FeeService $feeService,
        protected ReceiptPdfService $pdfService,
    ) {}

    public function pending(Request $request): JsonResponse
    {
        $payments = FeePayment::with(['student.user', 'student.schoolClass', 'feeStructure'])
            ->whereIn('status', ['pending', 'partial', 'overdue'])
            ->when($request->class_id, fn ($q) => $q->whereHas('student', fn ($s) => $s->where('class_id', $request->class_id)))
            ->orderBy('due_date')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => FeePaymentResource::collection($payments),
            'meta' => ['total' => $payments->total(), 'per_page' => $payments->perPage()],
        ]);
    }

    public function studentFees(string $studentId): JsonResponse
    {
        $student = Student::with(['user', 'schoolClass'])->findOrFail($studentId);
        $payments = FeePayment::with(['feeStructure'])
            ->where('student_id', $studentId)
            ->orderByDesc('month_year')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'student' => [
                    'id' => $student->id,
                    'name' => $student->user->name,
                    'admission_number' => $student->admission_number,
                    'class' => $student->schoolClass?->name,
                ],
                'payments' => FeePaymentResource::collection($payments),
                'outstanding' => $this->feeService->calculateOutstanding($studentId),
            ],
        ]);
    }

    public function collect(CollectFeeRequest $request): JsonResponse
    {
        $payments = $this->feeService->collectFee(
            $request->validated(),
            auth()->id()
        );

        return response()->json([
            'success' => true,
            'message' => 'Payment collected successfully.',
            'data' => FeePaymentResource::collection(collect($payments)),
        ], 201);
    }

    public function bulkGenerate(Request $request): JsonResponse
    {
        $request->validate([
            'month_year' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'class_id' => ['nullable', 'uuid'],
        ]);

        $count = $this->feeService->generateBulkMonthlyFees(
            $request->month_year,
            $request->class_id
        );

        return response()->json([
            'success' => true,
            'message' => "Generated {$count} fee records.",
            'data' => ['count' => $count],
        ]);
    }

    public function receipt(string $id): JsonResponse
    {
        $payment = FeePayment::with(['student.user', 'student.schoolClass', 'feeStructure', 'receivedBy'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new FeePaymentResource($payment),
        ]);
    }

    public function receiptPdf(string $id): Response
    {
        $payment = FeePayment::with(['student.user', 'student.schoolClass', 'feeStructure', 'receivedBy'])
            ->findOrFail($id);

        $pdf = $this->pdfService->generateReceiptPdf($payment);

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "inline; filename=receipt-{$payment->receipt_number}.pdf",
        ]);
    }

    public function studentReceipts(string $studentId): JsonResponse
    {
        $payments = FeePayment::with(['feeStructure'])
            ->where('student_id', $studentId)
            ->whereNotNull('receipt_number')
            ->orderByDesc('paid_date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => FeePaymentResource::collection($payments),
        ]);
    }

    public function defaulters(): JsonResponse
    {
        $defaulters = $this->feeService->getDefaulters();

        return response()->json([
            'success' => true,
            'data' => $defaulters->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->user->name,
                'class' => $s->schoolClass?->name,
                'outstanding' => $this->feeService->calculateOutstanding($s->id),
                'overdue_months' => $s->feePayments->where('status', 'overdue')->count(),
            ]),
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $monthYear = $request->get('month_year', now()->format('Y-m'));

        $totalDue = FeePayment::where('month_year', $monthYear)->sum('amount_due');
        $totalPaid = FeePayment::where('month_year', $monthYear)->whereIn('status', ['paid', 'partial'])->sum('amount_paid');
        $pending = FeePayment::where('month_year', $monthYear)->whereIn('status', ['pending', 'partial'])->count();
        $overdue = FeePayment::where('month_year', $monthYear)->where('status', 'overdue')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'month_year' => $monthYear,
                'total_due' => $totalDue,
                'total_paid' => $totalPaid,
                'collection_rate' => $totalDue > 0 ? round(($totalPaid / $totalDue) * 100, 1) : 0,
                'pending_count' => $pending,
                'overdue_count' => $overdue,
            ],
        ]);
    }
}
