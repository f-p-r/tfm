<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactInfoRequest;
use App\Http\Requests\UpdateContactInfoRequest;
use App\Models\ContactInfo;
use App\Models\RoleGrant;
use App\Services\AuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ContactInfoController extends Controller
{
    public function __construct(protected AuthorizationService $authzService)
    {
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ContactInfo::query();

        // Filtros
        if ($request->has('owner_type')) {
            $query->where('owner_type', $request->input('owner_type'));
        }

        if ($request->has('owner_id')) {
            $query->where('owner_id', $request->input('owner_id'));
        }

        if ($request->has('contact_type')) {
            $query->where('contact_type', $request->input('contact_type'));
        }

        if ($request->has('category')) {
            $query->where('category', $request->input('category'));
        }

        // Por defecto solo mostrar públicos, a menos que esté autenticado y tenga permisos
        if (!$request->boolean('include_private') || !$request->user()) {
            $query->public();
        }

        $contacts = $query->ordered()->get();

        return response()->json($contacts);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreContactInfoRequest $request): JsonResponse
    {
        // Verificar permisos según owner_type
        $this->checkPermissions($request->user(), $request->input('owner_type'), $request->input('owner_id'));

        $contactInfo = ContactInfo::create($request->validated());

        return response()->json($contactInfo, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ContactInfo $contactInfo): JsonResponse
    {
        // Si no es público, verificar autenticación
        if (!$contactInfo->is_public) {
            if (!Auth::check()) {
                return response()->json(['message' => 'Contacto no encontrado'], 404);
            }
        }

        return response()->json($contactInfo);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateContactInfoRequest $request, ContactInfo $contactInfo): JsonResponse
    {
        // Verificar permisos según el owner actual
        $this->checkPermissions($request->user(), $contactInfo->owner_type, $contactInfo->owner_id);

        $contactInfo->update($request->validated());

        return response()->json($contactInfo);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, ContactInfo $contactInfo): JsonResponse
    {
        // Verificar permisos según el owner actual
        $this->checkPermissions($request->user(), $contactInfo->owner_type, $contactInfo->owner_id);

        $contactInfo->delete();

        return response()->json(null, 204);
    }

    /**
     * Check permissions based on owner type.
     */
    protected function checkPermissions($user, int $ownerType, ?int $ownerId): void
    {
        if (!$user) {
            abort(401, 'No autenticado');
        }

        if ($ownerType === ContactInfo::OWNER_TYPE_GLOBAL) {
            // Requiere permiso global admin
            $hasPermission = $this->authzService->userHasPermissionInScope(
                $user,
                'admin',
                RoleGrant::SCOPE_GLOBAL,
                null
            );

            if (!$hasPermission) {
                abort(403, 'No tienes permisos para gestionar contactos globales');
            }
        } elseif ($ownerType === ContactInfo::OWNER_TYPE_ASSOCIATION) {
            // Requiere permiso admin en scope de asociación
            $hasPermission = $this->authzService->userHasPermissionInScope(
                $user,
                'admin',
                RoleGrant::SCOPE_ASSOCIATION,
                $ownerId
            );

            if (!$hasPermission) {
                abort(403, 'No tienes permisos para gestionar contactos de esta asociación');
            }
        } elseif ($ownerType === ContactInfo::OWNER_TYPE_GAME) {
            // Requiere permiso admin en scope de juego
            $hasPermission = $this->authzService->userHasPermissionInScope(
                $user,
                'admin',
                RoleGrant::SCOPE_GAME,
                $ownerId
            );

            if (!$hasPermission) {
                abort(403, 'No tienes permisos para gestionar contactos de este juego');
            }
        }
    }
}
