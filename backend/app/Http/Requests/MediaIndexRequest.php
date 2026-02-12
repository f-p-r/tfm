<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

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
                    Log::info('MediaIndexRequest - Validando scopeType', [
                        'value' => $value,
                        'type' => gettype($value),
                        'is_numeric' => is_numeric($value),
                    ]);

                    // Permitir string o numérico (puede venir como string "2" del query)
                    if (is_numeric($value)) {
                        $intValue = (int)$value;
                        if (!in_array($intValue, [1, 2, 3])) {
                            Log::warning('MediaIndexRequest - scopeType numérico no válido', ['value' => $value, 'int' => $intValue]);
                            $fail('El campo scopeType debe ser global, association, game, 1, 2 o 3.');
                        }
                    } elseif (is_string($value)) {
                        if (!in_array(strtolower($value), ['global', 'association', 'game'])) {
                            Log::warning('MediaIndexRequest - scopeType string no válido', ['value' => $value]);
                            $fail('El campo scopeType debe ser global, association, game, 1, 2 o 3.');
                        }
                    } else {
                        Log::warning('MediaIndexRequest - scopeType tipo no válido', ['type' => gettype($value)]);
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

        Log::info('MediaIndexRequest - Datos recibidos', [
            'scopeType_raw' => $scopeType,
            'scopeType_type' => gettype($scopeType),
            'scopeType_is_numeric' => is_numeric($scopeType),
            'scopeId' => $this->input('scopeId'),
            'all_query_params' => $this->all(),
        ]);

        // Solo normalizar a minúsculas si es string NO numérico
        if (is_string($scopeType) && !is_numeric($scopeType)) {
            $scopeType = strtolower($scopeType);
        }

        $this->merge([
            'scopeType' => $scopeType,
            // Normaliza includeGlobal a booleano para evitar 422 con valores "true"/"false" en string
            'includeGlobal' => $this->boolean('includeGlobal', true),
        ]);

        Log::info('MediaIndexRequest - Datos después de prepareForValidation', [
            'scopeType_processed' => $scopeType,
        ]);
    }

    /**
     * Manejar errores de validación.
     */
    protected function failedValidation(Validator $validator)
    {
        Log::error('MediaIndexRequest - Validación FALLIDA', [
            'errors' => $validator->errors()->toArray(),
            'scopeType_value' => $this->input('scopeType'),
            'scopeType_type' => gettype($this->input('scopeType')),
            'all_inputs' => $this->all(),
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
