<?php

namespace App\Http\Requests;

use App\Models\Page;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Page|null $page */
        $page = $this->route('page');

        return [
            'slug' => [
                'sometimes',
                'required',
                'string',
                Rule::unique('pages')
                    ->ignore($page?->id)
                    ->where(function ($query) use ($page) {
                        if (! $page) {
                            return $query;
                        }
                        return $query
                            ->where('owner_type', $page->owner_type)
                            ->where('owner_id', $page->owner_id);
                    }),
            ],
            'title' => ['sometimes', 'required', 'string'],
            'published' => ['sometimes', 'required', 'boolean'],
            'publishedAt' => ['sometimes', 'nullable', 'date'],
            'content' => ['sometimes', 'required', 'array'],
            'content.schemaVersion' => ['required_with:content', 'integer', Rule::in([1])],
            'content.segments' => ['required_with:content', 'array'],
        ];
    }
}
