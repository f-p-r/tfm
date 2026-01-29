<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MediaIndexRequest extends FormRequest
{
    /**
     * Autorizar la solicitud.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación.
     */
    public function rules(): array
    {
        return [
            'scopeType' => [
                'required',
                function ($attribute, $value, $fail) {
                    // Permitir string o numérico (puede venir como string "2" del query)
                    if (is_numeric($value)) {
                        $intValue = (int)$value;
                        if (!in_array($intValue, [1, 2, 3])) {
                            $fail('El campo scopeType debe ser global, association, game, 1, 2 o 3.');
                        }
                    } elseif (is_string($value)) {
                        if (!in_array(strtolower($value), ['global', 'association', 'game'])) {
                            $fail('El campo scopeType debe ser global, association, game, 1, 2 o 3.');
                        }
                    } else {
                        $fail('El campo scopeType debe ser un string o entero.');
                    }
                },
            ],
            'scopeId' => [
                function ($attribute, $value, $fail) {
                    $scopeType = $this->input('scopeType');
                    $scopeTypeInt = \App\Models\Media::scopeTypeToInt($scopeType);

                    if ($scopeTypeInt !== \App\Models\Media::SCOPE_GLOBAL && is_null($value)) {
                        $fail('El campo scopeId es requerido cuando scopeType no es global.');
                    }
                    if (! is_null($value) && ! is_numeric($value)) {
                        $fail('El campo scopeId debe ser numérico.');
                    }
                },
            ],
            'includeGlobal' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'pageSize' => ['nullable', 'integer'],
        ];
    }

    /**
     * Preparar datos para validación.
     */
    protected function prepareForValidation(): void
    {
        $scopeType = $this->input('scopeType');

        // Solo normalizar a minúsculas si es string
        if (is_string($scopeType)) {
            $scopeType = strtolower($scopeType);
        }

        $this->merge([
            'scopeType' => $scopeType,
            // Normaliza includeGlobal a booleano para evitar 422 con valores "true"/"false" en string
            'includeGlobal' => $this->boolean('includeGlobal', true),
        ]);
    }

    /**
     * Obtener scopeType normalizado como entero.
     */
    public function getScopeType(): int
    {
        $scopeType = $this->input('scopeType', 'global');
        return \App\Models\Media::scopeTypeToInt($scopeType) ?? \App\Models\Media::SCOPE_GLOBAL;
    }

    /**
     * Obtener scopeId como entero o null.
     */
    public function getScopeId(): ?int
    {
        $id = $this->input('scopeId');
        return is_null($id) ? null : (int) $id;
    }

    /**
     * Obtener includeGlobal con default true.
     */
    public function getIncludeGlobal(): bool
    {
        return $this->boolean('includeGlobal', true);
    }

    /**
     * Obtener página (default 1).
     */
    public function getPage(): int
    {
        return max(1, $this->integer('page', 1));
    }
}
