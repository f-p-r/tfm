<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OwnerHomePageSetRequest extends FormRequest
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
            'homePageId' => ['nullable', 'integer'],
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

    public function getHomePageId(): ?int
    {
        $value = $this->input('homePageId');
        return $value === null ? null : (int) $value;
    }
}
