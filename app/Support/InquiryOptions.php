<?php

namespace App\Support;

final class InquiryOptions
{
    public const STATUSES = [
        'pending',
        'not sure',
        'not interested',
        'not eligible',
        'interested',
        'call back',
        'distance problem',
        'not responding',
        'for job',
        'will visit',
        'visited',
        'p.o',
        'online/short course',
        'e-t paid',
        'admission fee paid',
        'master classes',
    ];

    public const DEPARTMENTS = ['admission', 'academics', 'accounts'];

    public const POSTAL_COMMUNICATIONS = ['pending', 'send'];
}
