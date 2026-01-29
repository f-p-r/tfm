<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MediaUploadRequest extends FormRequest
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
            'file' => [
                'required',
                'file',
                'image',
                'mimes:jpeg,png,webp',
                'max:15360', // 15MB en KB
            ],
            'scopeType' => [
                'required',
                function ($attribute, $value, $fail) {
                    // Permitir string o entero
                    if (is_string($value) && !in_array(strtolower($value), ['global', 'association', 'game'])) {
                        $fail('El campo scopeType debe ser global, association, game, 1, 2 o 3.');
                    }
                    if (is_numeric($value) && !in_array((int)$value, [1, 2, 3])) {
                        $fail('El campo scopeType debe ser global, association, game, 1, 2 o 3.');
                    }
                    if (!is_string($value) && !is_numeric($value)) {
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
            'fileName' => ['nullable', 'string', 'max:255'],
            'filename' => ['nullable', 'string', 'max:255'],
            'alt' => ['nullable', 'string', 'max:500'],
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

        $fileNameInput = $this->input('filename') ?? $this->input('fileName');
        $this->merge([
            'scopeType' => $scopeType,
            'filename' => $fileNameInput,
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
}
