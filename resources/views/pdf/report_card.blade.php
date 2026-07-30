<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 11px; color: #1e293b; background: #fff; }
        .header { text-align: center; padding: 20px 0 12px; border-bottom: 3px solid #10b981; }
        .header h1 { font-size: 22px; color: #10b981; font-weight: bold; }
        .header h2 { font-size: 13px; color: #475569; margin-top: 4px; }
        .header p { font-size: 10px; color: #94a3b8; margin-top: 2px; }
        .student-info { display: flex; justify-content: space-between; padding: 14px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .student-info .block { line-height: 1.8; }
        .student-info .label { font-weight: bold; color: #64748b; }
        .section-title { background: #10b981; color: white; padding: 6px 20px; font-weight: bold; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin: 0; }
        th { background: #f1f5f9; color: #475569; font-weight: bold; padding: 8px 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
        td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        tr:nth-child(even) td { background: #f8fafc; }
        .grade-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-weight: bold; font-size: 10px; }
        .grade-A { background: #dcfce7; color: #166534; }
        .grade-B { background: #dbeafe; color: #1e40af; }
        .grade-C { background: #fef9c3; color: #854d0e; }
        .grade-D { background: #fee2e2; color: #991b1b; }
        .grade-F { background: #fecaca; color: #7f1d1d; }
        .summary-box { display: flex; justify-content: space-around; padding: 16px 20px; margin-top: 12px; }
        .summary-item { text-align: center; }
        .summary-item .value { font-size: 24px; font-weight: bold; color: #10b981; }
        .summary-item .label { font-size: 10px; color: #94a3b8; margin-top: 2px; }
        .remarks-box { margin: 12px 20px; padding: 10px 14px; background: #f8fafc; border-left: 4px solid #10b981; border-radius: 4px; }
        .footer { margin-top: 30px; padding: 16px 20px 0; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; }
        .signature-block { text-align: center; }
        .signature-line { width: 140px; border-bottom: 1px solid #475569; margin: 30px auto 4px; }
        .signature-label { font-size: 10px; color: #64748b; }
        .rank-badge { background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 20px; font-weight: bold; }
    </style>
</head>
<body>
<div class="header">
    <h1>{{ $school_name ?? 'EduSuite School' }}</h1>
    <h2>Student Report Card</h2>
    <p>Academic Year: {{ $exam->academic_year }} &nbsp;|&nbsp; Exam: {{ $exam->name }}</p>
</div>

<div class="student-info">
    <div class="block">
        <div><span class="label">Student Name:</span> {{ $student->user->name }}</div>
        <div><span class="label">Admission No:</span> {{ $student->admission_number }}</div>
        <div><span class="label">Class:</span> {{ $student->schoolClass?->name }}</div>
    </div>
    <div class="block">
        <div><span class="label">Roll No:</span> {{ $student->roll_number ?? 'N/A' }}</div>
        <div><span class="label">Exam Period:</span> {{ $exam->start_date?->format('d M Y') }} – {{ $exam->end_date?->format('d M Y') }}</div>
        <div><span class="label">Result Date:</span> {{ $exam->result_date?->format('d M Y') ?? 'Pending' }}</div>
    </div>
</div>

<div class="section-title">Subject-wise Results</div>
<table>
    <thead>
        <tr>
            <th>Subject</th>
            <th>Total Marks</th>
            <th>Marks Obtained</th>
            <th>Percentage</th>
            <th>Grade</th>
            <th>Remarks</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($results as $result)
        @php
            $pct = $result['total_marks'] > 0 ? round(($result['marks_obtained'] / $result['total_marks']) * 100, 1) : 0;
            $gradeClass = 'grade-' . strtoupper(substr($result['grade'] ?? 'F', 0, 1));
        @endphp
        <tr>
            <td>{{ $result['subject_name'] }}</td>
            <td>{{ $result['total_marks'] }}</td>
            <td><strong>{{ $result['marks_obtained'] }}</strong></td>
            <td>{{ $pct }}%</td>
            <td><span class="grade-badge {{ $gradeClass }}">{{ $result['grade'] }}</span></td>
            <td>{{ $result['remarks'] ?? '' }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

<div class="summary-box">
    <div class="summary-item">
        <div class="value">{{ $summary['total_obtained'] }}</div>
        <div class="label">Total Marks Obtained</div>
    </div>
    <div class="summary-item">
        <div class="value">{{ $summary['total_possible'] }}</div>
        <div class="label">Total Possible</div>
    </div>
    <div class="summary-item">
        <div class="value">{{ $summary['percentage'] }}%</div>
        <div class="label">Overall Percentage</div>
    </div>
    <div class="summary-item">
        <div class="value">{{ $summary['grade'] }}</div>
        <div class="label">Final Grade</div>
    </div>
    @if(isset($summary['rank']))
    <div class="summary-item">
        <div class="value"><span class="rank-badge">#{{ $summary['rank'] }}</span></div>
        <div class="label">Class Rank</div>
    </div>
    @endif
</div>

@if(!empty($summary['remarks']))
<div class="remarks-box">
    <strong>Teacher Remarks:</strong> {{ $summary['remarks'] }}
</div>
@endif

<div class="footer">
    <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Class Teacher</div>
    </div>
    <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Principal</div>
    </div>
    <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Parent / Guardian</div>
    </div>
</div>
</body>
</html>
