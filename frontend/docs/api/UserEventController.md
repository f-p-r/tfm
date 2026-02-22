# UserEvent API

API para gestión de asistencias de usuarios a eventos (relación M:M entre `users` y `events`).

## Conceptos

- **status** (integer): Estado de la asistencia. FK → `event_attendance_status_types`
  - `1` = Solicitud pendiente *(estado inicial, asignado automáticamente al crear)*
  - `2` = Admitido
  - `3` = Rechazado
- **statusDate** (timestamp): Fecha en que se produjo el último cambio de estado. Se gestiona **automáticamente**:
  - Al crear: se asigna `now()` si no se indica.
  - Al actualizar: se refresca a `now()` automáticamente cuando `status` cambia.
- La combinación `(user_id, event_id)` es **única**: un usuario solo puede tener una asistencia por evento.

## Autenticación y Permisos

| Operación | Permiso requerido |
|---|---|
| GET (listado y detalle) | Autenticación (cualquier usuario autenticado) |
| POST (crear solicitud) | Autenticación (cualquier usuario autenticado) |
| PUT/PATCH (cambiar estado) | `events.edit` en el scope del evento |
| DELETE (eliminar asistencia) | `events.edit` en el scope del evento |

> **Nota sobre POST:** El campo `status` se fuerza siempre a `1` (Solicitud pendiente) al crear, independientemente de lo que envíe el cliente. Adicionalmente, el evento debe tener `active = true` y `registration_open = true`.

## Endpoints

Base: `/api`

---

### GET /api/user-events
Listar asistencias.

**Autenticación:** Requerida (Sanctum)

**Query Parameters (todos opcionales):**
| Parámetro | Tipo | Descripción |
|---|---|---|
| `event_id` | integer | Filtrar por evento |
| `user_id` | integer | Filtrar por usuario |
| `status` | integer | Filtrar por estado (1, 2, 3) |

**Orden:** `status_date` descendente

**Respuestas:**
- **200 OK**
  ```json
  [
    {
      "id": 1,
      "userId": 5,
      "eventId": 10,
      "status": 1,
      "statusDate": "2026-02-22T10:00:00.000000Z",
      "createdAt": "2026-02-22T10:00:00.000000Z",
      "updatedAt": "2026-02-22T10:00:00.000000Z",
      "user": { "id": 5, "username": "juanperez", "name": "Juan Pérez", "email": "juan@example.com" },
      "event": { "id": 10, "title": "Torneo de Primavera 2026", "slug": "torneo-primavera-2026" },
      "statusType": { "id": 1, "name": "Solicitud pendiente" }
    }
  ]
  ```
- **401 Unauthorized** — No autenticado

---

### GET /api/user-events/{id}
Obtener el detalle de una asistencia.

**Autenticación:** Requerida (Sanctum)

**Parámetros de ruta:**
- `id` (integer) — ID de la asistencia

**Respuestas:**
- **200 OK** — Objeto igual al del listado
- **401 Unauthorized** — No autenticado
- **404 Not Found** — Asistencia no encontrada

---

### POST /api/user-events
Crear una solicitud de asistencia a un evento.

**Autenticación:** Requerida (Sanctum)

**Permisos:** Ninguno adicional (cualquier usuario autenticado puede solicitarlo)

**Request Body:**
```json
{
  "user_id": 5,
  "event_id": 10
}
```

**Validaciones:**
- `user_id`: required, integer, exists:users,id
- `event_id`: required, integer, exists:events,id
  - El evento debe tener `active = true`
  - El evento debe tener `registration_open = true`

**Notas:**
- El campo `status` se fuerza a `1` (Solicitud pendiente). No es enviable.
- `status_date` se asigna automáticamente a `now()`.
- Si ya existe una asistencia para el mismo `(user_id, event_id)`, devuelve **409**.

**Respuestas:**
- **201 Created**
  ```json
  {
    "id": 1,
    "userId": 5,
    "eventId": 10,
    "status": 1,
    "statusDate": "2026-02-22T10:00:00.000000Z",
    "createdAt": "2026-02-22T10:00:00.000000Z",
    "updatedAt": "2026-02-22T10:00:00.000000Z",
    "user": { "id": 5, "username": "juanperez", "name": "Juan Pérez" },
    "event": { "id": 10, "title": "Torneo de Primavera 2026", "slug": "torneo-primavera-2026" },
    "statusType": { "id": 1, "name": "Solicitud pendiente" }
  }
  ```
- **401 Unauthorized** — No autenticado
- **409 Conflict** — Ya existe una asistencia para ese usuario y evento
- **422 Unprocessable Entity** — Error de validación (evento inactivo, inscripción cerrada, etc.)

---

### PUT/PATCH /api/user-events/{id}
Actualizar el estado de una asistencia (aprobar o rechazar).

**Autenticación:** Requerida (Sanctum)

**Permisos:** `events.edit` en el scope del evento asociado

**Notas:**
- `user_id` y `event_id` son **no modificables** (responde 422 si se envían).
- `status_date` se actualiza automáticamente a `now()` cuando `status` cambia.

**Request Body:**
```json
{
  "status": 2
}
```

**Validaciones:**
- `status`: required, integer, must be a valid `event_attendance_status_types.id`
- `user_id`: prohibited
- `event_id`: prohibited

**Respuestas:**
- **200 OK** — Asistencia actualizada (misma estructura que GET)
- **401 Unauthorized** — No autenticado
- **403 Forbidden** — Sin permiso `events.edit` en el scope del evento
- **404 Not Found** — Asistencia no encontrada
- **422 Unprocessable Entity** — Error de validación

---

### DELETE /api/user-events/{id}
Eliminar una asistencia.

**Autenticación:** Requerida (Sanctum)

**Permisos:** `events.edit` en el scope del evento asociado

**Respuestas:**
- **204 No Content** — Asistencia eliminada
- **401 Unauthorized** — No autenticado
- **403 Forbidden** — Sin permiso `events.edit` en el scope del evento
- **404 Not Found** — Asistencia no encontrada
