<?php

namespace App\Http\Requests;

use App\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEventRequest extends FormRequest
{
    /**
     * La autorización se gestiona en el controlador.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para la actualización de un evento.
     * scope_type y scope_id no son modificables tras la creación.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // --- Scope (no modificable) ---
            'scope_type' => ['prohibited'],
            'scope_id'   => ['prohibited'],

            'game_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:games,id',
            ],

            // --- Contenido ---
            'slug'    => ['sometimes', 'string', 'max:255'],
            'title'   => ['sometimes', 'string', 'max:255'],
            'text'    => ['sometimes', 'string'],
            'content' => ['sometimes', 'nullable', 'array'],
            'content.schemaVersion' => ['required_with:content', 'integer', Rule::in([1])],
            'content.segments'      => ['required_with:content', 'array'],
            'content.classNames'    => ['sometimes', 'nullable', 'string'],

            // --- Fechas ---
            'starts_at' => ['sometimes', 'date'],
            'ends_at'   => ['sometimes', 'nullable', 'date', 'after:starts_at'],

            // --- Dirección (todos opcionales) ---
            'country_code'      => ['sometimes', 'nullable', 'string', 'size:2', 'exists:countries,id'],
            'region_id'         => ['sometimes', 'nullable', 'string', 'exists:regions,id'],
            'province_name'     => ['sometimes', 'nullable', 'string', 'max:255'],
            'municipality_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'postal_code'       => ['sometimes', 'nullable', 'string', 'size:5', 'regex:/^\d{5}$/'],
            'street_name'       => ['sometimes', 'nullable', 'string', 'max:255'],
            'street_number'     => ['sometimes', 'nullable', 'string', 'max:20'],

            // --- Estado ---
            'active'            => ['sometimes', 'boolean'],
            'registration_open' => ['sometimes', 'boolean'],

            // --- Publicación ---
            'published'    => ['sometimes', 'boolean'],
            'published_at' => ['sometimes', 'nullable', 'date'],
        ];
    }

    /**
     * Mensajes de error personalizados.
     */
    public function messages(): array
    {
        return [
            'scope_type.prohibited' => 'No se permite cambiar el scope_type de un evento.',
            'scope_id.prohibited'   => 'No se permite cambiar el scope_id de un evento.',
            'ends_at.after'         => 'La fecha de fin debe ser posterior a la fecha de inicio.',
            'country_code.size'     => 'El código de país debe ser exactamente 2 caracteres (ej. ES).',
            'country_code.exists'   => 'El país especificado no existe.',
            'region_id.exists'      => 'La región especificada no existe.',
            'postal_code.size'      => 'El código postal debe tener exactamente 5 dígitos.',
            'postal_code.regex'     => 'El código postal debe contener solo dígitos.',
        ];
    }
}
