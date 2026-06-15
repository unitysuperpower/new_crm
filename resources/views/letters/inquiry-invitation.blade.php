<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Invitation Letter</title>
    <style>
        @page { margin: 42px 52px; }
        body { color: #17202a; font-family: "DejaVu Sans", sans-serif; font-size: 12px; line-height: 1.65; }
        .header { border-bottom: 2px solid #9b1c31; margin-bottom: 28px; padding-bottom: 16px; }
        .logo { height: 58px; margin-bottom: 8px; }
        .brand { color: #9b1c31; font-size: 20px; font-weight: bold; }
        .subtitle { color: #667085; font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase; }
        .date { margin-bottom: 24px; text-align: right; }
        h1 { font-size: 17px; margin: 18px 0; text-align: center; text-transform: uppercase; }
        .details { border-collapse: collapse; margin: 22px 0; width: 100%; }
        .details th, .details td { border: 1px solid #d0d5dd; padding: 8px 10px; text-align: left; vertical-align: top; }
        .details th { background: #f4f6f8; width: 28%; }
        .closing { margin-top: 28px; }
        .signature { margin-top: 42px; }
        .note { color: #667085; font-size: 10px; margin-top: 34px; }
    </style>
</head>
<body>
    <div class="header">
        @if ($logoData)
            <img class="logo" src="{{ $logoData }}" alt="Aurea Education">
        @endif
        <div class="brand">Aurea Education</div>
        <div class="subtitle">Academic Admissions and Student Services</div>
    </div>

    <div class="date">Date: {{ now()->format('F d, Y') }}</div>
    <div>To,<br><strong>{{ $inquiry->name }}</strong><br>{{ $inquiry->address ?: 'Address not provided' }}</div>

    <h1>Invitation to Visit and Explore Academic Opportunities</h1>

    <p>Dear {{ $inquiry->name }},</p>

    <p>
        Thank you for your interest in <strong>{{ $programName }}</strong>. On behalf of Aurea Education,
        we are pleased to invite you to visit <strong>{{ $campusName }}</strong> to learn more about the
        program, meet our admissions team, and discuss your academic goals and available study pathways.
    </p>

    <p>Your inquiry details are recorded as follows:</p>

    <table class="details">
        <tr><th>Student name</th><td>{{ $inquiry->name }}</td></tr>
        <tr><th>Phone</th><td>{{ $inquiry->phone }}</td></tr>
        <tr><th>Email</th><td>{{ $inquiry->email ?: 'Not provided' }}</td></tr>
        <tr><th>Program</th><td>{{ $programName }}</td></tr>
        <tr><th>Campus</th><td>{{ $campusName }}</td></tr>
        <tr><th>Address</th><td>{{ $inquiry->address ?: 'Not provided' }}</td></tr>
    </table>

    <p>
        During your visit, our team will be available to explain program structure, eligibility,
        schedules, fees, and the application process. Please bring any relevant academic documents
        that may help us provide suitable guidance.
    </p>

    <p>
        This invitation is issued for counselling and campus-visit purposes and does not constitute
        confirmation of admission. Admission remains subject to eligibility, document verification,
        and completion of the required process.
    </p>

    <div class="closing">
        We look forward to welcoming you and assisting you with your educational journey.
    </div>

    <div class="signature">
        Sincerely,<br>
        <strong>Admissions Office</strong><br>
        Aurea Education<br>
        {{ $campusName }}
    </div>

    <div class="note">Inquiry reference: AE-{{ str_pad((string) $inquiry->id, 6, '0', STR_PAD_LEFT) }}</div>
</body>
</html>
