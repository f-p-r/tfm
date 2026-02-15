# AssociationController API

Controlador para gestión de asociaciones (clubes, equipos, etc.).

## Endpoints

### GET /api/associations
Listar todas las asociaciones.

**Autenticación:** No requerida

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
      "web": "https://www.clubexample.com",
      "external_url": "https://external-site.com",
      "disabled": false,
      "management": true,
      "province": "Madrid",
      "homePageId": 5,
      "owner_id": 10,
      "has_internal_web": true,
      "games": [...],
      "country": {...},
      "region": {...},
      "owner": {
        "id": 10,
        "username": "admin_user",
        "name": "Administrator",
        "email": "admin@example.com"
      },
      "created_at": "...",
      "updated_at": "..."
    }
  ]
  ```

---

### GET /api/associations/{id}
Obtener una asociación específica.

**Autenticación:** No requerida

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
    "web": "https://www.clubexample.com",
    "external_url": "https://external-site.com",
    "region_id": "ES-MD",
    "disabled": false,
    "management": true,
    "province": "Madrid",
    "homePageId": 5,
    "owner_id": 10,
    "has_internal_web": true,
    "games": [...],
    "country": {...},
    "region": {...},
    "owner": {
      "id": 10,
      "username": "admin_user",
      "name": "Administrator",
      "email": "admin@example.com"
    },
    "created_at": "...",
    "updated_at": "..."
  }
  ```

- **404 Not Found** - Asociación no encontrada

---

### GET /api/associations/by-slug/{slug}
Obtener una asociación por su slug.

**Autenticación:** No requerida

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
    "web": "https://www.clubexample.com",
    "external_url": "https://external-site.com",
    "disabled": false,
    "management": true,
    "province": "Madrid",
    "homePageId": 5,
    "owner_id": 10,
    "has_internal_web": true,
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
    "owner": {
      "id": 10,
      "username": "admin_user",
      "name": "Administrator",
      "email": "admin@example.com"
    },
    "created_at": "2026-01-01T00:00:00.000000Z",
    "updated_at": "2026-01-01T00:00:00.000000Z"
  }
  ```

- **404 Not Found** - Asociación no encontrada

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
  "web": "string (optional, url, max:2048) - URL del sitio web oficial",
  "external_url": "string (optional, url, max:2048) - URL externa adicional",
  "disabled": "boolean (optional, default: false) - Si la asociación está deshabilitada",
  "management": "boolean (optional, nullable) - Si tiene gestión activa",
  "province": "string (optional, nullable, max:255) - Provincia",
  "homePageId": "integer (optional, nullable, exists:pages,id) - ID de la página home",
  "owner_id": "integer (optional, nullable, exists:users,id) - ID del propietario/responsable",
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
- `web`: Opcional, debe ser una URL válida, máximo 2048 caracteres
- `external_url`: Opcional, debe ser una URL válida, máximo 2048 caracteres
- `disabled`: Booleano opcional
- `management`: Booleano opcional
- `province`: Opcional, máximo 255 caracteres
- `homePageId`: Opcional, debe existir en tabla pages
- `owner_id`: Opcional, debe existir en tabla users
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
    "web": "https://www.clubexample.com",
    "external_url": "https://external-site.com",
    "disabled": false,
    "management": true,
    "province": "Madrid",
    "homePageId": 5,
    "owner_id": 10,
    "has_internal_web": false,
    "games": [...],
    "country": {...},
    "region": {...},
    "owner": {
      "id": 10,
      "username": "admin_user",
      "name": "Administrator",
      "email": "admin@example.com"
    },
    "member_statuses": [
      {
        "id": 1,
        "association_id": 1,
        "type": 1,
        "order": 1,
        "name": "Solicitud de ingreso",
        "description": "",
        "created_at": "...",
        "updated_at": "..."
      },
      {
        "id": 2,
        "association_id": 1,
        "type": 2,
        "order": 2,
        "name": "Activo",
        "description": "",
        "created_at": "...",
        "updated_at": "..."
      }
      // ... más estados según association_member_status_types
    ],
    "created_at": "...",
    "updated_at": "..."
  }
  ```

**Nota:** Al crear una asociación, se crean automáticamente registros en `association_member_statuses` para cada tipo existente en `association_member_status_types`. Estos estados iniciales tienen:
- `type` = ID del tipo de estado
- `order` = ID del tipo de estado
- `name` = Nombre del tipo de estado
- `description` = '' (vacío)

- **422 Unprocessable Entity** - Error de validación
  - Región especificada sin país
  - Región no pertenece al país especificado

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
  "web": "string (url, max:2048) - URL del sitio web oficial",
  "external_url": "string (url, max:2048) - URL externa adicional",
  "disabled": "boolean - Si la asociación está deshabilitada",
  "management": "boolean (nullable) - Si tiene gestión activa",
  "province": "string (nullable, max:255) - Provincia",
  "homePageId": "integer (nullable, exists:pages,id) - ID de la página home",
  "owner_id": "integer (nullable, exists:users,id) - ID del propietario/responsable",
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

---

## Campos Especiales

### `has_internal_web` (computed)
Campo calculado que indica si la asociación tiene páginas internas configuradas en el sistema.

- **Tipo:** `boolean`
- **Solo lectura:** No se puede enviar en POST/PUT, se calcula automáticamente
- **Cálculo:** Retorna `true` si existe al menos una página con `owner_type=2` y `owner_id` igual al ID de la asociación

**Ejemplo:**
```json
{
  "id": 5,
  "name": "Mi Asociación",
  "has_internal_web": true,  // Indica que tiene páginas configuradas
  ...
}
```

### `homePageId`
ID de la página configurada como home/inicio de la asociación.

- **Tipo:** `integer` (nullable)
- **Relación:** Referencia a la tabla `pages`
- **Uso:** Permite establecer qué página se muestra como home de la asociación

### `owner_id`
ID del usuario propietario o responsable de la asociación.

- **Tipo:** `integer` (nullable)
- **Relación:** Referencia a la tabla `users`
- **Uso:** Identifica el usuario responsable de administrar la asociación

**Objeto relacionado `owner`:**
Cuando `owner_id` está asignado, la API devuelve automáticamente el objeto completo del usuario:
```json
"owner": {
  "id": 10,
  "username": "admin_user",
  "name": "Administrator",
  "email": "admin@example.com",
  ...
}
```
Si `owner_id` es `null`, el campo `owner` será `null`.

### `external_url`
URL externa adicional de la asociación (diferente al sitio web oficial).

- **Tipo:** `string` (nullable, url, max:2048)
- **Uso:** Para almacenar enlaces a redes sociales, foros, u otros recursos externos

### `management`
Indica si la asociación tiene gestión activa en el sistema.

- **Tipo:** `boolean` (nullable)
- **Uso:** Para filtrar o identificar asociaciones con gestión administrativa activa

### `province`
Provincia donde se encuentra la asociación.

- **Tipo:** `string` (nullable, max:255)
- **Uso:** Información geográfica adicional más específica que la región
