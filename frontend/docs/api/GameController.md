# GameController API

Controlador para gestión de juegos (videojuegos, deportes, etc.).

## Endpoints

### GET /api/games
Listar todos los juegos.

**Autenticación:** No requerida

**Query Parameters:**
- `include_disabled` (boolean, opcional) - Incluir juegos deshabilitados (default: false)

**Respuestas:**
- **200 OK**
  ```json
  [
    {
      "id": 1,
      "name": "League of Legends",
      "slug": "league-of-legends",
      "team_size": 5,
      "disabled": false,
      "created_at": "2026-01-01T00:00:00.000000Z",
      "updated_at": "2026-01-01T00:00:00.000000Z"
    }
  ]
  ```

---

### POST /api/games
Crear un nuevo juego.

**Autenticación:** No requerida

**Request Body:**
```json
{
  "name": "string (required, unique)",
  "slug": "string (required, unique, canonical-slug)",
  "team_size": "integer (required, min:1)",
  "disabled": "boolean (optional, default: false)"
}
```

**Validaciones:**
- `name`: Requerido, único en la tabla games
- `slug`: Requerido, único, debe ser un slug canónico (lowercase, guiones)
- `team_size`: Requerido, entero, mínimo 1
- `disabled`: Booleano opcional

**Respuestas:**
- **201 Created**
  ```json
  {
    "id": 1,
    "name": "League of Legends",
    "slug": "league-of-legends",
    "team_size": 5,
    "disabled": false,
    "created_at": "2026-01-01T00:00:00.000000Z",
    "updated_at": "2026-01-01T00:00:00.000000Z"
  }
  ```

- **422 Unprocessable Entity** - Error de validación

---

### GET /api/games/by-slug/{slug}
Obtener un juego por su slug.

**Autenticación:** No requerida

**Parámetros de ruta:**
- `slug` (string) - Slug único del juego

**Query Parameters:**
- `include_disabled` (boolean, opcional) - Incluir juegos deshabilitados (default: false)

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": 1,
    "name": "League of Legends",
    "slug": "league-of-legends",
    "team_size": 5,
    "disabled": false,
    "created_at": "2026-01-01T00:00:00.000000Z",
    "updated_at": "2026-01-01T00:00:00.000000Z"
  }
  ```

- **404 Not Found** - Juego no encontrado

---

### GET /api/games/{game}
Obtener un juego específico.

**Autenticación:** No requerida

**Parámetros de ruta:**
- `game` (integer) - ID del juego

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": 1,
    "name": "League of Legends",
    "slug": "league-of-legends",
    "team_size": 5,
    "disabled": false,
    "created_at": "2026-01-01T00:00:00.000000Z",
    "updated_at": "2026-01-01T00:00:00.000000Z"
  }
  ```

- **404 Not Found** - Juego no encontrado

---

### PUT/PATCH /api/games/{game}
Actualizar un juego.

**Autenticación:** No requerida

**Parámetros de ruta:**
- `game` (integer) - ID del juego

**Request Body:** (todos los campos opcionales)
```json
{
  "name": "string (unique, ignoring current)",
  "slug": "string (unique, canonical-slug, ignoring current)",
  "team_size": "integer (min:1)",
  "disabled": "boolean"
}
```

**Respuestas:**
- **200 OK** - Juego actualizado
  ```json
  {
    "id": 1,
    "name": "League of Legends Updated",
    ...
  }
  ```

- **422 Unprocessable Entity** - Error de validación
- **404 Not Found** - Juego no encontrado

---

### DELETE /api/games/{game}
Eliminar un juego.

**Autenticación:** No requerida

**Parámetros de ruta:**
- `game` (integer) - ID del juego

**Respuestas:**
- **204 No Content** - Juego eliminado
- **404 Not Found** - Juego no encontrado

---

### GET /api/games/{game}/associations
Obtener las asociaciones relacionadas con un juego.

**Autenticación:** No requerida

**Parámetros de ruta:**
- `game` (integer) - ID del juego

**Respuestas:**
- **200 OK**
  ```json
  [
    {
      "id": 1,
      "name": "Club Example",
      "slug": "club-example",
      "disabled": false,
      ...
    }
  ]
  ```

- **404 Not Found** - Juego no encontrado
