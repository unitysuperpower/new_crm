<?php

namespace App\Http\Requests;

use App\Models\Program;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProgramRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', Program::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'campus_id' => ['required', Rule::exists('campuses', 'id')->where('is_active', true)],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('programs', 'name')->where(fn ($query) => $query->where('campus_id', $this->input('campus_id'))),
            ],
            'duration' => ['nullable', 'string', 'max:255'],
            'fee' => ['required', 'numeric', 'min:0', 'max:999999.99'],
        ];
    }
}
