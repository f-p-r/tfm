# UserAssociationController API

Controlador para gestión de membresías de usuarios en asociaciones. Permite gestionar la relación entre usuarios y asociaciones, incluyendo información como número de socio, fecha de ingreso y estado.

## Endpoints

### GET /api/user-associations
Listar todas las membresías de usuarios en asociaciones.

**Autenticación:** Requerida (Sanctum)

**Query Parameters:**
- `user_id` (integer, opcional) - Filtrar por ID de usuario
- `association_id` (integer, opcional) - Filtrar por ID de asociación
- `status_id` (integer, opcional) - Filtrar por ID de estado

**Respuestas:**
- **200 OK**
  ```json
  [
    {
      "id": 1,
      "user_id": 5,
      "association_id": 10,
      "association_user_id": "SOC-2026-001",
      "joined_at": "2026-01-15",
      "status_id": 2,
      "created_at": "2026-02-05T00:00:00.000000Z",
      "updated_at": "2026-02-05T00:00:00.000000Z",
      "user": {
        "id": 5,
        "name": "Juan Pérez",
        "username": "juanperez",
        "email": "juan@example.com"
      },
      "association": {
        "id": 10,
        "name": "Club Example",
        "slug": "club-example",
        "shortname": "CE"
      },
      "status": {
        "id": 2,
        "name": "Activo",
        "order": 1,
        "type": {
          "id": 2,
          "name": "Activo"
        }
      }
    }
  ]
  ```

**Notas:**
- Los resultados están ordenados por `joined_at` (descendente)
- Las relaciones `user`, `association` y `status` (con `statusType`) se cargan automáticamente
- Puedes combinar múltiples filtros para consultas más específicas

---

### POST /api/user-associations
Crear una nueva membresía de usuario en una asociación.

**Autenticación:** Requerida (Sanctum)

**Request Body:**
```json
{
  "user_id": "integer (required, exists:users,id)",
  "association_id": "integer (required, exists:associations,id)",
  "association_user_id": "string (optional, nullable, max:255)",
  "joined_at": "date (optional, nullable, format: YYYY-MM-DD)",
  "status_id": "integer (optional, nullable, exists:association_member_statuses,id)"
}
```

**Validaciones:**
- `user_id`: Requerido, debe existir en tabla users
  - **Debe ser único para la combinación (user_id, association_id)** - Un usuario no puede estar dos veces en la misma asociación
- `association_id`: Requerido, debe existir en tabla associations
- `association_user_id`: Opcional, máximo 255 caracteres
  - **Debe ser único para la combinación (association_id, association_user_id)** - El número de socio debe ser único dentro de cada asociación
- `joined_at`: Opcional, formato de fecha válido (YYYY-MM-DD)
- `status_id`: Opcional, debe existir en tabla association_member_statuses
  - **El estado debe pertenecer a la asociación especificada** (status.association_id == association_id)

**Respuestas:**
- **201 Created**
  ```json
  {
    "id": 1,
    "user_id": 5,
    "association_id": 10,
    "association_user_id": "SOC-2026-001",
    "joined_at": "2026-01-15",
    "status_id": 2,
    "created_at": "2026-02-05T00:00:00.000000Z",
    "updated_at": "2026-02-05T00:00:00.000000Z",
    "user": {
      "id": 5,
      "name": "Juan Pérez",
      "username": "juanperez",
      "email": "juan@example.com"
    },
    "association": {
      "id": 10,
      "name": "Club Example",
      "slug": "club-example",
      "shortname": "CE"
    },
    "status": {
      "id": 2,
      "name": "Activo",
      "order": 1,
      "type": {
        "id": 2,
        "name": "Activo"
      }
    }
  }
  ```

- **422 Unprocessable Entity** - Error de validación
  ```json
  {
    "message": "The user is already a member of this association. (and 2 more errors)",
    "errors": {
      "user_id": ["El usuario ya es miembro de esta asociación."],
      "association_user_id": ["Este identificador de usuario ya está en uso en esta asociación."],
      "status_id": ["El estado seleccionado no pertenece a la asociación especificada."]
    }
  }
  ```

---

### GET /api/user-associations/{user_association}
Obtener una membresía específica.

**Autenticación:** Requerida (Sanctum)

**Parámetros de ruta:**
- `user_association` (integer) - ID de la membresía

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": 1,
    "user_id": 5,
    "association_id": 10,
    "association_user_id": "SOC-2026-001",
    "joined_at": "2026-01-15",
    "status_id": 2,
    "created_at": "2026-02-05T00:00:00.000000Z",
    "updated_at": "2026-02-05T00:00:00.000000Z",
    "user": {
      "id": 5,
      "name": "Juan Pérez",
      "username": "juanperez",
      "email": "juan@example.com"
    },
    "association": {
      "id": 10,
      "name": "Club Example",
      "slug": "club-example",
      "shortname": "CE"
    },
    "status": {
      "id": 2,
      "name": "Activo",
      "order": 1,
      "type": {
        "id": 2,
        "name": "Activo"
      }
    }
  }
  ```

- **404 Not Found** - Membresía no encontrada

---

### PUT/PATCH /api/user-associations/{user_association}
Actualizar una membresía existente.

**Autenticación:** Requerida (Sanctum)

**Parámetros de ruta:**
- `user_association` (integer) - ID de la membresía

**Request Body:** (todos los campos opcionales)
```json
{
  "user_id": "integer (exists:users,id)",
  "association_id": "integer (exists:associations,id)",
  "association_user_id": "string (nullable, max:255)",
  "joined_at": "date (nullable, format: YYYY-MM-DD)",
  "status_id": "integer (nullable, exists:association_member_statuses,id)"
}
```

**Validaciones:**
- `user_id`: Opcional, debe existir en tabla users
  - **Debe ser único para la combinación (user_id, association_id)** excluyendo el registro actual
- `association_id`: Opcional, debe existir en tabla associations
- `association_user_id`: Opcional, máximo 255 caracteres
  - **Debe ser único para la combinación (association_id, association_user_id)** excluyendo el registro actual
- `joined_at`: Opcional, formato de fecha válido (YYYY-MM-DD)
- `status_id`: Opcional, debe existir en tabla association_member_statuses
  - **El estado debe pertenecer a la asociación especificada**

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": 1,
    "user_id": 5,
    "association_id": 10,
    "association_user_id": "SOC-2026-002",
    "joined_at": "2026-01-20",
    "status_id": 3,
    "created_at": "2026-02-05T00:00:00.000000Z",
    "updated_at": "2026-02-05T10:30:00.000000Z",
    "user": {
      "id": 5,
      "name": "Juan Pérez",
      "username": "juanperez",
      "email": "juan@example.com"
    },
    "association": {
      "id": 10,
      "name": "Club Example",
      "slug": "club-example",
      "shortname": "CE"
    },
    "status": {
      "id": 3,
      "name": "Con incidencias",
      "order": 3,
      "type": {
        "id": 3,
        "name": "Incidencias"
      }
    }
  }
  ```

- **404 Not Found** - Membresía no encontrada
- **422 Unprocessable Entity** - Error de validación

---

### DELETE /api/user-associations/{user_association}
Eliminar una membresía.

**Autenticación:** Requerida (Sanctum)

**Parámetros de ruta:**
- `user_association` (integer) - ID de la membresía

**Respuestas:**
- **204 No Content** - Membresía eliminada exitosamente
- **404 Not Found** - Membresía no encontrada

---

## Casos de Uso

### 1. Obtener todas las membresías de un usuario
```
GET /api/user-associations?user_id=5
```

### 2. Obtener todos los miembros de una asociación
```
GET /api/user-associations?association_id=10
```

### 3. Filtrar miembros activos de una asociación
```
GET /api/user-associations?association_id=10&status_id=2
```

### 4. Registrar un nuevo miembro en una asociación
```json
POST /api/user-associations
{
  "user_id": 5,
  "association_id": 10,
  "association_user_id": "SOC-2026-001",
  "joined_at": "2026-01-15",
  "status_id": 2
}
```

### 5. Cambiar el estado de un miembro
```json
PATCH /api/user-associations/1
{
  "status_id": 3
}
```

---

## Notas Importantes

1. **Claves únicas**:
   - `(user_id, association_id)`: Un usuario no puede estar dos veces en la misma asociación
   - `(association_id, association_user_id)`: El número de socio debe ser único dentro de cada asociación

2. **Campo association_user_id**: Es el identificador interno que la asociación le asigna al usuario (número de socio, código de miembro, etc.)

3. **Relaciones**:
   - Una membresía pertenece a un `User` (relación `belongsTo`)
   - Una membresía pertenece a una `Association` (relación `belongsTo`)
   - Una membresía puede tener un `AssociationMemberStatus` opcional (relación `belongsTo`)
   - Un usuario puede tener múltiples membresías (relación `hasMany` en User)
   - Una asociación puede tener múltiples membresías (relación `hasMany` en Association)

4. **Eliminación en cascada**:
   - Si se elimina un usuario, todas sus membresías se eliminan automáticamente (`onDelete('cascade')`)
   - Si se elimina una asociación, todas sus membresías se eliminan automáticamente (`onDelete('cascade')`)
   - Si se elimina un estado, el campo `status_id` se establece en `null` (`onDelete('set null')`)

5. **Validación de estado**: El estado asignado a una membresía debe pertenecer a la misma asociación de la membresía

6. **Autenticación**: Todos los endpoints requieren autenticación mediante Sanctum token
