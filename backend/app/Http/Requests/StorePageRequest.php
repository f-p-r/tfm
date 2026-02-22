<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $ownerType = $this->input('ownerType');
        $ownerId = $this->input('ownerId');

        return [
            'ownerType' => ['required', 'string'],
            'ownerId' => ['required', 'integer'],
            'slug' => [
                'required',
                'string',
                Rule::unique('pages')->where(function ($query) use ($ownerType, $ownerId) {
                    return $query
                        ->where('owner_type', $ownerType)
                        ->where('owner_id', $ownerId);
                }),
            ],
            'title' => ['required', 'string'],
            'published' => ['required', 'boolean'],
            'publishedAt' => ['sometimes', 'nullable', 'date'],
            'content' => ['required', 'array'],
            'content.schemaVersion' => ['required', 'integer', Rule::in([1])],
            'content.segments' => ['required', 'array'],
            'content.classNames' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
