# CountryController API

Controlador para gestión de países.

## Endpoints

### GET /api/countries
Listar todos los países.

**Autenticación:** No requerida

**Respuestas:**
- **200 OK**
  ```json
  [
    {
      "id": "ES",
      "iso_alpha3": "ESP",
      "name": "España",
      "phone_code": "34",
      "created_at": "2026-01-01T00:00:00.000000Z",
      "updated_at": "2026-01-01T00:00:00.000000Z"
    }
  ]
  ```

---

### GET /api/countries/{id}
Obtener un país específico.

**Autenticación:** No requerida

**Parámetros de ruta:**
- `id` (string) - Código ISO Alpha-2 del país (ej: "ES", "FR", "US")

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": "ES",
    "iso_alpha3": "ESP",
    "name": "España",
    "phone_code": "34",
    "created_at": "2026-01-01T00:00:00.000000Z",
    "updated_at": "2026-01-01T00:00:00.000000Z"
  }
  ```

- **404 Not Found**
  ```json
  {
    "message": "Country not found"
  }
  ```

## Modelo

**Campos:**
- `id` (char 2, PK): Código ISO Alpha-2 del país
- `iso_alpha3` (char 3): Código ISO Alpha-3 del país
- `name` (string): Nombre del país
- `phone_code` (string): Código telefónico del país
- `created_at`, `updated_at`: Timestamps

**Relaciones:**
- `hasMany` - [Region](RegionController.md): Un país tiene muchas regiones
