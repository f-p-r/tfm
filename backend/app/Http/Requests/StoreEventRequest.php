<?php

namespace App\Http\Requests;

use App\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEventRequest extends FormRequest
{
    /**
     * La autorización se gestiona en el controlador.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para la creación de un evento.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // --- Scope ---
            'scope_type' => [
                'required',
                'integer',
                Rule::in([Event::SCOPE_GLOBAL, Event::SCOPE_ASSOCIATION, Event::SCOPE_GAME]),
            ],
            'scope_id' => [
                'nullable',
                'integer',
                function ($attribute, $value, $fail) {
                    $scopeType = $this->input('scope_type');

                    if ($scopeType == Event::SCOPE_GLOBAL && $value !== null) {
                        $fail('El scope_id debe ser null para scope global.');
                    }

                    if ($scopeType == Event::SCOPE_ASSOCIATION) {
                        if (!$value) {
                            $fail('El scope_id es obligatorio para asociaciones.');
                        } elseif (!\App\Models\Association::where('id', $value)->exists()) {
                            $fail('La asociación especificada no existe.');
                        }
                    }

                    if ($scopeType == Event::SCOPE_GAME) {
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

                    if ($scopeType == Event::SCOPE_GLOBAL && $value !== null) {
                        $fail('Los eventos globales no pueden tener game_id asignado.');
                    }

                    if ($scopeType == Event::SCOPE_GAME && $value !== null) {
                        $fail('Para scope de juego, el game_id se asigna automáticamente desde scope_id.');
                    }
                },
            ],

            // --- Contenido ---
            'slug'    => ['required', 'string', 'max:255'],
            'title'   => ['required', 'string', 'max:255'],
            'text'    => ['required', 'string'],
            'content' => ['nullable', 'array'],
            'content.schemaVersion' => ['required_with:content', 'integer', Rule::in([1])],
            'content.segments'      => ['required_with:content', 'array'],
            'content.classNames'    => ['sometimes', 'nullable', 'string'],

            // --- Fechas ---
            'starts_at' => ['required', 'date'],
            'ends_at'   => ['nullable', 'date', 'after:starts_at'],

            // --- Dirección (todos opcionales) ---
            'country_code'      => ['nullable', 'string', 'size:2', 'exists:countries,id'],
            'region_id'         => ['nullable', 'string', 'exists:regions,id'],
            'province_name'     => ['nullable', 'string', 'max:255'],
            'municipality_name' => ['nullable', 'string', 'max:255'],
            'postal_code'       => ['nullable', 'string', 'size:5', 'regex:/^\d{5}$/'],
            'street_name'       => ['nullable', 'string', 'max:255'],
            'street_number'     => ['nullable', 'string', 'max:20'],

            // --- Estado ---
            'active'            => ['sometimes', 'boolean'],
            'registration_open' => ['sometimes', 'boolean'],

            // --- Publicación ---
            'published'    => ['required', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ];
    }

    /**
     * Mensajes de error personalizados.
     */
    public function messages(): array
    {
        return [
            'scope_type.required' => 'El tipo de scope es obligatorio.',
            'scope_type.in'       => 'El tipo de scope debe ser 1 (global), 2 (asociación) o 3 (juego).',
            'slug.required'       => 'El slug es obligatorio.',
            'title.required'      => 'El título es obligatorio.',
            'text.required'       => 'La descripción (text) es obligatoria.',
            'starts_at.required'  => 'La fecha de inicio es obligatoria.',
            'ends_at.after'       => 'La fecha de fin debe ser posterior a la fecha de inicio.',
            'country_code.size'   => 'El código de país debe ser exactamente 2 caracteres (ej. ES).',
            'country_code.exists' => 'El país especificado no existe.',
            'region_id.exists'    => 'La región especificada no existe.',
            'postal_code.size'    => 'El código postal debe tener exactamente 5 dígitos.',
            'postal_code.regex'   => 'El código postal debe contener solo dígitos.',
            'published.required'  => 'El campo published es obligatorio.',
        ];
    }
}
