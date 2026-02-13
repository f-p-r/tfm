<?php

namespace App\Http\Controllers;

use App\Http\Requests\AuthzQueryRequest;
use App\Services\AuthzService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuthzController extends Controller
{
    public function __construct(
        private AuthzService $authzService
    ) {}

    /**
     * Consultar permisos de usuario para un ámbito específico.
     */
    public function query(Request $request): JsonResponse
    {
        // DEBUG: Cambiar a true para activar logging de requests (útil para debugging)
        // Logs en: storage/logs/laravel.log
        $enableDebugLogging = false;

        if ($enableDebugLogging) {
            Log::info('AuthzController::query - Raw request', [
                'all' => $request->all(),
                'json' => $request->json()->all(),
                'content' => $request->getContent(),
                'content_type' => $request->header('Content-Type'),
                'user_id' => $request->user()?->id,
            ]);
        }

        // Valido manualmente para poder loggear errores en debug
        $validator = validator($request->all(), [
            'scopeType' => ['required', 'integer', 'in:1,2,3'],
            'scopeIds' => ['present', 'array'],
            'scopeIds.*' => ['integer', 'min:1'],
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string'],
            'breakdown' => ['required', 'boolean'],
        ]);

        if ($validator->fails()) {
            // Siempre loguear errores de validación
            Log::error('AuthzController::query - Validation failed', [
                'errors' => $validator->errors()->toArray(),
                'request_data' => $request->all(),
                'user_id' => $request->user()?->id,
            ]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        $result = $this->authzService->queryPermissions(
            $user,
            $request->input('scopeType'),
            $request->input('scopeIds', []),
            $request->input('permissions', []),
            $request->boolean('breakdown')
        );

        return response()->json($result);
    }
}
