<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Fee Receipt - {{ $payment->receipt_number }}</title>
    <style>
        body { font-family: sans-serif; font-size: 13px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: bold; }
        .details-table, .breakdown-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .breakdown-table th, .breakdown-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        .breakdown-table th { background-color: #f2f2f2; }
        .total { font-weight: bold; font-size: 14px; text-align: right; }
        .footer { margin-top: 40px; width: 100%; }
        .signature { text-align: right; border-top: 1px dashed #666; width: 200px; float: right; padding-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">{{ $schoolName }}</div>
        <div>FEE RECEIPT</div>
    </div>

    <table class="details-table">
        <tr>
            <td><strong>Receipt No:</strong> {{ $payment->receipt_number }}</td>
            <td><strong>Date:</strong> {{ optional($payment->paid_date)->format('Y-m-d') }}</td>
        </tr>
        <tr>
            <td><strong>Student Name:</strong> {{ $payment->student->user->name ?? 'N/A' }}</td>
            <td><strong>Admission No:</strong> {{ $payment->student->admission_number ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td><strong>Class:</strong> {{ $payment->student->schoolClass->name ?? 'N/A' }}</td>
            <td><strong>Month/Year:</strong> {{ $payment->month_year }}</td>
        </tr>
    </table>

    <table class="breakdown-table">
        <thead>
            <tr>
                <th>Description</th>
                <th>Fee Amount</th>
                <th>Fine</th>
                <th>Discount</th>
                <th>Amount Paid</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $payment->feeStructure->name ?? 'Tuition Fee' }}</td>
                <td>PKR {{ number_format($payment->amount_due / 100, 2) }}</td>
                <td>PKR {{ number_format($payment->fine_amount / 100, 2) }}</td>
                <td>PKR {{ number_format($payment->discount_amount / 100, 2) }}</td>
                <td>PKR {{ number_format($payment->amount_paid / 100, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="total">
        Total Paid: PKR {{ number_format($payment->amount_paid / 100, 2) }}
    </div>

    <div class="footer">
        <div class="signature">
            Received By: {{ $payment->receivedBy->name ?? 'Accountant' }}
        </div>
    </div>
</body>
</html>
