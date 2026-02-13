# AssociationMemberStatusController API

Controlador para gestión de estados de miembros de asociaciones (estados de solicitud, activo, incidencias, etc.).

## Endpoints

### GET /api/association-member-statuses
Listar todos los estados de miembros de asociaciones.

**Autenticación:** Requerida (Sanctum)

**Query Parameters:**
- `association_id` (integer, opcional) - Filtrar por ID de asociación
- `type` (integer, opcional) - Filtrar por tipo de estado (ID del tipo)

**Respuestas:**
- **200 OK**
  ```json
  [
    {
      "id": 1,
      "association_id": 5,
      "type": 2,
      "order": 1,
      "name": "Activo",
      "description": "Miembro activo en la asociación",
      "created_at": "2026-02-05T00:00:00.000000Z",
      "updated_at": "2026-02-05T00:00:00.000000Z",
      "association": {
        "id": 5,
        "name": "Club Example",
        "slug": "club-example"
      },
      "status_type": {
        "id": 2,
        "name": "Activo"
      }
    }
  ]
  ```

**Notas:**
- Los resultados están ordenados por `order` (ascendente) y luego por `name`
- Las relaciones `association` y `statusType` se cargan automáticamente

---

### POST /api/association-member-statuses
Crear un nuevo estado de miembro.

**Autenticación:** Requerida (Sanctum)

**Request Body:**
```json
{
  "association_id": "integer (required, exists:associations,id)",
  "type": "integer (required, exists:association_member_status_types,id)",
  "order": "integer (required)",
  "name": "string (required, max:255)",
  "description": "string (optional, nullable)"
}
```

**Validaciones:**
- `association_id`: Requerido, debe existir en tabla associations
- `type`: Requerido, debe existir en tabla association_member_status_types
  - Valores disponibles: 1 (Solicitud de ingreso), 2 (Activo), 3 (Incidencias), 4 (Peligro)
- `order`: Requerido, entero, define el orden de visualización
- `name`: Requerido, máximo 255 caracteres
  - **Debe ser único para la combinación (association_id, name)**
- `description`: Opcional, texto descriptivo

**Respuestas:**
- **201 Created**
  ```json
  {
    "id": 1,
    "association_id": 5,
    "type": 2,
    "order": 1,
    "name": "Activo",
    "description": "Miembro activo en la asociación",
    "created_at": "2026-02-05T00:00:00.000000Z",
    "updated_at": "2026-02-05T00:00:00.000000Z",
    "association": {
      "id": 5,
      "name": "Club Example",
      "slug": "club-example"
    },
    "status_type": {
      "id": 2,
      "name": "Activo"
    }
  }
  ```

- **422 Unprocessable Entity** - Error de validación
  ```json
  {
    "message": "The name has already been taken for this association. (and 1 more error)",
    "errors": {
      "name": ["Ya existe un estado con este nombre para esta asociación."],
      "association_id": ["La asociación seleccionada no existe."]
    }
  }
  ```

---

### GET /api/association-member-statuses/{association_member_status}
Obtener un estado específico.

**Autenticación:** Requerida (Sanctum)

**Parámetros de ruta:**
- `association_member_status` (integer) - ID del estado

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": 1,
    "association_id": 5,
    "type": 2,
    "order": 1,
    "name": "Activo",
    "description": "Miembro activo en la asociación",
    "created_at": "2026-02-05T00:00:00.000000Z",
    "updated_at": "2026-02-05T00:00:00.000000Z",
    "association": {
      "id": 5,
      "name": "Club Example",
      "slug": "club-example"
    },
    "status_type": {
      "id": 2,
      "name": "Activo"
    }
  }
  ```

- **404 Not Found** - Estado no encontrado

---

### PUT/PATCH /api/association-member-statuses/{association_member_status}
Actualizar un estado existente.

**Autenticación:** Requerida (Sanctum)

**Parámetros de ruta:**
- `association_member_status` (integer) - ID del estado

**Request Body:** (todos los campos opcionales)
```json
{
  "association_id": "integer (exists:associations,id)",
  "type": "integer (exists:association_member_status_types,id)",
  "order": "integer",
  "name": "string (max:255)",
  "description": "string (nullable)"
}
```

**Validaciones:**
- `association_id`: Opcional, debe existir en tabla associations
- `type`: Opcional, debe existir en tabla association_member_status_types
- `order`: Opcional, entero
- `name`: Opcional, máximo 255 caracteres
  - **Debe ser único para la combinación (association_id, name)** excluyendo el registro actual
- `description`: Opcional, texto descriptivo

**Respuestas:**
- **200 OK**
  ```json
  {
    "id": 1,
    "association_id": 5,
    "type": 2,
    "order": 2,
    "name": "Activo Premium",
    "description": "Miembro activo con beneficios premium",
    "created_at": "2026-02-05T00:00:00.000000Z",
    "updated_at": "2026-02-05T10:30:00.000000Z",
    "association": {
      "id": 5,
      "name": "Club Example",
      "slug": "club-example"
    },
    "status_type": {
      "id": 2,
      "name": "Activo"
    }
  }
  ```

- **404 Not Found** - Estado no encontrado
- **422 Unprocessable Entity** - Error de validación

---

### DELETE /api/association-member-statuses/{association_member_status}
Eliminar un estado.

**Autenticación:** Requerida (Sanctum)

**Parámetros de ruta:**
- `association_member_status` (integer) - ID del estado

**Respuestas:**
- **204 No Content** - Estado eliminado exitosamente
- **404 Not Found** - Estado no encontrado

---

## Tipos de Estado Disponibles

Los tipos de estado están predefinidos en la tabla `association_member_status_types`:

| ID | Nombre |
|----|--------|
| 1  | Solicitud de ingreso |
| 2  | Activo |
| 3  | Incidencias |
| 4  | Peligro |

---

## Notas Importantes

1. **Unicidad**: El campo `name` debe ser único dentro de cada asociación (clave única compuesta: `association_id` + `name`)

2. **Ordenamiento**: Los estados se ordenan por el campo `order` para definir el flujo o secuencia de estados

3. **Relaciones**:
   - Un estado pertenece a una `Association` (relación `belongsTo`)
   - Un estado pertenece a un `AssociationMemberStatusType` (relación `belongsTo` via campo `type`)
   - Una asociación puede tener múltiples estados (relación `hasMany` en Association)

4. **Eliminación en cascada**:
   - Si se elimina una asociación, todos sus estados se eliminan automáticamente (`onDelete('cascade')`)
   - Los tipos de estado no pueden eliminarse si tienen estados asociados (`onDelete('restrict')`)

5. **Autenticación**: Todos los endpoints requieren autenticación mediante Sanctum token
