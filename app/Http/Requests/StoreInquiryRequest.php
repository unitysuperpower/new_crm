<?php

namespace App\Http\Requests;

use App\Models\Inquiry;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreInquiryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', Inquiry::class) ?? false;
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
            'status' => ['required', 'string', 'in:pending,not sure,not interested,not eligible,interested,call back,distance problem,not responding,for job,will visit,visited,p.o,online/short course,e-t paid,admission fee paid,master calsses'],
            'assigned_user_id' => ['nullable', 'exists:users,id'],
            'department' => ['required', 'string', 'in:admission,academics,accouts'],
            'next_follow_up_at' => ['nullable', 'date'],
            'message' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
