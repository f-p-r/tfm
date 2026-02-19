<?php

namespace App\Http\Controllers;

use App\Http\Requests\MediaIndexRequest;
use App\Http\Requests\MediaUploadRequest;
use App\Http\Resources\MediaItemResource;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

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

        Log::info('MediaController::index', [
            'scopeType' => $scopeType,
            'scopeId' => $scopeId,
            'includeGlobal' => $includeGlobal,
            'page' => $page
        ]);

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

    /**
     * Upload real: guarda la imagen y crea el registro en la base de datos.
     */
    public function upload(MediaUploadRequest $request): JsonResponse
    {
        try {
            $scopeType = $request->getScopeType();
            $scopeId = $request->getScopeId();
            $file = $request->file('file');

            Log::info('Upload iniciado', [
                'scopeType' => $scopeType,
                'scopeId' => $scopeId,
                'file' => $file ? 'presente' : 'ausente',
            ]);

            // Verificar que el archivo existe
            if (! $file) {
                Log::warning('No se recibió archivo');
                return response()->json([
                    'message' => 'No se recibió ningún archivo.',
                    'error' => 'missing_file',
                ], 400);
            }

            if (! $file->isValid()) {
                Log::warning('Archivo no válido', ['error' => $file->getErrorMessage()]);
                return response()->json([
                    'message' => 'El archivo no es válido.',
                    'error' => 'invalid_file',
                    'details' => $file->getErrorMessage(),
                ], 400);
            }

            Log::info('Archivo válido, generando nombre');

            // Generar nombre del archivo
            $filename = $this->generateFilename($request, $file);

            Log::info('Nombre generado', ['filename' => $filename]);

            // Guardar el archivo directamente en public/media
            $path = Storage::disk('public_media')->putFileAs('', $file, $filename);

            Log::info('Archivo guardado', ['path' => $path]);

            if (! $path) {
                Log::error('putFileAs devolvió null');
                return response()->json([
                    'message' => 'Error al guardar el archivo: putFileAs devolvió null.',
                    'error' => 'store_failed',
                ], 500);
            }

            // Verificar que el archivo se guardó correctamente
            $exists = Storage::disk('public_media')->exists($path);
            Log::info('Verificación de existencia', ['exists' => $exists, 'path' => $path]);

            if (! $exists) {
                return response()->json([
                    'message' => 'El archivo se guardó pero no se puede verificar su existencia.',
                    'error' => 'file_not_found',
                    'path' => $path,
                ], 500);
            }

            // Construir URL relativa para la base de datos
            $url = '/media/' . $filename;

            // Crear registro en la base de datos
            $media = Media::create([
                'scope_type' => $scopeType,
                'scope_id' => $scopeId,
                'url' => $url,
                'created_by' => $request->user()?->id ?? 1,
            ]);

            Log::info('Media creada en BD', ['id' => $media->id]);

            return response()->json([
                'item' => new MediaItemResource($media),
            ]);
        } catch (\Exception $e) {
            Log::error('Excepción en upload', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'message' => 'Error al procesar el archivo.',
                'error' => 'exception',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generar nombre de archivo sanitizado o único.
     */
    private function generateFilename(MediaUploadRequest $request, $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $desiredFilename = $request->input('filename');

        if ($desiredFilename) {
            // Sanitizar el nombre proporcionado
            $sanitized = $this->sanitizeFilename($desiredFilename);
            // Asegurar que tenga extensión
            if (! Str::endsWith($sanitized, '.' . $extension)) {
                $sanitized .= '.' . $extension;
            }
            return $sanitized;
        }

        // Fallback: usar el nombre original del archivo
        if ($file->getClientOriginalName()) {
            return $this->sanitizeFilename($file->getClientOriginalName());
        }

        // Último recurso: generar nombre único
        return time() . '_' . Str::random(10) . '.' . $extension;
    }

    /**
     * Sanitizar nombre de archivo.
     */
    private function sanitizeFilename(string $filename): string
    {
        // Eliminar extensión si existe para procesarla por separado
        $info = pathinfo($filename);
        $name = $info['filename'] ?? $filename;
        $extension = $info['extension'] ?? '';

        // Reemplazar espacios y caracteres especiales
        $name = Str::slug($name, '_');

        // Limitar longitud
        $name = Str::limit($name, 200, '');

        // Añadir extensión si existía
        return $extension ? $name . '.' . $extension : $name;
    }
}
