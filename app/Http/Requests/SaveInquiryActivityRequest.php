<?php

namespace App\Http\Requests;

use App\Support\InquiryOptions;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveInquiryActivityRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $inquiry = $this->route('inquiry');

        if (! $this->user()?->can('update', $inquiry)) {
            return;
        }

        $this->merge([
            'name' => $this->input('name', $inquiry->name),
            'phone' => $this->input('phone', $inquiry->phone),
            'email' => $this->input('email', $inquiry->email),
            'city' => $this->input('city', $inquiry->city),
            'address' => $this->input('address', $inquiry->address),
            'source' => $this->input('source', $inquiry->source),
            'program_id' => $this->input('program_id', $inquiry->program_id),
            'previous_program' => $this->input('previous_program', $inquiry->previous_program),
            'campus_id' => $this->input('campus_id', $inquiry->campus_id),
            'message' => $this->input('message', $inquiry->message),
            'status' => $this->input('status', $inquiry->status),
            'department' => $this->input('department', $inquiry->department),
            'postal_communication' => $this->input('postal_communication', $inquiry->postal_communication),
            'next_follow_up_at' => $this->input('next_follow_up_at', $inquiry->next_follow_up_at?->format('Y-m-d')),
        ]);
    }

    public function authorize(): bool
    {
        $inquiry = $this->route('inquiry');

        return $this->user()?->can('update', $inquiry)
            || $this->user()?->can('createStream', $inquiry);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $canUpdate = $this->user()?->can('update', $this->route('inquiry')) ?? false;

        return [
            'name' => $canUpdate ? ['required', 'string', 'max:255'] : ['prohibited'],
            'phone' => $canUpdate ? ['required', 'string', 'max:50'] : ['prohibited'],
            'email' => $canUpdate ? ['nullable', 'email', 'max:255'] : ['prohibited'],
            'city' => $canUpdate ? ['nullable', 'string', 'max:255'] : ['prohibited'],
            'address' => $canUpdate ? ['nullable', 'string', 'max:2000'] : ['prohibited'],
            'source' => $canUpdate ? ['nullable', 'string', 'max:255'] : ['prohibited'],
            'program_id' => $canUpdate ? ['nullable', 'exists:programs,id'] : ['prohibited'],
            'previous_program' => $canUpdate ? ['nullable', 'string', 'max:255'] : ['prohibited'],
            'campus_id' => $canUpdate
                ? ['nullable', Rule::exists('campuses', 'id')->where('is_active', true)]
                : ['prohibited'],
            'message' => $canUpdate ? ['nullable', 'string', 'max:5000'] : ['prohibited'],
            'status' => $canUpdate
                ? ['required', 'string', Rule::in(InquiryOptions::STATUSES)]
                : ['prohibited'],
            'department' => $canUpdate
                ? ['required', 'string', Rule::in(InquiryOptions::DEPARTMENTS)]
                : ['prohibited'],
            'postal_communication' => $canUpdate
                ? ['required', 'string', Rule::in(InquiryOptions::POSTAL_COMMUNICATIONS)]
                : ['prohibited'],
            'next_follow_up_at' => $canUpdate ? ['nullable', 'date'] : ['prohibited'],
            'response' => [
                'required',
                'string',
                'min:2',
                'max:5000',
            ],
        ];
    }
}
