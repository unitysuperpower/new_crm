<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Assigned Inquiries Report</title>
    <style>
        @page { margin: 28px 34px 42px; }
        body { color: #151719; font-family: "DejaVu Sans", sans-serif; font-size: 9px; line-height: 1.45; }
        .header { background: #050505; border-radius: 8px; color: #ffffff; margin-bottom: 18px; padding: 18px 20px 16px; text-align: center; }
        .logo { display: block; height: 62px; margin: 0 auto 8px; }
        .brand { color: #d7b75a; font-size: 24px; font-weight: bold; letter-spacing: 1px; line-height: 1; text-align: center; text-transform: uppercase; }
        .subtitle { color: #d7dbe0; font-size: 8px; letter-spacing: 1.1px; margin-top: 5px; text-align: center; text-transform: uppercase; }
        .generated { color: #b8bec6; font-size: 8px; margin-top: 10px; text-align: center; }
        h1 { color: #151719; font-size: 15px; letter-spacing: 0.4px; margin: 0 0 14px; text-align: center; text-transform: uppercase; }
        .filters { background: #f4f5f7; border: 1px solid #d7dce2; border-radius: 6px; margin-bottom: 13px; padding: 9px 10px; text-align: center; }
        .filter-table { border-collapse: collapse; width: 100%; }
        .filter-table td { border: 0; padding: 3px 7px; text-align: center; vertical-align: top; }
        .filter-label { color: #667085; font-size: 8px; text-transform: uppercase; }
        .summary { margin: 0 0 13px; text-align: center; }
        .count { background: #ffffff; border: 1px solid #d0d5dd; border-radius: 5px; display: inline-block; margin: 0 4px 6px; min-width: 68px; padding: 7px 9px; text-align: center; }
        .count strong { color: #0d0f12; font-size: 14px; }
        .report-table { border-collapse: collapse; table-layout: fixed; width: 100%; }
        .report-table thead { display: table-header-group; }
        .report-table tr { page-break-inside: avoid; }
        .report-table th { background: #050505; color: #fff; font-size: 8px; font-weight: bold; text-align: center; text-transform: uppercase; }
        .report-table th, .report-table td { border: 1px solid #cfd5dc; padding: 6px; text-align: center; vertical-align: middle; word-wrap: break-word; }
        .report-table tbody tr:nth-child(even) { background: #f7f8fa; }
        .student { font-weight: bold; }
        .muted { color: #667085; }
        .empty { padding: 22px !important; text-align: center; }
        .note { color: #667085; font-size: 8px; margin-top: 12px; text-align: center; }
        .footer { bottom: -25px; color: #667085; font-size: 8px; left: 0; position: fixed; right: 0; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        @if ($logoData)
            <img class="logo" src="{{ $logoData }}" alt="Aurea Education">
        @endif
        <div class="brand">AUREA</div>
        <div class="subtitle">Academic Admissions and Student Services</div>
        <div class="generated"><strong>Generated:</strong> {{ $generatedAt }}</div>
    </div>

    <h1>Assigned Inquiries Report</h1>

    <div class="filters">
        <table class="filter-table">
            <tr>
                <td><span class="filter-label">Campus</span><br><strong>{{ $filters['campus'] ?? 'All campuses' }}</strong></td>
                <td><span class="filter-label">Program</span><br><strong>{{ $filters['program'] ?? 'All programs' }}</strong></td>
                <td><span class="filter-label">Status</span><br><strong>{{ $filters['status'] ? ucfirst($filters['status']) : 'All statuses' }}</strong></td>
                <td><span class="filter-label">Assigned user</span><br><strong>{{ $filters['user'] ?? 'All permitted users' }}</strong></td>
                <td><span class="filter-label">Updated date range</span><br><strong>{{ $filters['dateFrom'] ?? 'Any date' }} to {{ $filters['dateTo'] ?? 'Any date' }}</strong></td>
            </tr>
        </table>
    </div>

    <div class="summary">
        <span class="count"><strong>{{ $total }}</strong><br>Total inquiries</span>
        @foreach ($statusCounts as $status => $count)
            @if ($count > 0)
                <span class="count"><strong>{{ $count }}</strong><br>{{ ucfirst($status) }}</span>
            @endif
        @endforeach
    </div>

    <table class="report-table">
        <colgroup>
            <col style="width:4%"><col style="width:12%"><col style="width:12%"><col style="width:11%"><col style="width:9%">
            <col style="width:9%"><col style="width:9%"><col style="width:8%"><col style="width:16%"><col style="width:10%">
        </colgroup>
        <thead>
            <tr>
                <th>S.No.</th>
                <th>Student</th>
                <th>Contact</th>
                <th>Program</th>
                <th>Campus</th>
                <th>Assigned user</th>
                <th>Status</th>
                <th>Department</th>
                <th>Latest discussion</th>
                <th>Last updated</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($inquiries as $inquiry)
                <tr>
                    <td>{{ $loop->iteration }}</td>
                    <td class="student">{{ $inquiry['name'] }}</td>
                    <td>{{ $inquiry['phone'] }}<br><span class="muted">{{ $inquiry['email'] ?: 'No email' }}</span></td>
                    <td>{{ $inquiry['program'] ?? 'Not set' }}</td>
                    <td>{{ $inquiry['campus'] ?? 'Not set' }}</td>
                    <td>{{ $inquiry['assigned_user'] ?? 'Unassigned' }}</td>
                    <td>{{ ucfirst($inquiry['status']) }}</td>
                    <td>{{ ucfirst($inquiry['department']) }}</td>
                    <td>
                        {{ $inquiry['latest_comment'] ?? 'No discussion yet' }}
                        @if ($inquiry['latest_comment_at'])
                            <br><span class="muted">{{ $inquiry['latest_comment_user'] ?? 'Employee' }} · {{ $inquiry['latest_comment_at'] }}</span>
                        @endif
                    </td>
                    <td>{{ $inquiry['updated_at'] }}</td>
                </tr>
            @empty
                <tr><td class="empty" colspan="10">No inquiries match the selected report filters.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="note">
        This report is generated from inquiry records available to the signed-in employee and uses the inquiry last-updated date for date filtering.
    </div>
    <div class="footer">Aurea Education CRM &middot; Confidential internal report</div>
</body>
</html>
