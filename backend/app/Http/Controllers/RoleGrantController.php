<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRoleGrantRequest;
use App\Http\Requests\UpdateRoleGrantRequest;
use App\Models\RoleGrant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoleGrantController extends Controller
{
    /**
     * Display a listing of role grants.
     * Permite filtrar por user_id o lista de user_ids.
     * Solo usuarios con rol admin y scope global pueden acceder.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        // Verificar autorización
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $hasPermission = $user->roleGrants()
            ->where('scope_type', RoleGrant::SCOPE_GLOBAL)
            ->whereNull('scope_id')
            ->whereHas('role', function($query) {
                $query->where('name', 'admin');
            })
            ->exists();

        if (!$hasPermission) {
            return response()->json(['message' => 'No tienes permisos para ver role grants'], 403);
        }

        $query = DB::table('role_grants_view');

        // Filtrar por user_id único
        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        // Filtrar por lista de user_ids (separados por coma)
        if ($request->has('user_ids')) {
            $userIds = explode(',', $request->input('user_ids'));
            $query->whereIn('user_id', $userIds);
        }

        $roleGrants = $query->get()->map(function ($rg) {
            return $this->mapRoleGrant($rg);
        });

        return response()->json($roleGrants);
    }

    /**
     * Store a newly created role grant.
     *
     * @param StoreRoleGrantRequest $request
     * @return JsonResponse
     */
    public function store(StoreRoleGrantRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Convertir scope_id = 0 a null para scope global
        if ($data['scope_type'] == RoleGrant::SCOPE_GLOBAL && ($data['scope_id'] === 0 || $data['scope_id'] === '0')) {
            $data['scope_id'] = null;
        }

        $roleGrant = RoleGrant::create($data);

        // Cargar relaciones
        $roleGrant->load(['user', 'role']);

        return response()->json($this->mapRoleGrantFromModel($roleGrant), 201);
    }

    /**
     * Display the specified role grant.
     * Solo usuarios con rol admin y scope global pueden acceder.
     *
     * @param Request $request
     * @param RoleGrant $roleGrant
     * @return JsonResponse
     */
    public function show(Request $request, RoleGrant $roleGrant): JsonResponse
    {
        // Verificar autorización
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $hasPermission = $user->roleGrants()
            ->where('scope_type', RoleGrant::SCOPE_GLOBAL)
            ->whereNull('scope_id')
            ->whereHas('role', function($query) {
                $query->where('name', 'admin');
            })
            ->exists();

        if (!$hasPermission) {
            return response()->json(['message' => 'No tienes permisos para ver role grants'], 403);
        }

        // Obtener desde la vista para datos completos
        $rg = DB::table('role_grants_view')
            ->where('id', $roleGrant->id)
            ->first();

        if (!$rg) {
            return response()->json(['message' => 'Role grant no encontrado.'], 404);
        }

        return response()->json($this->mapRoleGrant($rg));
    }

    /**
     * Update the specified role grant.
     *
     * @param UpdateRoleGrantRequest $request
     * @param RoleGrant $roleGrant
     * @return JsonResponse
     */
    public function update(UpdateRoleGrantRequest $request, RoleGrant $roleGrant): JsonResponse
    {
        $data = $request->validated();

        // Convertir scope_id = 0 a null para scope global
        if (isset($data['scope_type']) && $data['scope_type'] == RoleGrant::SCOPE_GLOBAL) {
            if (isset($data['scope_id']) && ($data['scope_id'] === 0 || $data['scope_id'] === '0')) {
                $data['scope_id'] = null;
            }
        }

        $roleGrant->update($data);

        // Obtener datos actualizados desde la vista
        $rg = DB::table('role_grants_view')
            ->where('id', $roleGrant->id)
            ->first();

        return response()->json($this->mapRoleGrant($rg));
    }

    /**
     * Remove the specified role grant.
     *
     * @param RoleGrant $roleGrant
     * @return JsonResponse
     */
    /**
     * Eliminar un role grant.
     * Solo usuarios con rol admin y scope global pueden eliminar role grants.
     *
     * @param Request $request
     * @param RoleGrant $roleGrant
     * @return JsonResponse
     */
    public function destroy(Request $request, RoleGrant $roleGrant): JsonResponse
    {
        // Verificar autorización
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $hasPermission = $user->roleGrants()
            ->where('scope_type', RoleGrant::SCOPE_GLOBAL)
            ->whereNull('scope_id')
            ->whereHas('role', function($query) {
                $query->where('name', 'admin');
            })
            ->exists();

        if (!$hasPermission) {
            return response()->json(['message' => 'No tienes permisos para eliminar role grants'], 403);
        }

        $roleGrant->delete();
        return response()->json(null, 204);
    }

    /**
     * Mapea un registro de role_grants_view a formato API.
     *
     * @param object $rg
     * @return array
     */
    private function mapRoleGrant(object $rg): array
    {
        return [
            'id' => $rg->id,
            'user' => [
                'id' => $rg->user_id,
                'username' => $rg->user_username,
                'name' => $rg->user_name,
            ],
            'role' => [
                'id' => $rg->role_id,
                'name' => $rg->role_name,
            ],
            'scope_type' => [
                'value' => $rg->scope_type,
                'name' => $rg->scope_type_name,
            ],
            'scope' => $rg->scope_name ? [
                'id' => $rg->scope_id,
                'name' => $rg->scope_name,
            ] : null,
            'created_at' => $rg->created_at,
            'updated_at' => $rg->updated_at,
        ];
    }

    /**
     * Mapea un modelo RoleGrant a formato API.
     *
     * @param RoleGrant $roleGrant
     * @return array
     */
    private function mapRoleGrantFromModel(RoleGrant $roleGrant): array
    {
        // Obtener scope name según el tipo
        $scopeName = null;
        if ($roleGrant->scope_id) {
            if ($roleGrant->scope_type == RoleGrant::SCOPE_ASSOCIATION) {
                $scopeName = DB::table('associations')->where('id', $roleGrant->scope_id)->value('name');
            } elseif ($roleGrant->scope_type == RoleGrant::SCOPE_GAME) {
                $scopeName = DB::table('games')->where('id', $roleGrant->scope_id)->value('name');
            }
        }

        return [
            'id' => $roleGrant->id,
            'user' => [
                'id' => $roleGrant->user->id,
                'username' => $roleGrant->user->username,
                'name' => $roleGrant->user->name,
            ],
            'role' => [
                'id' => $roleGrant->role->id,
                'name' => $roleGrant->role->name,
            ],
            'scope_type' => [
                'value' => $roleGrant->scope_type,
                'name' => $roleGrant->getScopeTypeName(),
            ],
            'scope' => $scopeName ? [
                'id' => $roleGrant->scope_id,
                'name' => $scopeName,
            ] : null,
            'created_at' => $roleGrant->created_at?->toISOString(),
            'updated_at' => $roleGrant->updated_at?->toISOString(),
        ];
    }
}
