# MediaController API

Controlador para gestión de archivos multimedia (imágenes) con sistema de scopes.

## Conceptos

### Scopes
El sistema de media utiliza scopes para organizar las imágenes:
- **SCOPE_GLOBAL (1)**: Imágenes disponibles globalmente
- **SCOPE_ASSOCIATION (2)**: Imágenes de una asociación específica
- **SCOPE_TOURNAMENT (3)**: Imágenes de un torneo específico

## Endpoints

### GET /api/media
Obtener listado paginado de medias según scope.

**Autenticación:** No requerida (sin autenticación por ahora)

**Query Parameters:**
- `scopeType` (integer, required) - Tipo de scope: 1 (global), 2 (association), 3 (tournament)
- `scopeId` (integer, optional) - ID del scope (requerido para scopes no globales)
- `includeGlobal` (boolean, optional) - Incluir medias globales junto con las del scope (default: false)
- `page` (integer, optional) - Página a recuperar (default: 1)

**Ejemplo:**
```
GET /api/media?scopeType=2&scopeId=5&includeGlobal=true&page=1
```

**Respuestas:**
- **200 OK**
  ```json
  {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "items": [
      {
        "id": 1,
        "original_name": "imagen.jpg",
        "storage_path": "media/abc123.jpg",
        "url": "http://example.com/storage/media/abc123.jpg",
        "mime_type": "image/jpeg",
        "size_bytes": 153600,
        "scope_type": 2,
        "scope_id": 5,
        "created_at": "2026-01-01T00:00:00.000000Z"
      }
    ]
  }
  ```

- **422 Unprocessable Entity** - Error de validación

**Validaciones:**
- `scopeType` debe ser 1, 2, o 3
- `scopeId` es obligatorio si scopeType no es GLOBAL (1)
- Para SCOPE_ASSOCIATION: debe existir la asociación
- Para SCOPE_TOURNAMENT: debe existir el torneo

---

### POST /api/media/upload-fake
Endpoint de prueba que devuelve el media más reciente del scope solicitado (no sube archivo real).

**Autenticación:** No requerida

**Request Body:**
```json
{
  "scopeType": "integer (required) - 1, 2, or 3",
  "scopeId": "integer (optional) - Required if scopeType != 1"
}
```

**Respuestas:**
- **200 OK** - Devuelve el media más reciente
  ```json
  {
    "id": 1,
    "original_name": "imagen.jpg",
    "storage_path": "media/abc123.jpg",
    "url": "http://example.com/storage/media/abc123.jpg",
    ...
  }
  ```

- **404 Not Found** - No hay medias para el scope solicitado
  ```json
  {
    "message": "No hay medias para el scope solicitado."
  }
  ```

---

### POST /api/media/upload
Subir un archivo de imagen al sistema.

**Autenticación:** No requerida (sin autenticación por ahora)

**Request Body:** (multipart/form-data)
- `file` (file, required) - Archivo de imagen a subir
  - Tipos permitidos: jpeg, png, jpg, gif, svg, webp
  - Tamaño máximo: 10MB
- `scopeType` (integer, required) - Tipo de scope: 1, 2, o 3
- `scopeId` (integer, optional) - ID del scope (requerido si scopeType != 1)

**Ejemplo cURL:**
```bash
curl -X POST http://api.example.com/api/media/upload \
  -F "file=@imagen.jpg" \
  -F "scopeType=2" \
  -F "scopeId=5"
```

**Respuestas:**
- **201 Created**
  ```json
  {
    "id": 1,
    "original_name": "imagen.jpg",
    "storage_path": "media/2026/01/abc123def456.jpg",
    "url": "http://example.com/storage/media/2026/01/abc123def456.jpg",
    "mime_type": "image/jpeg",
    "size_bytes": 153600,
    "scope_type": 2,
    "scope_id": 5,
    "created_at": "2026-01-01T00:00:00.000000Z",
    "updated_at": "2026-01-01T00:00:00.000000Z"
  }
  ```

- **422 Unprocessable Entity** - Error de validación
  ```json
  {
    "message": "The file field is required.",
    "errors": {
      "file": ["The file field is required."]
    }
  }
  ```

**Validaciones:**
- `file`: Requerido, debe ser imagen (jpeg, png, jpg, gif, svg, webp), máx 10MB
- `scopeType`: Requerido, debe ser 1, 2, o 3
- `scopeId`: Requerido si scopeType != 1
- Para SCOPE_ASSOCIATION: debe existir la asociación
- Para SCOPE_TOURNAMENT: debe existir el torneo

**Almacenamiento:**
Los archivos se almacenan en `storage/app/public/media/YYYY/MM/` con un nombre generado (UUID + extensión).
