<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\FeePayment;
use Barryvdh\DomPDF\Facade\Pdf;

class ReceiptPdfService
{
    public function generateReceiptPdf(FeePayment $payment): string
    {
        $payment->load(['student.user', 'student.schoolClass', 'feeStructure', 'receivedBy']);

        $pdf = Pdf::loadView('pdf.receipt', [
            'payment' => $payment,
            'schoolName' => tenant('name') ?? 'School Management System',
        ]);

        return $pdf->output();
    }
}
