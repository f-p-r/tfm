Laravel 11 API-only + SQLite. Ya existe auth con Sanctum (auth:sanctum). Aún NO hay permisos/roles definidos para autorizar acciones, así que NO implementar ninguna validación de autorización más allá de exigir login.

Usa solo español en respuestas y comentarios en fuentes.

Objetivo: backend mínimo real para biblioteca de imágenes (Media) con scopes y paginación, pero con "subida" simulada (no guarda archivos, no inserta DB). Sin borrado, sin búsqueda. Orden siempre por created_at DESC.

MODELO:
- Crear tabla `media` con columnas:
  - id (pk)
  - scope_type (string) valores: global|association|game
  - scope_id (integer nullable; null para global)
  - url (string) -> siempre ruta relativa desde la raíz, p.ej. "/media/imagen1.png"
  - created_by (integer, FK users.id) obligatorio
  - created_at, updated_at

CARPETA DE ARCHIVOS (SEEDS):
- Ubicar imágenes seed en el lugar habitual de Laravel: `public/media/`
- Insertar filas en DB apuntando a esas rutas (la existencia del fichero no es requisito para la lógica).

SEED:
- Crear seeder que inserte varias filas en `media` con:
  - scope_type variado (global, association, game)
  - scope_id variado cuando aplique
  - url apuntando a "/media/<nombre_archivo>"
  - created_at variados para probar orden (más recientes primero)
  - created_by = 1 para todos

ENDPOINTS (solo auth requerido):
- GET /api/media
  - Middleware: auth:sanctum (y nada más)
  - Query params:
    - scopeType (obligatorio): global|association|game; aceptar cualquier casing y normalizar a minúsculas.
    - scopeId (obligatorio si scopeType != global)
    - includeGlobal=true|false (default true). Si scopeType != global y includeGlobal=true => devolver mezcla de items global + items del scope específico.
    - page (default 1)
    - pageSize: ignorar el valor recibido; siempre 20 fijo (pero devolver pageSize=20 en respuesta).
  - Orden: created_at DESC (si mezcla global+scope, orden conjunto).
  - Respuesta JSON exacta:
    {
      "page": <int>,
      "pageSize": 20,
      "total": <int>,
      "items": [
        { "id":..., "scopeType":..., "scopeId":..., "url":..., "createdAt":... }
      ]
    }
  - Si page fuera de rango: devolver items [] pero total correcto.
  - Si validación falla: 422.

- POST /api/media/upload (FAKE)
  - Middleware: auth:sanctum (y nada más)
  - multipart/form-data con:
    - file (obligatorio pero se ignora)
    - scopeType (obligatorio)
    - scopeId (obligatorio si no global)
  - NO guardar archivo.
  - NO insertar fila.
  - Debe devolver 200 con:
    { "item": MediaItem }
  - MediaItem = la imagen seed más reciente (máximo created_at) del scope solicitado:
    - si scopeType=global => busca en media scope_type=global
    - si association => scope_type=association AND scope_id=...
    - si game => scope_type=game AND scope_id=...
  - Si no hay ninguna para ese scope => 404 JSON (message).
  - scopeType recibido se normaliza a minúsculas. Validación 422.

IMPLEMENTACIÓN:
- Crear Media model (app/Models/Media.php) con casts, fillable.
- Crear controlador MediaController con métodos index() y uploadFake().
- Crear FormRequest(s): MediaIndexRequest y MediaUploadRequest para validación y normalización (lowercase).
- Crear Resource/DTO opcional para el MediaItem shape (scopeType/scopeId/url/createdAt).
- Registrar rutas en routes/api.php bajo auth:sanctum:
  GET /media -> MediaController@index
  POST /media/upload -> MediaController@uploadFake
- Asegurar que route:list muestra estas rutas.
- Añadir tests solo si ya hay infraestructura; no es imprescindible.

Notas:
- La url devuelta debe ser exactamente la columna `url` (relativa), sin APP_URL.
- No hay delete ni search.
