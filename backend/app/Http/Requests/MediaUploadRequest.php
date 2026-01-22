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
            'file' => ['required', 'file'],
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
        ];
    }

    /**
     * Normalizar scopeType a minúsculas.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'scopeType' => strtolower($this->input('scopeType')),
        ]);
    }

    /**
     * Obtener scopeType normalizado como entero.
     */
    public function getScopeType(): int
    {
        $scopeType = strtolower($this->input('scopeType', 'global'));
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
