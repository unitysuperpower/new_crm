<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStreamRequest;
use App\Models\Inquiry;
use App\Models\Stream;
use Illuminate\Http\RedirectResponse;

class StreamController extends Controller
{
    // The store method handles the creation of a new stream entry for a specific inquiry by validating the incoming request data, creating a new Stream record in the database linked to the corresponding inquiry and user, and then redirecting back to the previous page with a success message, ensuring that only authorized users can perform this action and that the stream is properly associated with the correct inquiry.
    public function store(StoreStreamRequest $request, Inquiry $inquiry): RedirectResponse
    {
        Stream::create([
            'response' => $request->validated('response'),
            'user_id' => $request->user()->id,
            'inquiry_id' => $inquiry->id,
            'last_status' => $inquiry->status, // Assuming you want to store the last status of the inquiry in the stream
        ]);

        $inquiry->update(['last_activity_at' => now()]);

        return back()->with('success', 'Discussion added.');
    }
}
