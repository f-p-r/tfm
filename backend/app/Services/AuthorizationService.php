<?php

namespace App\Services;

use App\Models\RoleGrant;
use App\Models\User;

class AuthorizationService
{
    /**
     * Verifica si un usuario tiene un permiso en un ámbito (scope) específico.
     *
     * La lógica es:
     * - Si hay un RoleGrant global del usuario cuyo rol tiene el permiso → true
     * - Si hay un RoleGrant exacto en el scope (scope_type + scope_id) cuyo rol tiene el permiso → true
     * - En caso contrario → false
     */
    public function userHasPermissionInScope(
        User $user,
        string $permission,
        string $scopeType,
        ?int $scopeId
    ): bool {
        // Cargar roles y permisos evitando N+1: roles con sus permisos
        $roleGrants = $user->roleGrants()
            ->with('role.permissions')
            ->get();

        foreach ($roleGrants as $grant) {
            $role = $grant->role;

            // 1. Si es un grant global, aplica a cualquier scope
            if ($grant->scope_type === 'global') {
                if ($role->hasPermissionTo($permission)) {
                    return true;
                }
            }

            // 2. Si es un grant exactamente en el scope solicitado
            if ($grant->scope_type === $scopeType && $grant->scope_id === $scopeId) {
                if ($role->hasPermissionTo($permission)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Obtiene el scope (scope_type + scope_id) de un contenido basado en sus relaciones.
     *
     * Prioridad:
     * - Si tiene association_id → scope tipo "association"
     * - Else si tiene game_id → scope tipo "game"
     * - Else → scope tipo "global"
     */
    public function getScopeForContent(?int $associationId, ?int $gameId): array
    {
        if ($associationId) {
            return ['scope_type' => 'association', 'scope_id' => $associationId];
        }

        if ($gameId) {
            return ['scope_type' => 'game', 'scope_id' => $gameId];
        }

        return ['scope_type' => 'global', 'scope_id' => null];
    }
}
