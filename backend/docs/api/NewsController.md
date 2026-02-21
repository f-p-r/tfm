# News API

API para gestión de noticias con autenticación y permisos por scope.

## Conceptos

- **scopeType** (integer): Define el ámbito de la noticia
  - `1` = Global (toda la plataforma)
  - `2` = Association (asociación específica)
  - `3` = Game (juego específico)
- **scopeId** (integer, nullable): ID del scope (null para global, requerido para association/game)
- **gameId** (integer, nullable): ID del juego asociado
  - Para `scopeType=1` (global): NO permitido
  - Para `scopeType=2` (association): Opcional, indica que la noticia es sobre un juego específico dentro de la asociación
  - Para `scopeType=3` (game): Se **asigna automáticamente** igual a `scopeId`
- **slug** (string): Identificador URL-friendly, **NO es único globalmente**
  - URL final: `/noticias/{id}/{slug}`
- **text** (string): Texto introductorio para cards/listados
- **content** (object, nullable): Contenido completo de la noticia en formato JSON estructurado
  ```json
  { "schemaVersion": 1, "segments": [] }
  ```
- **Reglas `published` / `publishedAt`:**
  - Si `published` pasa a `true` y `publishedAt` es `null`, se setea `publishedAt = now()`
  - Si `published` pasa a `false`, **no** se limpia `publishedAt`

## Autenticación y Permisos

**Permiso requerido:** `news.edit` (Creación / Edición de noticias)

La autorización se valida por **scope**:
- Para crear/editar noticias globales (`scopeType=1`): Requiere `news.edit` en scope global
- Para crear/editar noticias de asociación (`scopeType=2`): Requiere `news.edit` en scope de esa asociación
- Para crear/editar noticias de juego (`scopeType=3`): Requiere `news.edit` en scope de ese juego

## Endpoints

Base: `/api`

### GET /api/news
Listar noticias.

**Autenticación:** No requerida (para noticias publicadas)

**Query Parameters (todos opcionales):**
- `scope_type` (integer) - Filtrar por tipo de scope (1, 2, 3)
- `scope_id` (integer) - Filtrar por ID de scope
- `game_id` (integer) - Filtrar por juego
- `include_unpublished` (boolean) - Incluir noticias no publicadas
  - Requiere autenticación Y permiso `news.edit` en el scope de cada noticia
  - Con permiso global: ve todas las noticias
  - Con permiso de association/game: solo ve no publicadas de sus scopes
  - Sin autenticación o sin permisos: solo ve publicadas

**Respuestas:**
- **200 OK**
  ```json
  [
    {
      "id": 1,
      "scopeType": 2,
      "scopeId": 15,
      "gameId": 5,
      "slug": "nueva-temporada",
      "title": "Nueva Temporada 2026",
      "text": "Anunciamos el inicio de la nueva temporada competitiva...",
      "published": true,
      "publishedAt": "2026-02-01T12:00:00.000000Z",
      "createdBy": 1,
      "createdAt": "2026-02-01T10:00:00.000000Z",
      "updatedAt": "2026-02-01T12:00:00.000000Z",
      "creator": {
        "id": 1,
        "username": "admin",
        "name": "Administrador"
      },
      "game": {
        "id": 5,
        "name": "Counter-Strike 2",
        "slug": "cs2"
      }
    }
  ]
  ```

**Orden:** `published_at` desc, `created_at` desc

**⚠️ IMPORTANTE:** El listado NO incluye el campo `content` (solo `text`). Para obtener el contenido completo usar GET /api/news/{id}.

**Notas:**
- Por defecto solo muestra noticias con `published = true`
- Con `include_unpublished=true`:
  - Usuario con `news.edit` global → ve todas las noticias (publicadas + no publicadas)
  - Usuario con `news.edit` en association X → ve publicadas de todos + no publicadas de association X
  - Usuario con `news.edit` en game Y → ve publicadas de todos + no publicadas de game Y
  - Sin autenticación o sin permisos → solo ve publicadas

---

### GET /api/news/{id}
Obtener noticia por ID.

**Autenticación:** No requerida (para noticias publicadas)

**Parámetros de ruta:**
- `id` (integer) - ID de la noticia

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": 1,
    "scopeType": 2,
    "scopeId": 15,
    "gameId": 5,
    "slug": "nueva-temporada",
    "title": "Nueva Temporada 2026",
    "text": "Anunciamos el inicio de la nueva temporada competitiva...",
    "content": { "schemaVersion": 1, "segments": [] },
    "published": true,
    "publishedAt": "2026-02-01T12:00:00.000000Z",
    "createdBy": 1,
    "createdAt": "2026-02-01T10:00:00.000000Z",
    "updatedAt": "2026-02-01T12:00:00.000000Z",
    "creator": {
      "id": 1,
      "username": "admin",
      "name": "Administrador"
    },
    "game": {
      "id": 5,
      "name": "Counter-Strike 2",
      "slug": "cs2"
    }
  }
  ```
- **404 Not Found** - Noticia no encontrada o no publicada

**Notas:**
- Si la noticia NO está publicada, requiere autenticación y permiso `news.edit` en el scope de la noticia
- Sin autenticación/permisos, las noticias no publicadas devuelven 404

---

### POST /api/news
Crear noticia.

**Autenticación:** Requerida (Sanctum)

**Permisos:** `news.edit` en el scope especificado

**Request Body:**
```json
{
  "scope_type": 2,
  "scope_id": 15,
  "game_id": 5,
  "slug": "nueva-temporada",
  "title": "Nueva Temporada 2026",
  "text": "Anunciamos el inicio de la nueva temporada competitiva...",
  "content": { "schemaVersion": 1, "segments": [] },
  "published": false,
  "published_at": null
}
```

**Validaciones:**
- `scope_type`: required, integer, in:[1,2,3]
- `scope_id`: 
  - nullable
  - MUST be null para `scope_type=1` (global)
  - MUST be NOT null y existir en `associations` para `scope_type=2`
  - MUST be NOT null y existir en `games` para `scope_type=3`
- `game_id`:
  - nullable, exists:games,id
  - NO permitido para `scope_type=1` (global)
  - Opcional para `scope_type=2` (association)
  - NO enviar para `scope_type=3` (se asigna automáticamente)
- `slug`: required, string, max:255
- `title`: required, string, max:255
- `text`: required, string (sin límite de longitud)
- `content`: nullable, array
- `content.schemaVersion`: required_with:content, integer, in:[1]
- `content.segments`: required_with:content, array
- `published`: required, boolean
- `published_at`: nullable, date

**Respuestas:**
- **201 Created** - Noticia creada
  ```json
  {
    "id": 1,
    "scopeType": 2,
    "scopeId": 15,
    "gameId": 5,
    "slug": "nueva-temporada",
    "title": "Nueva Temporada 2026",
    "text": "Anunciamos el inicio...",
    "content": { "schemaVersion": 1, "segments": [] },
    "published": false,
    "publishedAt": null,
    "createdBy": 1,
    "createdAt": "2026-02-01T10:00:00.000000Z",
    "updatedAt": "2026-02-01T10:00:00.000000Z",
    "creator": { "id": 1, "username": "admin", "name": "Administrador" },
    "game": { "id": 5, "name": "Counter-Strike 2", "slug": "cs2" }
  }
  ```
- **401 Unauthorized** - No autenticado
- **403 Forbidden** - Sin permisos `news.edit` en el scope
- **422 Unprocessable Entity** - Error de validación

**Notas:**
- El campo `created_by` se asigna automáticamente al usuario autenticado
- Si `published=true` y `published_at=null`, se setea `published_at=now()`
- Para `scope_type=3`, `game_id` se asigna automáticamente igual a `scope_id`

---

### PUT /api/news/{id}
### PATCH /api/news/{id}
Actualizar noticia (parcial).

**Autenticación:** Requerida (Sanctum)

**Permisos:** `news.edit` en el scope de la noticia

**Parámetros de ruta:**
- `id` (integer) - ID de la noticia

**Request Body:** (todos los campos opcionales)
```json
{
  "game_id": 5,
  "slug": "nueva-temporada-2026",
  "title": "Nueva Temporada 2026 - Actualizado",
  "text": "Texto actualizado...",
  "content": { "schemaVersion": 1, "segments": [] },
  "published": true,
  "published_at": "2026-02-01T12:00:00Z"
}
```

**⚠️ IMPORTANTE:** `scope_type` y `scope_id` **NO son modificables** después de crear la noticia.

**Validaciones:**
- `scope_type`: prohibited (no se puede cambiar)
- `scope_id`: prohibited (no se puede cambiar)
- `game_id`: sometimes, nullable, exists:games,id
- `slug`: sometimes, string, max:255
- `title`: sometimes, string, max:255
- `text`: sometimes, string
- `content`: sometimes, nullable, array
- `content.schemaVersion`: required_with:content, integer, in:[1]
- `content.segments`: required_with:content, array
- `published`: sometimes, boolean
- `published_at`: sometimes, nullable, date

**Respuestas:**
- **200 OK** - Noticia actualizada (mismo formato que GET /api/news/{id})
- **401 Unauthorized** - No autenticado
- **403 Forbidden** - Sin permisos `news.edit` en el scope de la noticia
- **404 Not Found** - Noticia no encontrada
- **422 Unprocessable Entity** - Error de validación

**Notas:**
- Si `published` cambia a `true` y `published_at` es `null`, se setea `published_at=now()`
- Solo se actualizan los campos enviados en el request
- **El scope de una noticia NO se puede cambiar** una vez creada (ni `scope_type` ni `scope_id`). Si se intenta enviar estos campos, se devolverá error 422

---

### DELETE /api/news/{id}
Eliminar noticia.

**Autenticación:** Requerida (Sanctum)

**Permisos:** `news.edit` en el scope de la noticia

**Parámetros de ruta:**
- `id` (integer) - ID de la noticia

**Respuestas:**
- **204 No Content** - Noticia eliminada
- **401 Unauthorized** - No autenticado
- **403 Forbidden** - Sin permisos `news.edit` en el scope de la noticia
- **404 Not Found** - Noticia no encontrada

---

## Ejemplos de Uso

### Crear noticia global
```bash
curl -X POST http://localhost:8000/api/news \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "scope_type": 1,
    "scope_id": null,
    "slug": "mantenimiento",
    "title": "Mantenimiento Programado",
    "text": "El sistema estará en mantenimiento...",
    "published": true
  }'
```

### Crear noticia de asociación
```bash
curl -X POST http://localhost:8000/api/news \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "scope_type": 2,
    "scope_id": 15,
    "game_id": 5,
    "slug": "nueva-temporada",
    "title": "Nueva Temporada",
    "text": "Comienza la temporada de CS2...",
    "content": {
      "schemaVersion": 1,
      "segments": [
        { "type": "text", "content": "Descripción completa..." }
      ]
    },
    "published": false
  }'
```

### Listar noticias de un juego específico
```bash
curl http://localhost:8000/api/news?game_id=5
```

### Listar noticias de una asociación (publicadas)
```bash
curl http://localhost:8000/api/news?scope_type=2&scope_id=15
```

### Actualizar para publicar
```bash
curl -X PATCH http://localhost:8000/api/news/1 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{ "published": true }'
```

---

## Mensajes de Error

### 401 Unauthorized
```json
{ "message": "No autenticado" }
```

### 403 Forbidden
```json
{ "message": "No tienes permisos para gestionar noticias de esta asociación" }
```

### 404 Not Found
```json
{ "message": "Noticia no encontrada" }
```

### 422 Unprocessable Entity
Ejemplo creación con scope inválido:
```json
{
  "message": "Validation failed",
  "errors": {
    "scope_type": ["El tipo de scope debe ser 1 (global), 2 (asociación) o 3 (juego)."],
    "scope_id": ["El scope_id es obligatorio para asociaciones."],
    "game_id": ["Las noticias globales no pueden tener game_id asignado."]
  }
}
```

Ejemplo actualización con intento de cambiar scope:
```json
{
  "message": "Validation failed",
  "errors": {
    "scope_type": ["No se permite cambiar el scope_type de una noticia."],
    "scope_id": ["No se permite cambiar el scope_id de una noticia."]
  }
}
```
