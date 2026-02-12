<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

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
                    Log::info('Validando scopeType', [
                        'value' => $value,
                        'type' => gettype($value),
                        'is_numeric' => is_numeric($value),
                        'is_string' => is_string($value),
                    ]);

                    // Permitir string o entero
                    if (is_string($value) && !is_numeric($value) && !in_array(strtolower($value), ['global', 'association', 'game'])) {
                        Log::warning('scopeType falla validación: string no válido', ['value' => $value]);
                        $fail('El campo scopeType debe ser global, association, game, 1, 2 o 3.');
                    }
                    if (is_numeric($value) && !in_array((int)$value, [1, 2, 3])) {
                        Log::warning('scopeType falla validación: número no válido', ['value' => $value, 'int' => (int)$value]);
                        $fail('El campo scopeType debe ser global, association, game, 1, 2 o 3.');
                    }
                    if (!is_string($value) && !is_numeric($value)) {
                        Log::warning('scopeType falla validación: tipo no válido', ['type' => gettype($value)]);
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

        Log::info('MediaUploadRequest - Datos recibidos ANTES de prepareForValidation', [
            'scopeType_raw' => $scopeType,
            'scopeType_type' => gettype($scopeType),
            'scopeType_is_numeric' => is_numeric($scopeType),
            'scopeId' => $this->input('scopeId'),
            'all_inputs' => $this->except(['file']),
            'has_file' => $this->hasFile('file'),
        ]);

        // Solo normalizar a minúsculas si es string NO numérico
        if (is_string($scopeType) && !is_numeric($scopeType)) {
            $scopeType = strtolower($scopeType);
        }

        $fileNameInput = $this->input('filename') ?? $this->input('fileName');
        $this->merge([
            'scopeType' => $scopeType,
            'filename' => $fileNameInput,
        ]);

        Log::info('MediaUploadRequest - Datos DESPUÉS de prepareForValidation', [
            'scopeType_processed' => $scopeType,
            'scopeType_type' => gettype($scopeType),
        ]);
    }

    /**
     * Manejar errores de validación.
     */
    protected function failedValidation(Validator $validator)
    {
        Log::error('MediaUploadRequest - Validación FALLIDA', [
            'errors' => $validator->errors()->toArray(),
            'scopeType_value' => $this->input('scopeType'),
            'scopeType_type' => gettype($this->input('scopeType')),
            'scopeId_value' => $this->input('scopeId'),
            'all_inputs' => $this->except(['file']),
        ]);

        throw new ValidationException($validator);
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
