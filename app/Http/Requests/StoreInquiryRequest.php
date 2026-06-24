<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\Inquiry;
use App\Support\InquiryOptions;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreInquiryRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->user()?->role !== UserRole::SuperAdmin) {
            $this->merge([
                'assigned_user_id' => $this->user()?->id,
                'department' => $this->user()?->department ?? 'admission',
            ]);
        }
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', Inquiry::class) ?? false;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $validator->errors()->has('phone')) {
                $phone = $this->normalizePhone($this->input('phone'));
                $phoneAlreadyExists = $phone !== '' && Inquiry::query()
                    ->pluck('phone')
                    ->contains(fn (string $value): bool => $this->normalizePhone($value) === $phone);

                if ($phoneAlreadyExists) {
                    $validator->errors()->add(
                        'phone',
                        'An inquiry already exists with this phone number. Search for the student record instead of creating a duplicate.',
                    );
                }
            }

            if (! $validator->errors()->has('email')) {
                $email = $this->normalizeEmail($this->input('email'));

                if ($email !== '' && Inquiry::query()
                    ->whereRaw('LOWER(email) = ?', [$email])
                    ->exists()) {
                    $validator->errors()->add(
                        'email',
                        'An inquiry already exists with this email address. Search for the student record instead of creating a duplicate.',
                    );
                }
            }
        });
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:2000'],
            'source' => ['nullable', 'string', 'max:255'],
            'program_id' => ['nullable', 'exists:programs,id'],
            'previous_program' => ['nullable', 'string', 'max:255'],
            'campus' => ['nullable', 'string', 'max:255'],
            'campus_id' => [
                'nullable',
                Rule::exists('campuses', 'id')->where('is_active', true),
            ],
            'status' => ['required', 'string', Rule::in(InquiryOptions::STATUSES)],
            'assigned_user_id' => ['required', 'exists:users,id'],
            'department' => ['required', 'string', Rule::in(InquiryOptions::DEPARTMENTS)],
            'next_follow_up_at' => ['nullable', 'date'],
            'message' => ['nullable', 'string', 'max:5000'],
        ];
    }

    private function normalizePhone(?string $phone): string
    {
        return preg_replace('/\D+/', '', $phone ?? '') ?? '';
    }

    private function normalizeEmail(?string $email): string
    {
        return mb_strtolower(trim($email ?? ''));
    }
}
