<?php

namespace App\Http\Requests;

use App\Models\ContactInfo;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContactInfoRequest extends FormRequest
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
            'owner_type' => [
                'required',
                'integer',
                Rule::in([
                    ContactInfo::OWNER_TYPE_GLOBAL,
                    ContactInfo::OWNER_TYPE_ASSOCIATION,
                    ContactInfo::OWNER_TYPE_GAME,
                ]),
            ],
            'owner_id' => [
                'nullable',
                'integer',
                function ($attribute, $value, $fail) {
                    $ownerType = $this->input('owner_type');

                    // Global no necesita owner_id
                    if ($ownerType == ContactInfo::OWNER_TYPE_GLOBAL && $value !== null) {
                        $fail('El owner_id debe ser null para tipo global.');
                    }

                    // Asociación debe existir
                    if ($ownerType == ContactInfo::OWNER_TYPE_ASSOCIATION) {
                        if (!$value) {
                            $fail('El owner_id es obligatorio para asociaciones.');
                        } elseif (!\App\Models\Association::where('id', $value)->exists()) {
                            $fail('La asociación especificada no existe.');
                        }
                    }

                    // Juego debe existir
                    if ($ownerType == ContactInfo::OWNER_TYPE_GAME) {
                        if (!$value) {
                            $fail('El owner_id es obligatorio para juegos.');
                        } elseif (!\App\Models\Game::where('id', $value)->exists()) {
                            $fail('El juego especificado no existe.');
                        }
                    }
                },
            ],
            'contact_type' => [
                'required',
                'string',
                Rule::in(array_keys(ContactInfo::CONTACT_LIMITS)),
                function ($attribute, $value, $fail) {
                    // Validar límites
                    $ownerType = $this->input('owner_type');
                    $ownerId = $this->input('owner_id');
                    $limit = ContactInfo::CONTACT_LIMITS[$value] ?? null;

                    if ($limit !== null && $limit > 0) {
                        $existing = ContactInfo::where('owner_type', $ownerType)
                            ->where('owner_id', $ownerId)
                            ->where('contact_type', $value)
                            ->count();

                        if ($existing >= $limit) {
                            $fail("Ya existe el número máximo de contactos de tipo {$value} para esta entidad (límite: {$limit}).");
                        }
                    }
                },
            ],
            'value' => [
                'required',
                'string',
                'max:512',
                function ($attribute, $value, $fail) {
                    $contactType = $this->input('contact_type');

                    // Validar formato según tipo
                    if ($contactType === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $fail('El formato del email no es válido.');
                    }

                    if (in_array($contactType, ['phone', 'whatsapp'])) {
                        // Validar formato internacional básico
                        if (!preg_match('/^\+?[0-9\s\-\(\)]+$/', $value)) {
                            $fail('El formato del teléfono no es válido. Use formato internacional.');
                        }
                    }

                    if (in_array($contactType, ['facebook', 'instagram', 'twitter', 'discord', 'telegram', 'youtube', 'twitch', 'linkedin', 'tiktok', 'web'])) {
                        // Validar URL o handle
                        if (!filter_var($value, FILTER_VALIDATE_URL) && !str_starts_with($value, '@')) {
                            $fail('El valor debe ser una URL válida o un handle (@username).');
                        }
                    }
                },
            ],
            'category' => [
                'nullable',
                'string',
                Rule::in(ContactInfo::VALID_CATEGORIES),
                function ($attribute, $value, $fail) {
                    $contactType = $this->input('contact_type');

                    // Validar que category sea obligatoria para ciertos tipos
                    if (in_array($contactType, ContactInfo::TYPES_REQUIRING_CATEGORY) && !$value) {
                        $fail('La categoría es obligatoria para este tipo de contacto.');
                    }

                    // Validar que category sea null para otros tipos
                    if (!in_array($contactType, ContactInfo::TYPES_REQUIRING_CATEGORY) && $value) {
                        $fail('La categoría no debe especificarse para este tipo de contacto.');
                    }
                },
            ],
            'label' => 'nullable|string|max:255',
            'order' => 'nullable|integer|min:0',
            'is_public' => 'nullable|boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'owner_type.required' => 'El tipo de propietario es obligatorio.',
            'owner_type.in' => 'El tipo de propietario no es válido.',
            'contact_type.required' => 'El tipo de contacto es obligatorio.',
            'contact_type.in' => 'El tipo de contacto no es válido.',
            'value.required' => 'El valor del contacto es obligatorio.',
            'value.max' => 'El valor no puede superar 512 caracteres.',
            'category.in' => 'La categoría no es válida.',
            'label.max' => 'La etiqueta no puede superar 255 caracteres.',
            'order.min' => 'El orden debe ser un número positivo.',
        ];
    }
}
