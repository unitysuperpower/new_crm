<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateInquiryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $inquiry = $this->route('inquiry');

        return $this->user()?->can('update', $inquiry) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:pending,not sure,not interested,not eligible,interested,call back,distance problem,not responding,for job,will visit,visited,p.o,online/short course,e-t paid,admission fee paid,master calsses'],
            'department' => ['required', 'string', 'in:admission,academics,accouts'],
            'next_follow_up_at' => ['nullable', 'date'],
        ];
    }
}
