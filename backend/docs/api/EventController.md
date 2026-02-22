# Events API

API para gestión de eventos con autenticación y permisos por scope.

## Conceptos

- **scopeType** (integer): Define el ámbito del evento
  - `1` = Global (toda la plataforma)
  - `2` = Association (asociación específica)
  - `3` = Game (juego específico)
- **scopeId** (integer, nullable): ID del scope (null para global, requerido para association/game)
- **gameId** (integer, nullable): ID del juego asociado
  - Para `scopeType=1` (global): NO permitido
  - Para `scopeType=2` (association): Opcional, indica que el evento es sobre un juego específico dentro de la asociación
  - Para `scopeType=3` (game): Se **asigna automáticamente** igual a `scopeId`
- **slug** (string): Identificador URL-friendly, **NO es único globalmente**
  - URL final sugerida: `/eventos/{id}/{slug}`
- **text** (string): Descripción breve para cards/listados
- **hasContent** (boolean): Indica si el evento tiene contenido web (`content != null` y `segments` no vacío). Solo aparece en el listado (GET /api/events).
- **content** (object, nullable): Contenido web completo en formato JSON estructurado
  ```json
  { "schemaVersion": 1, "segments": [], "classNames": "css-class" }
  ```
  - `schemaVersion`: requerido, debe ser `1`
  - `segments`: requerido, array de bloques de contenido
  - `classNames`: opcional, string de clases CSS aplicadas al contenedor
- **active** (boolean): El evento está visible/activo. Default: `true`
- **registrationOpen** (boolean): Se aceptan solicitudes de asistencia. Default: `false`
- **Reglas `published` / `publishedAt`:**
  - Si `published` pasa a `true` y `publishedAt` es `null`, se setea `publishedAt = now()`
  - Si `published` pasa a `false`, **no** se limpia `publishedAt`

### Dirección del evento

Todos los campos de dirección son opcionales:

| Campo | Tipo | Descripción |
|---|---|---|
| `countryCode` | `char(2)` | Código ISO 3166-1 alpha-2 (ej. `ES`). FK → `countries.id` |
| `country` | object | `{ id, name }` — solo en respuestas |
| `regionId` | string | ID de región (ej. `ES-MD`). FK → `regions.id` |
| `region` | object | `{ id, name }` — solo en respuestas |
| `provinceName` | string | Nombre de la provincia |
| `municipalityName` | string | Municipio o localidad |
| `postalCode` | `char(5)` | Código postal (5 dígitos numéricos) |
| `streetName` | string | Nombre de la vía |
| `streetNumber` | string | Número (admite formatos como `3-B`, `12 bis`) |

## Autenticación y Permisos

**Permiso requerido:** `events.edit` (Creación / Edición / Eliminación de eventos)

La autorización se valida por **scope**:
- Para gestionar eventos globales (`scopeType=1`): Requiere `events.edit` en scope global
- Para gestionar eventos de asociación (`scopeType=2`): Requiere `events.edit` en scope de esa asociación
- Para gestionar eventos de juego (`scopeType=3`): Requiere `events.edit` en scope de ese juego

## Endpoints

Base: `/api`

---

### GET /api/events
Listar eventos.

**Autenticación:** No requerida (para eventos publicados)

**Query Parameters (todos opcionales):**
| Parámetro | Tipo | Descripción |
|---|---|---|
| `scope_type` | integer | Filtrar por tipo de scope (1, 2, 3) |
| `scope_id` | integer | Filtrar por ID de scope |
| `game_id` | integer | Filtrar por juego |
| `active` | boolean | Filtrar por estado activo/inactivo |
| `registration_open` | boolean | Filtrar por solicitudes abiertas |
| `from` | date | Filtrar eventos con `starts_at` ≥ fecha |
| `to` | date | Filtrar eventos con `starts_at` ≤ fecha |
| `include_unpublished` | boolean | Incluir eventos no publicados (requiere permiso `events.edit`) |

**Orden:** `starts_at` ascendente (más próximos primero)

**Respuestas:**
- **200 OK**
  ```json
  [
    {
      "id": 1,
      "scopeType": 2,
      "scopeId": 15,
      "gameId": 5,
      "slug": "torneo-primavera-2026",
      "title": "Torneo de Primavera 2026",
      "text": "El gran torneo anual de nuestra asociación...",
      "hasContent": true,
      "startsAt": "2026-04-01T10:00:00.000000Z",
      "endsAt": "2026-04-03T20:00:00.000000Z",
      "countryCode": "ES",
      "country": { "id": "ES", "name": "España" },
      "regionId": "ES-MD",
      "region": { "id": "ES-MD", "name": "Comunidad de Madrid" },
      "provinceName": "Madrid",
      "municipalityName": "Madrid",
      "postalCode": "28001",
      "streetName": "Calle Gran Vía",
      "streetNumber": "1",
      "active": true,
      "registrationOpen": true,
      "published": true,
      "publishedAt": "2026-02-15T09:00:00.000000Z",
      "createdBy": 1,
      "createdAt": "2026-02-10T08:00:00.000000Z",
      "updatedAt": "2026-02-15T09:00:00.000000Z",
      "creator": { "id": 1, "username": "admin", "name": "Administrador" },
      "game": { "id": 5, "name": "Counter-Strike 2", "slug": "cs2" }
    }
  ]
  ```

**⚠️ IMPORTANTE:** El listado NO incluye el campo `content` (solo `text`). Incluye `hasContent` para saber si hay contenido web sin cargar el detalle.

**Notas sobre `include_unpublished`:**
- Usuario con `events.edit` global → ve todos (publicados + no publicados)
- Usuario con `events.edit` en association X → ve publicados de todos + no publicados de association X
- Usuario con `events.edit` en game Y → ve publicados de todos + no publicados de game Y
- Sin autenticación o sin permisos → solo ve publicados

---

### GET /api/events/{id}
Obtener detalle de un evento.

**Autenticación:** No requerida (para eventos publicados)

**Parámetros de ruta:**
- `id` (integer) — ID del evento

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": 1,
    "scopeType": 2,
    "scopeId": 15,
    "gameId": 5,
    "slug": "torneo-primavera-2026",
    "title": "Torneo de Primavera 2026",
    "text": "El gran torneo anual de nuestra asociación...",
    "content": { "schemaVersion": 1, "segments": [] },
    "startsAt": "2026-04-01T10:00:00.000000Z",
    "endsAt": "2026-04-03T20:00:00.000000Z",
    "countryCode": "ES",
    "country": { "id": "ES", "name": "España" },
    "regionId": "ES-MD",
    "region": { "id": "ES-MD", "name": "Comunidad de Madrid" },
    "provinceName": "Madrid",
    "municipalityName": "Madrid",
    "postalCode": "28001",
    "streetName": "Calle Gran Vía",
    "streetNumber": "1",
    "active": true,
    "registrationOpen": true,
    "published": true,
    "publishedAt": "2026-02-15T09:00:00.000000Z",
    "createdBy": 1,
    "createdAt": "2026-02-10T08:00:00.000000Z",
    "updatedAt": "2026-02-15T09:00:00.000000Z",
    "creator": { "id": 1, "username": "admin", "name": "Administrador" },
    "game": { "id": 5, "name": "Counter-Strike 2", "slug": "cs2" }
  }
  ```
- **404 Not Found** — Evento no encontrado o no publicado sin permisos

**Notas:**
- Si el evento NO está publicado: requiere autenticación y permiso `events.edit` en su scope; en caso contrario devuelve 404

---

### POST /api/events
Crear un nuevo evento.

**Autenticación:** Requerida (Sanctum)

**Permisos:** `events.edit` en el scope especificado

**Request Body:**
```json
{
  "scope_type": 2,
  "scope_id": 15,
  "game_id": 5,
  "slug": "torneo-primavera-2026",
  "title": "Torneo de Primavera 2026",
  "text": "El gran torneo anual de nuestra asociación...",
  "content": { "schemaVersion": 1, "segments": [] },
  "starts_at": "2026-04-01T10:00:00",
  "ends_at": "2026-04-03T20:00:00",
  "country_code": "ES",
  "region_id": "ES-MD",
  "province_name": "Madrid",
  "municipality_name": "Madrid",
  "postal_code": "28001",
  "street_name": "Calle Gran Vía",
  "street_number": "1",
  "active": true,
  "registration_open": false,
  "published": false,
  "published_at": null
}
```

**Validaciones:**
- `scope_type`: required, integer, in:[1,2,3]
- `scope_id`:
  - MUST be null para `scope_type=1` (global)
  - MUST be NOT null y existir en `associations` para `scope_type=2`
  - MUST be NOT null y existir en `games` para `scope_type=3`
- `game_id`: nullable, exists:games,id — NO permitido para global; para `scope_type=3` se asigna automáticamente
- `slug`: required, string, max:255
- `title`: required, string, max:255
- `text`: required, string
- `content`: nullable, array
  - `content.schemaVersion`: required_with:content, integer, in:[1]
  - `content.segments`: required_with:content, array
  - `content.classNames`: sometimes, nullable, string
- `starts_at`: required, date
- `ends_at`: nullable, date, after:starts_at
- `country_code`: nullable, size:2, exists:countries,id
- `region_id`: nullable, string, exists:regions,id
- `province_name`: nullable, string, max:255
- `municipality_name`: nullable, string, max:255
- `postal_code`: nullable, size:5, regex:/^\d{5}$/
- `street_name`: nullable, string, max:255
- `street_number`: nullable, string, max:20
- `active`: sometimes, boolean (default: `true`)
- `registration_open`: sometimes, boolean (default: `false`)
- `published`: required, boolean
- `published_at`: nullable, date

**Respuestas:**
- **201 Created** — Evento creado (respuesta con el detalle completo, igual que GET /api/events/{id})
- **401 Unauthorized** — No autenticado
- **403 Forbidden** — Sin permisos en el scope indicado
- **422 Unprocessable Entity** — Error de validación

---

### PUT/PATCH /api/events/{id}
Actualizar un evento.

**Autenticación:** Requerida (Sanctum)

**Permisos:** `events.edit` en el scope del evento

**Notas:**
- `scope_type` y `scope_id` son **no modificables** (responde 422 si se envían)
- Todos los campos son opcionales (`sometimes`), solo se actualizan los enviados
- `ends_at` acepta `null` explícito para eliminar la fecha de fin

**Request Body (ejemplo parcial):**
```json
{
  "title": "Torneo de Primavera 2026 - Actualizado",
  "registration_open": true,
  "ends_at": null
}
```

**Respuestas:**
- **200 OK** — Evento actualizado (respuesta con el detalle completo)
- **401 Unauthorized** — No autenticado
- **403 Forbidden** — Sin permisos
- **404 Not Found** — Evento no encontrado
- **422 Unprocessable Entity** — Error de validación

---

### DELETE /api/events/{id}
Eliminar un evento.

**Autenticación:** Requerida (Sanctum)

**Permisos:** `events.edit` en el scope del evento

**Respuestas:**
- **204 No Content** — Evento eliminado
- **401 Unauthorized** — No autenticado
- **403 Forbidden** — Sin permisos
- **404 Not Found** — Evento no encontrado
