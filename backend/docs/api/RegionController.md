# RegionController API

Controlador para gestión de regiones (comunidades autónomas, estados, provincias, etc.).

## Endpoints

### GET /api/regions
Listar todas las regiones.

**Autenticación:** No requerida

**Respuestas:**
- **200 OK**
  ```json
  [
    {
      "id": "ES-MD",
      "country_id": "ES",
      "name": "Madrid",
      "created_at": "2026-01-01T00:00:00.000000Z",
      "updated_at": "2026-01-01T00:00:00.000000Z"
    },
    {
      "id": "ES-CT",
      "country_id": "ES",
      "name": "Cataluña",
      "created_at": "2026-01-01T00:00:00.000000Z",
      "updated_at": "2026-01-01T00:00:00.000000Z"
    }
  ]
  ```

---

### GET /api/regions/{id}
Obtener una región específica.

**Autenticación:** No requerida

**Parámetros de ruta:**
- `id` (string) - Código de región (ej: "ES-MD", "ES-CT", "US-CA")

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": "ES-MD",
    "country_id": "ES",
    "name": "Madrid",
    "created_at": "2026-01-01T00:00:00.000000Z",
    "updated_at": "2026-01-01T00:00:00.000000Z"
  }
  ```

- **404 Not Found**
  ```json
  {
    "message": "Region not found"
  }
  ```

## Modelo

**Campos:**
- `id` (string, PK): Código de región formato ISO (ej: "ES-MD")
- `country_id` (char 2, FK): Código del país al que pertenece
- `name` (string): Nombre de la región
- `created_at`, `updated_at`: Timestamps

**Relaciones:**
- `belongsTo` - [Country](CountryController.md): Una región pertenece a un país

## Regiones de España

El sistema incluye las 19 Comunidades Autónomas y Ciudades Autónomas de España:

| Código | Nombre |
|--------|--------|
| ES-AN | Andalucía |
| ES-AR | Aragón |
| ES-AS | Asturias |
| ES-IB | Baleares |
| ES-CN | Canarias |
| ES-CB | Cantabria |
| ES-CL | Castilla y León |
| ES-CM | Castilla-La Mancha |
| ES-CT | Cataluña |
| ES-VC | Comunitat Valenciana |
| ES-EX | Extremadura |
| ES-GA | Galicia |
| ES-MD | Madrid |
| ES-MC | Murcia |
| ES-NC | Navarra |
| ES-PV | País Vasco |
| ES-RI | La Rioja |
| ES-CE | Ceuta |
| ES-ML | Melilla |
