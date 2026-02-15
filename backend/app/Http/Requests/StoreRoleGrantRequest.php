<?php

namespace App\Http\Requests;

use App\Models\RoleGrant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoleGrantRequest extends FormRequest
{
    /**
     * Determinar si el usuario está autorizado para esta operación.
     * Solo usuarios con rol admin y scope global pueden crear role grants.
     */
    public function authorize(): bool
    {
        if (!$this->user()) {
            return false;
        }

        // Verificar si el usuario tiene rol admin con scope global
        return $this->user()->roleGrants()
            ->where('scope_type', RoleGrant::SCOPE_GLOBAL)
            ->whereNull('scope_id')
            ->whereHas('role', function($query) {
                $query->where('name', 'admin');
            })
            ->exists();
    }

    public function rules(): array
    {
        $scopeType = $this->input('scope_type');
        $scopeId = $this->input('scope_id');

        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'scope_type' => ['required', 'integer', Rule::in([
                RoleGrant::SCOPE_GLOBAL,
                RoleGrant::SCOPE_ASSOCIATION,
                RoleGrant::SCOPE_GAME,
            ])],
            'scope_id' => [
                'nullable',
                'integer',
                function ($attribute, $value, $fail) use ($scopeType) {
                    // Si es scope global, permitir null o 0
                    if ($scopeType == RoleGrant::SCOPE_GLOBAL) {
                        if ($value !== null && $value !== 0 && $value !== '0') {
                            $fail('Para scope global, el scope_id debe ser null o 0.');
                        }
                        return;
                    }

                    // Para otros scopes, es requerido
                    if ($value === null) {
                        $fail('El scope_id es requerido para este tipo de scope.');
                        return;
                    }

                    // Validar que existe en la tabla correspondiente
                    if ($scopeType == RoleGrant::SCOPE_ASSOCIATION) {
                        $exists = \App\Models\Association::where('id', $value)->exists();
                        if (!$exists) {
                            $fail('La asociación especificada no existe.');
                        }
                    } elseif ($scopeType == RoleGrant::SCOPE_GAME) {
                        $exists = \App\Models\Game::where('id', $value)->exists();
                        if (!$exists) {
                            $fail('El juego especificado no existe.');
                        }
                    }
                },
                // Validación de unicidad y reglas de scope
                function ($attribute, $value, $fail) use ($scopeType, $scopeId) {
                    $userId = $this->input('user_id');
                    $roleId = $this->input('role_id');

                    // Normalizar scope_id (0 -> null para global)
                    $normalizedScopeId = ($scopeType == RoleGrant::SCOPE_GLOBAL && ($value === 0 || $value === '0')) ? null : $value;

                    // Verificar si ya existe este role grant exacto
                    $exists = RoleGrant::where('user_id', $userId)
                        ->where('role_id', $roleId)
                        ->where('scope_type', $scopeType)
                        ->where(function($query) use ($normalizedScopeId) {
                            if ($normalizedScopeId === null) {
                                $query->whereNull('scope_id');
                            } else {
                                $query->where('scope_id', $normalizedScopeId);
                            }
                        })
                        ->exists();

                    if ($exists) {
                        $fail('El usuario ya tiene este rol asignado en este scope.');
                        return;
                    }

                    // Regla: Si tiene rol con scope_id=null, no puede tener con scope_id específico
                    if ($normalizedScopeId !== null) {
                        $hasNullScope = RoleGrant::where('user_id', $userId)
                            ->where('role_id', $roleId)
                            ->where('scope_type', $scopeType)
                            ->whereNull('scope_id')
                            ->exists();

                        if ($hasNullScope) {
                            $fail('El usuario ya tiene este rol con scope global para este tipo. No se puede asignar un scope específico.');
                            return;
                        }
                    }

                    // Regla: Si tiene rol con scope_id específico, no puede tener con scope_id=null
                    if ($normalizedScopeId === null) {
                        $hasSpecificScope = RoleGrant::where('user_id', $userId)
                            ->where('role_id', $roleId)
                            ->where('scope_type', $scopeType)
                            ->whereNotNull('scope_id')
                            ->exists();

                        if ($hasSpecificScope) {
                            $fail('El usuario ya tiene este rol asignado a scopes específicos. No se puede asignar scope global.');
                            return;
                        }
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => 'El ID del usuario es requerido.',
            'user_id.exists' => 'El usuario especificado no existe.',
            'role_id.required' => 'El ID del rol es requerido.',
            'role_id.exists' => 'El rol especificado no existe.',
            'scope_type.required' => 'El tipo de scope es requerido.',
            'scope_type.in' => 'El tipo de scope no es válido.',
        ];
    }

    protected function failedAuthorization()
    {
        abort(403, 'No tienes permisos para crear role grants. Se requiere rol de administrador.');
    }
}
