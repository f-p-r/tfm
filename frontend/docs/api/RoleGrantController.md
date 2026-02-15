# RoleGrantController API

Controlador para gestión de asignaciones de roles a usuarios (role grants).

**IMPORTANTE:** Todos los endpoints requieren autenticación y rol de **administrador**.

## Endpoints

### GET /api/role-grants
Listar todas las asignaciones de roles.

**Autenticación:** Requerida (Sanctum + rol admin)

**Query Parameters:**
- `user_id` (integer, opcional) - Filtrar por un usuario específico
- `user_ids` (string, opcional) - Filtrar por múltiples usuarios (separados por coma). Ejemplo: `5,6,7`

**Respuestas:**
- **200 OK**
  ```json
  [
    {
      "id": 1,
      "user": {
        "id": 5,
        "username": "john_doe",
        "name": "John Doe"
      },
      "role": {
        "id": 2,
        "name": "admin"
      },
      "scope_type": {
        "value": 2,
        "name": "association"
      },
      "scope": {
        "id": 10,
        "name": "Club Example"
      },
      "created_at": "2026-02-15T10:00:00.000000Z",
      "updated_at": "2026-02-15T10:00:00.000000Z"
    },
    {
      "id": 2,
      "user": {
        "id": 5,
        "username": "john_doe",
        "name": "John Doe"
      },
      "role": {
        "id": 1,
        "name": "viewer"
      },
      "scope_type": {
        "value": 1,
        "name": "global"
      },
      "scope": null,
      "created_at": "2026-02-15T10:00:00.000000Z",
      "updated_at": "2026-02-15T10:00:00.000000Z"
    }
  ]
  ```

**Ejemplos:**
```bash
# Listar todas las asignaciones
GET /api/role-grants

# Filtrar por un usuario
GET /api/role-grants?user_id=5

# Filtrar por múltiples usuarios
GET /api/role-grants?user_ids=5,6,7
```

---

### GET /api/role-grants/{id}
Obtener una asignación de rol específica.

**Autenticación:** Requerida (Sanctum + rol admin)

**Parámetros de ruta:**
- `id` (integer) - ID de la asignación de rol

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": 1,
    "user": {
      "id": 5,
      "username": "john_doe",
      "name": "John Doe"
    },
    "role": {
      "id": 2,
      "name": "admin"
    },
    "scope_type": {
      "value": 2,
      "name": "association"
    },
    "scope": {
      "id": 10,
      "name": "Club Example"
    },
    "created_at": "2026-02-15T10:00:00.000000Z",
    "updated_at": "2026-02-15T10:00:00.000000Z"
  }
  ```

- **404 Not Found** - Asignación de rol no encontrada
- **403 Forbidden** - Sin permisos de administrador

---

### POST /api/role-grants
Crear una nueva asignación de rol.

**Autenticación:** Requerida (Sanctum + rol admin)

**Request Body:**
```json
{
  "user_id": "integer (required) - ID del usuario",
  "role_id": "integer (required) - ID del rol",
  "scope_type": "integer (required) - Tipo de scope (1=global, 2=association, 3=game)",
  "scope_id": "integer (nullable) - ID del scope (null o 0 para global, requerido para otros tipos)"
}
```

**Validaciones:**
- `user_id`: Requerido, debe existir en tabla users
- `role_id`: Requerido, debe existir en tabla roles
- `scope_type`: Requerido, valores válidos: 1 (global), 2 (association), 3 (game)
- `scope_id`: 
  - Para `scope_type=1` (global): Debe ser `null` o `0` (se guarda como null en BD)
  - Para `scope_type=2` (association): Requerido, debe existir en tabla associations
  - Para `scope_type=3` (game): Requerido, debe existir en tabla games

**Reglas de negocio:**
1. **No duplicados:** No se puede asignar el mismo rol al mismo usuario en el mismo scope
2. **Exclusividad de scope global:** 
   - Si el usuario ya tiene el rol con `scope_id=null` (global), NO puede tener ese mismo rol con `scope_id` específico para el mismo `scope_type`
   - Si el usuario ya tiene el rol con `scope_id` específico, NO puede tener ese mismo rol con `scope_id=null` (global) para el mismo `scope_type`
3. Ejemplo válido: Usuario puede tener rol "admin" en association 1 y association 2
4. Ejemplo inválido: Usuario tiene rol "admin" global para associations (scope_type=2, scope_id=null), no puede tener "admin" en association 1

**Respuestas:**
- **201 Created**
  ```json
  {
    "id": 1,
    "user": {
      "id": 5,
      "username": "john_doe",
      "name": "John Doe"
    },
    "role": {
      "id": 2,
      "name": "admin"
    },
    "scope_type": {
      "value": 2,
      "name": "association"
    },
    "scope": {
      "id": 10,
      "name": "Club Example"
    },
    "created_at": "2026-02-15T10:00:00.000000Z",
    "updated_at": "2026-02-15T10:00:00.000000Z"
  }
  ```

- **422 Unprocessable Entity** - Errores de validación:
  ```json
  {
    "message": "Validation failed",
    "errors": {
      "user_id": ["El usuario especificado no existe."],
      "scope_id": ["El usuario ya tiene este rol con scope global para este tipo. No se puede asignar un scope específico."]
    }
  }
  ```

- **403 Forbidden** - Sin permisos de administrador

**Ejemplos de peticiones válidas:**

```json
// Asignar rol global
{
  "user_id": 5,
  "role_id": 2,
  "scope_type": 1,
  "scope_id": null
}

// Asignar rol a una asociación específica
{
  "user_id": 5,
  "role_id": 2,
  "scope_type": 2,
  "scope_id": 10
}

// Asignar rol a un juego específico
{
  "user_id": 5,
  "role_id": 3,
  "scope_type": 3,
  "scope_id": 7
}
```

---

### PUT/PATCH /api/role-grants/{id}
Actualizar una asignación de rol existente.

**Autenticación:** Requerida (Sanctum + rol admin)

**Parámetros de ruta:**
- `id` (integer) - ID de la asignación de rol

**Request Body:** (todos los campos opcionales)
```json
{
  "user_id": "integer - ID del usuario",
  "role_id": "integer - ID del rol",
  "scope_type": "integer - Tipo de scope (1=global, 2=association, 3=game)",
  "scope_id": "integer (nullable) - ID del scope"
}
```

**Validaciones:**
- Aplican las mismas validaciones y reglas de negocio que en POST
- Se excluye el registro actual al verificar duplicados

**Respuestas:**
- **200 OK** - Asignación actualizada
  ```json
  {
    "id": 1,
    "user": {
      "id": 5,
      "username": "john_doe",
      "name": "John Doe"
    },
    "role": {
      "id": 2,
      "name": "admin"
    },
    "scope_type": {
      "value": 2,
      "name": "association"
    },
    "scope": {
      "id": 15,
      "name": "Club Updated"
    },
    "created_at": "2026-02-15T10:00:00.000000Z",
    "updated_at": "2026-02-15T11:30:00.000000Z"
  }
  ```

- **422 Unprocessable Entity** - Errores de validación
- **404 Not Found** - Asignación no encontrada
- **403 Forbidden** - Sin permisos de administrador

---

### DELETE /api/role-grants/{id}
Eliminar una asignación de rol.

**Autenticación:** Requerida (Sanctum + rol admin)

**Parámetros de ruta:**
- `id` (integer) - ID de la asignación de rol

**Respuestas:**
- **204 No Content** - Asignación eliminada correctamente
- **404 Not Found** - Asignación no encontrada
- **403 Forbidden** - Sin permisos de administrador

---

## Tipos de Scope

### `scope_type` - Valores posibles:

| Valor | Nombre | Descripción |
|-------|--------|-------------|
| 1 | global | Rol aplicable a nivel global del sistema |
| 2 | association | Rol aplicable a una asociación específica |
| 3 | game | Rol aplicable a un juego específico |

### Estructura del campo `scope`:

- **Para scope_type = 1 (global):** `scope` es `null`
- **Para scope_type = 2 (association):** `scope` contiene `{ id, name }` de la asociación
- **Para scope_type = 3 (game):** `scope` contiene `{ id, name }` del juego

---

## Ejemplos de Reglas de Negocio

### ✅ Permitido:
```json
// Usuario puede tener el mismo rol en diferentes scopes específicos
User 5 - Role "admin" - Association 10
User 5 - Role "admin" - Association 15
User 5 - Role "admin" - Game 7

// Usuario puede tener diferentes roles en el mismo scope
User 5 - Role "admin" - Association 10
User 5 - Role "editor" - Association 10

// Usuario puede tener roles globales para diferentes scope_types
User 5 - Role "admin" - Global (scope_type=1)
User 5 - Role "editor" - Global associations (scope_type=2, scope_id=null)
```

### ❌ No permitido:
```json
// NO: Usuario ya tiene rol global para associations
User 5 - Role "admin" - Global associations (scope_type=2, scope_id=null) ✓ existe
User 5 - Role "admin" - Association 10 (scope_type=2, scope_id=10) ✗ rechazado

// NO: Usuario ya tiene rol en association específica
User 5 - Role "admin" - Association 10 (scope_type=2, scope_id=10) ✓ existe
User 5 - Role "admin" - Global associations (scope_type=2, scope_id=null) ✗ rechazado

// NO: Duplicado exacto
User 5 - Role "admin" - Association 10 ✓ existe
User 5 - Role "admin" - Association 10 ✗ rechazado
```

---

## Mensajes de Error en Español

Todos los errores de validación se devuelven en español:

- "El ID del usuario es requerido."
- "El usuario especificado no existe."
- "El ID del rol es requerido."
- "El rol especificado no existe."
- "El tipo de scope es requerido."
- "El tipo de scope no es válido."
- "Para scope global, el scope_id debe ser null o 0."
- "El scope_id es requerido para este tipo de scope."
- "La asociación especificada no existe."
- "El juego especificado no existe."
- "El usuario ya tiene este rol asignado en este scope."
- "El usuario ya tiene este rol con scope global para este tipo. No se puede asignar un scope específico."
- "El usuario ya tiene este rol asignado a scopes específicos. No se puede asignar scope global."
- "No tienes permisos para crear/actualizar role grants. Se requiere rol de administrador."
