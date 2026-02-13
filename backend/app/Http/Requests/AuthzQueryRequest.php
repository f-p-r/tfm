<?php

namespace App\Http\Requests;

use App\Enums\ScopeType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AuthzQueryRequest extends FormRequest
{
    /**
     * Api para consultar autorizaciones
     */
    public function authorize(): bool
    {
        return true; // gestionado por middleware
    }

    /**
     * Obtener las reglas de validación que se aplican a la solicitud.
     */
    public function rules(): array
    {
        return [
            'scopeType' => ['required', 'integer', Rule::in(ScopeType::values())],
            'scopeIds' => ['present', 'array'],
            'scopeIds.*' => ['integer', 'min:1'],
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string'],
            'breakdown' => ['required', 'boolean'],
        ];
    }

    public function getScopeType(): int
    {
        return $this->input('scopeType');
    }

    public function getScopeIds(): array
    {
        return $this->input('scopeIds', []);
    }

    public function getPermissions(): array
    {
        return $this->input('permissions', []);
    }

    public function getBreakdown(): bool
    {
        return $this->boolean('breakdown');
    }
}
