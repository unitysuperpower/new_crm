<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Assigned Inquiries Report</title>
    <style>
        body { color: #17202a; font-family: "DejaVu Sans", sans-serif; font-size: 10px; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        .muted { color: #667085; }
        .summary { margin: 18px 0 12px; }
        .count { border: 1px solid #d0d5dd; display: inline-block; margin: 0 6px 6px 0; padding: 7px 10px; }
        .count strong { font-size: 14px; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #eef2f6; text-align: left; }
        th, td { border: 1px solid #d0d5dd; padding: 6px; vertical-align: top; }
        .filters { margin-top: 8px; }
    </style>
</head>
<body>
    <h1>Aurea Education - Assigned Inquiries Report</h1>
    <div class="muted">Generated {{ $generatedAt }} using inquiry updated dates.</div>
    <div class="filters">
        Campus: {{ $filters['campus'] ?? 'All' }} |
        Status: {{ $filters['status'] ?? 'All' }} |
        User: {{ $filters['user'] ?? 'All permitted users' }} |
        Date: {{ $filters['dateFrom'] ?? 'Any' }} to {{ $filters['dateTo'] ?? 'Any' }}
    </div>

    <div class="summary">
        <span class="count"><strong>{{ $total }}</strong><br>Total</span>
        @foreach ($statusCounts as $status => $count)
            <span class="count"><strong>{{ $count }}</strong><br>{{ ucfirst($status) }}</span>
        @endforeach
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th><th>Student</th><th>Contact</th><th>Program</th><th>Campus</th>
                <th>Assigned user</th><th>Status</th><th>Department</th><th>Last updated</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($inquiries as $inquiry)
                <tr>
                    <td>{{ $inquiry['id'] }}</td>
                    <td>{{ $inquiry['name'] }}</td>
                    <td>{{ $inquiry['phone'] }}<br>{{ $inquiry['email'] }}</td>
                    <td>{{ $inquiry['program'] ?? 'Not set' }}</td>
                    <td>{{ $inquiry['campus'] ?? 'Not set' }}</td>
                    <td>{{ $inquiry['assigned_user'] ?? 'Unassigned' }}</td>
                    <td>{{ ucfirst($inquiry['status']) }}</td>
                    <td>{{ ucfirst($inquiry['department']) }}</td>
                    <td>{{ $inquiry['updated_at'] }}</td>
                </tr>
            @empty
                <tr><td colspan="9" style="text-align:center">No inquiries match these filters.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
