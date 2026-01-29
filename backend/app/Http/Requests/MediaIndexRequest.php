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
            'scopeType' => ['required', 'string', 'in:global,association,game'],
            'scopeId' => [
                function ($attribute, $value, $fail) {
                    $scopeType = strtolower($this->input('scopeType'));
                    if ($scopeType !== 'global' && is_null($value)) {
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
     * Normalizar scopeType a minúsculas.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'scopeType' => strtolower($this->input('scopeType')),
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
