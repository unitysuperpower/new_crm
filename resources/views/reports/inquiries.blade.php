<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Assigned Inquiries Report</title>
    <style>
        @page { margin: 34px 38px 42px; }
        body { color: #17202a; font-family: "DejaVu Sans", sans-serif; font-size: 9px; line-height: 1.45; }
        .header { border-bottom: 2px solid #9b1c31; margin-bottom: 18px; padding-bottom: 12px; }
        .header-table { border-collapse: collapse; width: 100%; }
        .header-table td { border: 0; padding: 0; vertical-align: bottom; }
        .logo { height: 50px; margin-bottom: 5px; }
        .brand { color: #9b1c31; font-size: 18px; font-weight: bold; }
        .subtitle { color: #667085; font-size: 8px; letter-spacing: 0.5px; text-transform: uppercase; }
        .generated { color: #667085; text-align: right; }
        h1 { font-size: 16px; margin: 0 0 14px; text-align: center; text-transform: uppercase; }
        .filters { background: #f4f6f8; border: 1px solid #d0d5dd; margin-bottom: 13px; padding: 8px 10px; }
        .filter-table { border-collapse: collapse; width: 100%; }
        .filter-table td { border: 0; padding: 2px 8px 2px 0; }
        .filter-label { color: #667085; font-size: 8px; text-transform: uppercase; }
        .summary { margin: 0 0 13px; }
        .count { border: 1px solid #d0d5dd; display: inline-block; margin: 0 5px 5px 0; min-width: 62px; padding: 6px 8px; }
        .count strong { color: #9b1c31; font-size: 13px; }
        .report-table { border-collapse: collapse; table-layout: fixed; width: 100%; }
        .report-table thead { display: table-header-group; }
        .report-table tr { page-break-inside: avoid; }
        .report-table th { background: #9b1c31; color: #fff; font-size: 8px; font-weight: bold; text-align: left; text-transform: uppercase; }
        .report-table th, .report-table td { border: 1px solid #cfd5dc; padding: 6px; vertical-align: top; word-wrap: break-word; }
        .report-table tbody tr:nth-child(even) { background: #f7f8fa; }
        .student { font-weight: bold; }
        .muted { color: #667085; }
        .empty { padding: 22px !important; text-align: center; }
        .note { color: #667085; font-size: 8px; margin-top: 12px; }
        .footer { bottom: -25px; color: #667085; font-size: 8px; left: 0; position: fixed; right: 0; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <table class="header-table">
            <tr>
                <td>
                    @if ($logoData)
                        <img class="logo" src="{{ $logoData }}" alt="Aurea Education">
                    @endif
                    <div class="brand">Aurea Education</div>
                    <div class="subtitle">Academic Admissions and Student Services</div>
                </td>
                <td class="generated">
                    <strong>Generated</strong><br>{{ $generatedAt }}
                </td>
            </tr>
        </table>
    </div>

    <h1>Assigned Inquiries Report</h1>

    <div class="filters">
        <table class="filter-table">
            <tr>
                <td><span class="filter-label">Campus</span><br><strong>{{ $filters['campus'] ?? 'All campuses' }}</strong></td>
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
            <col style="width:4%"><col style="width:14%"><col style="width:15%"><col style="width:12%"><col style="width:11%">
            <col style="width:12%"><col style="width:10%"><col style="width:9%"><col style="width:13%">
        </colgroup>
        <thead>
            <tr>
                <th>#</th>
                <th>Student</th>
                <th>Contact</th>
                <th>Program</th>
                <th>Campus</th>
                <th>Assigned user</th>
                <th>Status</th>
                <th>Department</th>
                <th>Last updated</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($inquiries as $inquiry)
                <tr>
                    <td>{{ $inquiry['id'] }}</td>
                    <td class="student">{{ $inquiry['name'] }}</td>
                    <td>{{ $inquiry['phone'] }}<br><span class="muted">{{ $inquiry['email'] ?: 'No email' }}</span></td>
                    <td>{{ $inquiry['program'] ?? 'Not set' }}</td>
                    <td>{{ $inquiry['campus'] ?? 'Not set' }}</td>
                    <td>{{ $inquiry['assigned_user'] ?? 'Unassigned' }}</td>
                    <td>{{ ucfirst($inquiry['status']) }}</td>
                    <td>{{ ucfirst($inquiry['department']) }}</td>
                    <td>{{ $inquiry['updated_at'] }}</td>
                </tr>
            @empty
                <tr><td class="empty" colspan="9">No inquiries match the selected report filters.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="note">
        This report is generated from inquiry records available to the signed-in employee and uses the inquiry last-updated date for date filtering.
    </div>
    <div class="footer">Aurea Education CRM &middot; Confidential internal report</div>
</body>
</html>
