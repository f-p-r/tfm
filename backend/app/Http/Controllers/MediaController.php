<?php

namespace App\Http\Controllers;

use App\Http\Requests\MediaIndexRequest;
use App\Http\Requests\MediaUploadRequest;
use App\Http\Resources\MediaItemResource;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    /**
     * Obtener medias paginadas según el scope.
     */
    public function index(MediaIndexRequest $request): JsonResponse
    {
        $scopeType = $request->getScopeType();
        $scopeId = $request->getScopeId();
        $includeGlobal = $request->getIncludeGlobal();
        $page = $request->getPage();
        $pageSize = 20;

        // Construir query base
        $query = Media::query();

        // Aplicar filtros de scope
        if ($scopeType === Media::SCOPE_GLOBAL) {
            // Solo medias globales
            $query->where('scope_type', Media::SCOPE_GLOBAL);
        } else {
            // Si includeGlobal, incluir medias globales + del scope específico
            if ($includeGlobal) {
                $query->where(function ($q) use ($scopeType, $scopeId) {
                    $q->where('scope_type', Media::SCOPE_GLOBAL)
                        ->orWhere(function ($q2) use ($scopeType, $scopeId) {
                            $q2->where('scope_type', $scopeType)
                                ->where('scope_id', $scopeId);
                        });
                });
            } else {
                // Solo del scope específico
                $query->where('scope_type', $scopeType)
                    ->where('scope_id', $scopeId);
            }
        }

        // Contar total
        $total = $query->count();

        // Ordenar por created_at DESC y paginar
        $items = $query->orderByDesc('created_at')
            ->skip(($page - 1) * $pageSize)
            ->take($pageSize)
            ->get();

        return response()->json([
            'page' => $page,
            'pageSize' => $pageSize,
            'total' => $total,
            'items' => MediaItemResource::collection($items),
        ]);
    }

    /**
     * Upload fake: devuelve la imagen más reciente del scope solicitado.
     */
    public function uploadFake(MediaUploadRequest $request): JsonResponse
    {
        $scopeType = $request->getScopeType();
        $scopeId = $request->getScopeId();

        // Buscar el media más reciente del scope
        $media = Media::query()
            ->where('scope_type', $scopeType)
            ->when($scopeId !== null, function ($q) use ($scopeId) {
                return $q->where('scope_id', $scopeId);
            })
            ->orderByDesc('created_at')
            ->first();

        // Si no existe, devolver 404
        if (! $media) {
            return response()->json(
                ['message' => 'No hay medias para el scope solicitado.'],
                404
            );
        }

        return response()->json([
            'item' => new MediaItemResource($media),
        ]);
    }
}
