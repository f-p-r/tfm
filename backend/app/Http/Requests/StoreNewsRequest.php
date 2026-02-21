<?php

namespace App\Http\Requests;

use App\Models\News;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNewsRequest extends FormRequest
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
                'required',
                'integer',
                Rule::in([News::SCOPE_GLOBAL, News::SCOPE_ASSOCIATION, News::SCOPE_GAME]),
            ],
            'scope_id' => [
                'nullable',
                'integer',
                function ($attribute, $value, $fail) {
                    $scopeType = $this->input('scope_type');

                    // Global must have null scope_id
                    if ($scopeType == News::SCOPE_GLOBAL && $value !== null) {
                        $fail('El scope_id debe ser null para scope global.');
                    }

                    // Association must have scope_id and it must exist
                    if ($scopeType == News::SCOPE_ASSOCIATION) {
                        if (!$value) {
                            $fail('El scope_id es obligatorio para asociaciones.');
                        } elseif (!\App\Models\Association::where('id', $value)->exists()) {
                            $fail('La asociación especificada no existe.');
                        }
                    }

                    // Game must have scope_id and it must exist
                    if ($scopeType == News::SCOPE_GAME) {
                        if (!$value) {
                            $fail('El scope_id es obligatorio para juegos.');
                        } elseif (!\App\Models\Game::where('id', $value)->exists()) {
                            $fail('El juego especificado no existe.');
                        }
                    }
                },
            ],
            'game_id' => [
                'nullable',
                'integer',
                'exists:games,id',
                function ($attribute, $value, $fail) {
                    $scopeType = $this->input('scope_type');

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
            'slug' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'text' => ['required', 'string'],
            'content' => ['nullable', 'array'],
            'content.schemaVersion' => ['required_with:content', 'integer', Rule::in([1])],
            'content.segments' => ['required_with:content', 'array'],
            'published' => ['required', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'scope_type.required' => 'El tipo de scope es obligatorio.',
            'scope_type.in' => 'El tipo de scope debe ser 1 (global), 2 (asociación) o 3 (juego).',
            'slug.required' => 'El slug es obligatorio.',
            'title.required' => 'El título es obligatorio.',
            'text.required' => 'El texto introductorio es obligatorio.',
            'published.required' => 'El estado de publicación es obligatorio.',
        ];
    }
}
