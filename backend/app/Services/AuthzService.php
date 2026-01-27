<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class AuthzService
{
    /**
     * Obtener permisos efectivos del usuario en un scope type específico.
     */
    public function queryPermissions(
        User $user,
        int $scopeType,
        array $scopeIds,
        array $permissions,
        bool $breakdown
    ): array {
        // Obtener todos los role_grants del usuario para este scopeType con eager loading
        $grants = $user->roleGrants()
            ->where('scope_type', $scopeType)
            ->with('role.permissions')
            ->get();

        // Separar wildcard (scope_id null) de específicos
        $wildcardGrants = $grants->where('scope_id', null);
        $specificGrants = $grants->whereNotNull('scope_id');

        // Calcular permisos del wildcard
        $wildcardPermissions = $this->getPermissionsFromGrants($wildcardGrants);
        $hasWildcard = $wildcardPermissions->isNotEmpty();

        // Filtrar si se especificaron permisos concretos
        if (!empty($permissions)) {
            $wildcardPermissions = $wildcardPermissions->intersect($permissions);
        }

        if ($breakdown) {
            return $this->buildBreakdownResponse(
                $scopeType,
                $hasWildcard,
                $wildcardPermissions,
                $specificGrants,
                $scopeIds,
                $permissions
            );
        } else {
            return $this->buildSimpleResponse(
                $scopeType,
                $hasWildcard,
                $specificGrants,
                $scopeIds,
                $permissions
            );
        }
    }

    /**
     * Construir respuesta con breakdown=false.
     */
    private function buildSimpleResponse(
        int $scopeType,
        bool $hasWildcard,
        $specificGrants,
        array $requestedScopeIds,
        array $requestedPermissions
    ): array {
        $resultScopeIds = [];

        // Agrupar grants por scope_id
        $grantsByScopeId = $specificGrants->groupBy('scope_id');

        foreach ($grantsByScopeId as $scopeId => $grants) {
            $perms = $this->getPermissionsFromGrants($grants);

            // Aplicar filtro de permisos
            if (!empty($requestedPermissions)) {
                $perms = $perms->intersect($requestedPermissions);
            }

            // Si tiene al menos 1 permiso (tras filtro), incluir scopeId
            if ($perms->isNotEmpty()) {
                $resultScopeIds[] = (int) $scopeId;
            }
        }

        // Ordenar scopeIds
        sort($resultScopeIds);

        return [
            'scopeType' => $scopeType,
            'all' => $hasWildcard,
            'scopeIds' => $resultScopeIds,
        ];
    }

    /**
     * Construir respuesta con breakdown=true.
     */
    private function buildBreakdownResponse(
        int $scopeType,
        bool $hasWildcard,
        $wildcardPermissions,
        $specificGrants,
        array $requestedScopeIds,
        array $requestedPermissions
    ): array {
        $results = [];

        // Agrupar grants por scope_id
        $grantsByScopeId = $specificGrants->groupBy('scope_id');

        foreach ($grantsByScopeId as $scopeId => $grants) {
            $perms = $this->getPermissionsFromGrants($grants);

            // Aplicar filtro de permisos
            if (!empty($requestedPermissions)) {
                $perms = $perms->intersect($requestedPermissions);
            }

            // Solo incluir si tiene permisos
            if ($perms->isNotEmpty()) {
                $results[] = [
                    'scopeId' => (int) $scopeId,
                    'permissions' => $perms->sort()->values()->all(),
                ];
            }
        }

        // Ordenar results por scopeId
        usort($results, fn($a, $b) => $a['scopeId'] <=> $b['scopeId']);

        return [
            'scopeType' => $scopeType,
            'all' => $hasWildcard,
            'allPermissions' => $wildcardPermissions->sort()->values()->all(),
            'results' => $results,
        ];
    }

    /**
     * Extraer todos los permisos únicos de una colección de grants.
     */
    private function getPermissionsFromGrants($grants)
    {
        $permissions = collect();

        foreach ($grants as $grant) {
            if ($grant->role && $grant->role->permissions) {
                $grantPerms = $grant->role->permissions->pluck('name');
                $permissions = $permissions->merge($grantPerms);
            }
        }

        return $permissions->unique();
    }
}
