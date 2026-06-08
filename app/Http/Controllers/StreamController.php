<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStreamRequest;
use App\Models\Inquiry;
use App\Models\Stream;
use Illuminate\Http\RedirectResponse;

class StreamController extends Controller
{
    public function store(StoreStreamRequest $request, Inquiry $inquiry): RedirectResponse
    {
        Stream::create([
            'response' => $request->validated('response'),
            'user_id' => $request->user()->id,
            'inquiry_id' => $inquiry->id,
        ]);

        return back()->with('success', 'Discussion added.');
    }
}
