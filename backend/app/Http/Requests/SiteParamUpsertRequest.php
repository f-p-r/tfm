<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SiteParamUpsertRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => ['required', 'string', 'max:255'],
            'value' => ['required', 'string'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'id' => $this->route('id'),
        ]);
    }

    public function getId(): string
    {
        return $this->input('id');
    }

    public function getValue(): string
    {
        return $this->input('value');
    }
}
