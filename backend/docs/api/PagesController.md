````markdown
# Pages API

API para gestión de páginas editables por segmentos (admin) y lectura pública de páginas publicadas.

## Conceptos

- `ownerType` **siempre string**. Valores actuales:
  - `"1"` = Global (toda la plataforma)
  - `"2"` = Association
  - `"3"` = Game
- `content` es **objeto JSON** con forma:
  ```json
  { "schemaVersion": 1, "segments": [], "classNames": "css-class otra-clase" }
  ```
  - `schemaVersion`: requerido, debe ser `1`
  - `segments`: requerido, array de bloques de contenido
  - `classNames`: opcional, string de clases CSS aplicadas al contenedor de la página
- Unicidad de slug: **unique(owner_type, owner_id, slug)**
- Reglas `published` / `publishedAt`:
  - Si `published` pasa a `true` y `publishedAt` es `null`, se setea `publishedAt = now()`.
  - Si `published` pasa a `false`, **no** se limpia `publishedAt`.

## Endpoints admin (auth:sanctum)

Base: `/api/admin`

### GET /api/admin/pages
Listar páginas por owner.

**Autenticación:** Requerida (Sanctum)

**Query Parameters:**
- `ownerType` (string, required)
- `ownerId` (integer, required)

**Respuestas:**
- **200 OK**
  ```json
  [
    {
      "id": 1,
      "slug": "inicio",
      "title": "Inicio",
      "published": true,
      "updatedAt": "2026-02-01T00:00:00.000000Z",
      "publishedAt": "2026-02-01T00:00:00.000000Z"
    }
  ]
  ```
- **422 Unprocessable Entity** - Error de validación

**Orden:** `updated_at` desc

---

### GET /api/admin/pages/{id}
Obtener página por ID.

**Autenticación:** Requerida (Sanctum)

**Parámetros de ruta:**
- `id` (integer) - ID de la página

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": 1,
    "ownerType": "2",
    "ownerId": 15,
    "slug": "inicio",
    "title": "Inicio",
    "published": true,
    "publishedAt": "2026-02-01T00:00:00.000000Z",
    "content": { "schemaVersion": 1, "segments": [] },
    "createdAt": "2026-02-01T00:00:00.000000Z",
    "updatedAt": "2026-02-01T00:00:00.000000Z"
  }
  ```
- **404 Not Found** - Página no encontrada

---

### POST /api/admin/pages
Crear página.

**Autenticación:** Requerida (Sanctum)

**Request Body:**
```json
{
  "ownerType": "2",
  "ownerId": 15,
  "slug": "inicio",
  "title": "Inicio",
  "published": false,
  "publishedAt": null,
  "content": { "schemaVersion": 1, "segments": [] }
}
```

**Validaciones:**
- `ownerType`: required, string
- `ownerId`: required, integer
- `slug`: required, string, unique por owner
- `title`: required, string
- `published`: required, boolean
- `publishedAt`: optional, nullable, date
- `content`: required, array
- `content.schemaVersion`: required, integer, in:1
- `content.segments`: required, array
- `content.classNames`: sometimes, nullable, string

**Respuestas:**
- **201 Created** - Página creada
- **422 Unprocessable Entity** - Error de validación

---

### PATCH /api/admin/pages/{id}
Actualizar página (parcial).

**Autenticación:** Requerida (Sanctum)

**Parámetros de ruta:**
- `id` (integer) - ID de la página

**Request Body:** (todos opcionales)
```json
{
  "slug": "inicio",
  "title": "Inicio",
  "published": true,
  "publishedAt": null,
  "content": { "schemaVersion": 1, "segments": [] }
}
```

**Reglas:**
- Si cambia `slug`, se valida unicidad por owner.
- `publishedAt` solo se aplica si viene explícito.
- Si `published=true` y `publishedAt=null`, se setea `now()`.

**Respuestas:**
- **200 OK** - Página actualizada
- **404 Not Found** - Página no encontrada
- **422 Unprocessable Entity** - Error de validación

---

### DELETE /api/admin/pages/{id}
Eliminar página.

**Autenticación:** Requerida (Sanctum)

**Parámetros de ruta:**
- `id` (integer) - ID de la página

**Acción extra:**
- Si la página era `homePageId` del owner (ownerType `"2"` o `"3"`), se limpia a `null`.

**Respuestas:**
- **204 No Content** - Página eliminada
- **404 Not Found** - Página no encontrada

---

### GET /api/admin/owners/home-page
Obtener `homePageId` de un owner.

**Autenticación:** Requerida (Sanctum)

**Query Parameters:**
- `ownerType` (string, required)
- `ownerId` (integer, required)

**Respuestas:**
- **200 OK**
  ```json
  { "homePageId": 123 }
  ```
- **404 Not Found** - Owner no encontrado
- **422 Unprocessable Entity** - `ownerType` no soportado

---

### PUT /api/admin/owners/home-page
Establecer `homePageId` de un owner.

**Autenticación:** Requerida (Sanctum)

**Request Body:**
```json
{ "ownerType": "2", "ownerId": 15, "homePageId": 123 }
```

**Validaciones:**
- `ownerType`: required, string
- `ownerId`: required, integer
- `homePageId`: nullable, integer
- Si `homePageId` != null, la Page debe existir y pertenecer al owner

**Respuestas:**
- **200 OK**
  ```json
  { "homePageId": 123 }
  ```
- **404 Not Found** - Owner no encontrado
- **422 Unprocessable Entity** - Error de validación o `ownerType` no soportado

## Endpoints públicos

Base: `/api`

### GET /api/pages/{id}
Obtener página publicada por ID.

**Autenticación:** No requerida

**Parámetros de ruta:**
- `id` (integer) - ID de la página

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": 1,
    "ownerType": "2",
    "ownerId": 15,
    "slug": "inicio",
    "title": "Inicio",
    "publishedAt": "2026-02-01T00:00:00.000000Z",
    "content": { "schemaVersion": 1, "segments": [] },
    "updatedAt": "2026-02-01T00:00:00.000000Z"
  }
  ```
- **404 Not Found** - Página no encontrada o no publicada

**Nota:** Este endpoint solo devuelve páginas con `published = true`. Para ver páginas no publicadas o borradores, usar el endpoint admin.

---

### GET /api/pages/home
Obtener home page publicada por owner.

**Autenticación:** No requerida

**Query Parameters:**
- `ownerType` (string, required)
- `ownerSlug` (string, required)

**Resolución de `homePageId` según `ownerType`:**
| ownerType | Origen del homePageId |
|---|---|
| `"1"` (global) | `site_params` donde `id = 'homepage'` |
| `"2"` (association) | `associations.homePageId` |
| `"3"` (game) | `games.homePageId` |

> Para `ownerType=1` (global) el parámetro `ownerSlug` se ignora.

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": 1,
    "ownerType": "2",
    "ownerId": 15,
    "slug": "inicio",
    "title": "Inicio",
    "publishedAt": "2026-02-01T00:00:00.000000Z",
    "content": { "schemaVersion": 1, "segments": [] },
    "updatedAt": "2026-02-01T00:00:00.000000Z"
  }
  ```
- **404 Not Found** - Owner no existe / no hay home / no publicada
- **501 Not Implemented** - `ownerType` no soportado

---

### GET /api/pages/by-owner-slug
Obtener page publicada por owner y pageSlug.

**Autenticación:** No requerida

**Query Parameters:**
- `ownerType` (string, required)
- `ownerSlug` (string, required)
- `pageSlug` (string, required)

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": 1,
    "ownerType": "2",
    "ownerId": 15,
    "slug": "inicio",
    "title": "Inicio",
    "publishedAt": "2026-02-01T00:00:00.000000Z",
    "content": { "schemaVersion": 1, "segments": [] },
    "updatedAt": "2026-02-01T00:00:00.000000Z"
  }
  ```
- **404 Not Found** - Owner o página no encontrada / no publicada
- **501 Not Implemented** - `ownerType` no soportado

````

---

### GET /api/pages/list-by-owner
Listar paginas publicadas de un owner (id, slug, titulo y si es home page).
Endpoint pensado para construir menus de navegacion.

**Autenticacion:** No requerida

**Query Parameters:**
- `ownerType` (string, required)
- `ownerSlug` (string, required)

**Orden:** `title` ascendente

**Resolucion de `homePageId`:**
| ownerType | Origen del homePageId |
|---|---|
| `"1"` (global) | `site_params` donde `id = 'homepage'` |
| `"2"` (association) | `associations.homePageId` |
| `"3"` (game) | `games.homePageId` |

**Respuestas:**
- **200 OK**
  ```json
  [
    { "id": 1, "slug": "inicio",     "title": "Inicio",     "home": true  },
    { "id": 2, "slug": "reglamento", "title": "Reglamento", "home": false }
  ]
  ```
- **404 Not Found** - Owner no encontrado
- **422 Unprocessable Entity** - Faltan parametros obligatorios (`ownerType` o `ownerSlug`)
- **501 Not Implemented** - `ownerType` no soportado

**Campo `home`:** `true` si el `id` de la pagina coincide con el `homePageId` del owner; `false` en caso contrario. Para `ownerType=1` (global), `ownerSlug` se ignora.
