<?php

namespace App\Http\Requests;

use App\Models\ContactInfo;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContactInfoRequest extends FormRequest
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
        $contactInfo = $this->route('contactInfo');

        return [
            // No permitir cambiar owner_type y owner_id
            'owner_type' => [
                'sometimes',
                function ($attribute, $value, $fail) use ($contactInfo) {
                    if ($value != $contactInfo->owner_type) {
                        $fail('No se puede cambiar el tipo de propietario.');
                    }
                },
            ],
            'owner_id' => [
                'sometimes',
                function ($attribute, $value, $fail) use ($contactInfo) {
                    if ($value != $contactInfo->owner_id) {
                        $fail('No se puede cambiar el ID del propietario.');
                    }
                },
            ],

            'contact_type' => [
                'sometimes',
                'required',
                'string',
                Rule::in(array_keys(ContactInfo::CONTACT_LIMITS)),
                function ($attribute, $value, $fail) use ($contactInfo) {
                    // Solo validar límites si se está cambiando el tipo
                    if ($value !== $contactInfo->contact_type) {
                        $limit = ContactInfo::CONTACT_LIMITS[$value] ?? null;

                        if ($limit !== null && $limit > 0) {
                            $existing = ContactInfo::where('owner_type', $contactInfo->owner_type)
                                ->where('owner_id', $contactInfo->owner_id)
                                ->where('contact_type', $value)
                                ->where('id', '!=', $contactInfo->id)
                                ->count();

                            if ($existing >= $limit) {
                                $fail("Ya existe el número máximo de contactos de tipo {$value} para esta entidad (límite: {$limit}).");
                            }
                        }
                    }
                },
            ],
            'value' => [
                'sometimes',
                'required',
                'string',
                'max:512',
                function ($attribute, $value, $fail) use ($contactInfo) {
                    $contactType = $this->input('contact_type', $contactInfo->contact_type);

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
                function ($attribute, $value, $fail) use ($contactInfo) {
                    $contactType = $this->input('contact_type', $contactInfo->contact_type);

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
            'owner_type.prohibited' => 'No se puede cambiar el tipo de propietario.',
            'owner_id.prohibited' => 'No se puede cambiar el ID del propietario.',
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
