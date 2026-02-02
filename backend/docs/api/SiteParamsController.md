# SiteParams API

API para lectura pública y actualización de parámetros globales del sitio.

## Conceptos

- `id` es la **clave primaria** (string).
- Si se actualiza un `id` inexistente, **se crea** el registro (upsert).

## Endpoints admin (auth:sanctum)

Base: `/api/admin`

### POST /api/admin/site-params/{id}
Crear o actualizar un parámetro.

**Autenticación:** Requerida (Sanctum)

**Parámetros de ruta:**
- `id` (string) - Identificador del parámetro

**Request Body:**
```json
{
  "value": "string"
}
```

**Validaciones:**
- `id`: required, string, max:255
- `value`: required, string

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": "home.title",
    "value": "Mi web",
    "createdAt": "2026-02-02T00:00:00.000000Z",
    "updatedAt": "2026-02-02T00:00:00.000000Z"
  }
  ```
- **422 Unprocessable Entity** - Error de validación

## Endpoints públicos

Base: `/api`

### GET /api/site-params/{id}
Obtener parámetro por `id`.

**Autenticación:** No requerida

**Parámetros de ruta:**
- `id` (string) - Identificador del parámetro

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": "home.title",
    "value": "Mi web"
  }
  ```
- **404 Not Found** - Parámetro no encontrado
