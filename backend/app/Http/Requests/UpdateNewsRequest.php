<?php

namespace App\Http\Requests;

use App\Models\News;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateNewsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization will be handled in the controller
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'scope_type' => [
                'prohibited',
                function ($attribute, $value, $fail) {
                    if ($value !== null) {
                        $fail('No se permite cambiar el scope_type de una noticia.');
                    }
                },
            ],
            'scope_id' => [
                'prohibited',
                function ($attribute, $value, $fail) {
                    if ($value !== null) {
                        $fail('No se permite cambiar el scope_id de una noticia.');
                    }
                },
            ],
            'game_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:games,id',
                function ($attribute, $value, $fail) {
                    $scopeType = $this->input('scope_type');

                    if (!$scopeType) {
                        return; // Skip validation if scope_type not being updated
                    }

                    // Global cannot have game_id
                    if ($scopeType == News::SCOPE_GLOBAL && $value !== null) {
                        $fail('Las noticias globales no pueden tener game_id asignado.');
                    }

                    // Game scope should not manually set game_id (auto-assigned)
                    if ($scopeType == News::SCOPE_GAME && $value !== null) {
                        $fail('Para scope de juego, el game_id se asigna automáticamente.');
                    }
                },
            ],
            'slug' => ['sometimes', 'string', 'max:255'],
            'title' => ['sometimes', 'string', 'max:255'],
            'text' => ['sometimes', 'string'],
            'content' => ['sometimes', 'nullable', 'array'],
            'content.schemaVersion' => ['required_with:content', 'integer', Rule::in([1])],
            'content.segments' => ['required_with:content', 'array'],
            'content.classNames' => ['sometimes', 'nullable', 'string'],
            'published' => ['sometimes', 'boolean'],
            'published_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
