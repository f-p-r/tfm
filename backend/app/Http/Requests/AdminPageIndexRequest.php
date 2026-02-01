<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminPageIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ownerType' => ['required', 'string'],
            'ownerId' => ['required', 'integer'],
        ];
    }

    public function getOwnerType(): string
    {
        return $this->input('ownerType');
    }

    public function getOwnerId(): int
    {
        return (int) $this->input('ownerId');
    }
}
