<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PublicHomePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ownerType' => ['required', 'string'],
            'ownerSlug' => ['required', 'string'],
        ];
    }

    public function getOwnerType(): string
    {
        return $this->input('ownerType');
    }

    public function getOwnerSlug(): string
    {
        return $this->input('ownerSlug');
    }
}
