# AssociationController API

Controlador para gestión de asociaciones (clubes, equipos, etc.).

## Endpoints

### GET /api/associations/by-slug/{slug}
Obtener una asociación por su slug.

**Autenticación:** Requerida (Sanctum)

**Parámetros de ruta:**
- `slug` (string) - Slug único de la asociación

**Query Parameters:**
- `include_disabled` (boolean, opcional) - Incluir asociaciones deshabilitadas (default: false)

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": 1,
    "name": "Club Example",
    "shortname": "CE",
    "slug": "club-example",
    "description": "Descripción del club...",
    "country_id": "ES",
    "region_id": "ES-MD",
    "disabled": false,
    "games": [...],
    "country": {
      "id": "ES",
      "name": "España",
      ...
    },
    "region": {
      "id": "ES-MD",
      "name": "Madrid",
      ...
    },
    "created_at": "2026-01-01T00:00:00.000000Z",
    "updated_at": "2026-01-01T00:00:00.000000Z"
  }
  ```

- **404 Not Found** - Asociación no encontrada

---

### GET /api/associations
Listar todas las asociaciones.

**Autenticación:** Requerida (Sanctum)

**Query Parameters:**
- `include_disabled` (boolean, opcional) - Incluir asociaciones deshabilitadas (default: false)

**Respuestas:**
- **200 OK**
  ```json
  [
    {
      "id": 1,
      "name": "Club Example",
      "shortname": "CE",
      "slug": "club-example",
      "description": "Descripción del club...",
      "country_id": "ES",
      "region_id": "ES-MD",
      "disabled": false,
      "games": [...],
      "country": {...},
      "region": {...},
      "created_at": "...",
      "updated_at": "..."
    }
  ]
  ```

---

### POST /api/associations
Crear una nueva asociación.

**Autenticación:** Requerida (Sanctum)

**Request Body:**
```json
{
  "name": "string (required, unique)",
  "shortname": "string (optional, unique, max:20) - Nombre corto de la asociación",
  "slug": "string (required, unique, canonical-slug)",
  "description": "string (optional) - Descripción de la asociación",
  "country_id": "string (optional, nullable) - Código ISO del país",
  "region_id": "string (optional, nullable) - ID de la región",
  "disabled": "boolean (optional, default: false)",
  "game_ids": "array (optional) - IDs de juegos asociados",
  "game_ids.*": "integer (exists:games,id)"
}
```

**Validaciones:**
- `name`: Requerido, único en la tabla associations
- `shortname`: Opcional, único en la tabla associations, máximo 20 caracteres
- `slug`: Requerido, único, debe ser un slug canónico (lowercase, guiones)
- `description`: Opcional, texto largo
- `country_id`: Opcional, debe existir en tabla countries
- `region_id`: Opcional, debe existir en tabla regions
  - **Si se informa `region_id`, `country_id` es obligatorio**
  - **La región debe pertenecer al país especificado** (region.country_id == country_id)
- `disabled`: Booleano opcional
- `game_ids`: Array opcional de IDs de juegos existentes

**Respuestas:**
- **201 Created**
  ```json
  {
    "id": 1,
    "name": "Club Example",
    "shortname": "CE",
    "slug": "club-example",
    "description": "Descripción del club...",
    "country_id": "ES",
    "region_id": "ES-MD",
    "disabled": false,
    "games": [...],
    "country": {...},
    "region": {...},
    "created_at": "...",
    "updated_at": "..."
  }
  ```

- **422 Unprocessable Entity** - Error de validación
  - Región especificada sin país
  - Región no pertenece al país especificado

---

### GET /api/associations/{id}
Obtener una asociación específica.

**Autenticación:** Requerida (Sanctum)

**Parámetros de ruta:**
- `id` (integer) - ID de la asociación

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": 1,
    "name": "Club Example",
    "shortname": "CE",
    "slug": "club-example",
    "description": "Descripción del club...",
    "country_id": "ES",
    "region_id": "ES-MD",
    "disabled": false,
    "games": [...],
    "country": {...},
    "region": {...},
    "created_at": "...",
    "updated_at": "..."
  }
  ```

- **404 Not Found** - Asociación no encontrada

---

### PUT/PATCH /api/associations/{id}
Actualizar una asociación.

**Autenticación:** Requerida (Sanctum)

**Parámetros de ruta:**
- `id` (integer) - ID de la asociación

**Request Body:** (todos los campos opcionales)
```json
{
  "name": "string (unique, ignoring current)",
  "shortname": "string (unique, max:20, ignoring current) - Nombre corto",
  "slug": "string (unique, canonical-slug, ignoring current)",
  "description": "string - Descripción de la asociación",
  "country_id": "string (nullable) - Código ISO del país",
  "region_id": "string (nullable) - ID de la región",
  "disabled": "boolean",
  "game_ids": "array - IDs de juegos asociados"
}
```

**Validaciones:**
- Mismas validaciones que POST
- Si se actualiza `region_id`, se valida que pertenezca al `country_id` (actual o nuevo)
- Si se especifica `region_id`, el país debe estar informado (ya sea actual o en la actualización)

**Respuestas:**
- **200 OK** - Asociación actualizada
- **422 Unprocessable Entity** - Error de validación
  - Región especificada sin país
  - Región no pertenece al país especificado
- **404 Not Found** - Asociación no encontrada

---

### DELETE /api/associations/{id}
Eliminar una asociación.

**Autenticación:** Requerida (Sanctum)

**Parámetros de ruta:**
- `id` (integer) - ID de la asociación

**Respuestas:**
- **204 No Content** - Asociación eliminada
- **404 Not Found** - Asociación no encontrada
