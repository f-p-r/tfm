# UserController API

Controlador para gestión de usuarios (CRUD completo).

**Estado:** ✅ Implementado

## Formato de Respuestas

### Respuestas Exitosas
Todas las respuestas exitosas incluyen:
```json
{
  "errors": false,
  "data": { /* UserResource */ }
}
```

### Respuestas con Errores
Todas las respuestas con errores incluyen:
```json
{
  "errors": true,
  "errorsList": {
    "campo": "Mensaje de error específico",
    "id": "Error general no asociado a un campo específico"
  }
}
```

**Nota:** Los errores de validación (422) asignan el error al campo correspondiente. Los errores de servidor (500) se asignan al campo `id`.

---

## Endpoints

Todos los endpoints requieren autenticación (Sanctum).

### GET /api/users
Listar todos los usuarios ordenados por fecha de creación (más recientes primero).

**Autenticación:** Requerida (Sanctum)

**Estado:** ✅ Implementado

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Juan Pérez",
      "username": "jperez",
      "email": "juan@example.com",
      "emailVerifiedAt": "2024-01-15T10:30:00.000000Z",
      "createdAt": "2024-01-15T10:30:00.000000Z",
      "updatedAt": "2024-01-15T10:30:00.000000Z"
    }
  ]
}
```

**Ejemplo de uso:**
```bash
curl -X GET "http://localhost:8000/api/users" \
  -H "Authorization: Bearer {token}"
```

---

### POST /api/users
Crear un nuevo usuario.

**Autenticación:** Requerida (Sanctum)

**Estado:** ✅ Implementado

**Parámetros del body (JSON):**
| Campo | Tipo | Requerido | Descripción | Validación |
|-------|------|-----------|-------------|------------|
| `name` | string | Sí | Nombre completo del usuario | Max 255 caracteres |
| `username` | string | Sí | Nombre de usuario único | Max 255 caracteres, único |
| `email` | string | Sí | Email único | Formato email válido, único |
| `password` | string | Sí | Contraseña | Mínimo 8 caracteres |

**Respuesta exitosa (201):**
```json
{
  "errors": false,
  "data": {
    "id": 2,
    "name": "Ana García",
    "username": "agarcia",
    "email": "ana@example.com",
    "emailVerifiedAt": null,
    "createdAt": "2024-02-13T15:45:00.000000Z",
    "updatedAt": "2024-02-13T15:45:00.000000Z"
  }
}
```

**Respuesta con errores de validación (422):**
```json
{
  "errors": true,
  "errorsList": {
    "email": "Este email ya está registrado",
    "password": "La contraseña debe tener al menos 8 caracteres"
  }
}
```

**Respuesta con error del servidor (500):**
```json
{
  "errors": true,
  "errorsList": {
    "id": "Error al crear el usuario: [mensaje de error]"
  }
}
```

**Ejemplo de uso:**
```bash
curl -X POST "http://localhost:8000/api/users" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ana García",
    "username": "agarcia",
    "email": "ana@example.com",
    "password": "password123"
  }'
```

---

### GET /api/users/{id}
Obtener un usuario específico.

**Autenticación:** Requerida (Sanctum)

**Estado:** ✅ Implementado

**Parámetros de ruta:**
- `id` (integer) - ID del usuario

**Respuesta exitosa (200):**
```json
{
  "errors": false,
  "data": {
    "id": 1,
    "name": "Juan Pérez",
    "username": "jperez",
    "email": "juan@example.com",
    "emailVerifiedAt": "2024-01-15T10:30:00.000000Z",
    "createdAt": "2024-01-15T10:30:00.000000Z",
    "updatedAt": "2024-01-15T10:30:00.000000Z"
  }
}
```

**Respuesta con usuario no encontrado (404):**
Laravel devuelve automáticamente un 404 si el usuario no existe (model binding).

**Ejemplo de uso:**
```bash
curl -X GET "http://localhost:8000/api/users/1" \
  -H "Authorization: Bearer {token}"
```

---

### PUT/PATCH /api/users/{id}
Actualizar un usuario existente. Soporta actualización parcial (PATCH).

**Autenticación:** Requerida (Sanctum)

**Estado:** ✅ Implementado

**Parámetros de ruta:**
- `id` (integer) - ID del usuario

**Parámetros del body (JSON):**
Todos los campos son opcionales. Solo se actualizan los campos proporcionados.

| Campo | Tipo | Requerido | Descripción | Validación |
|-------|------|-----------|-------------|------------|
| `name` | string | No | Nombre completo del usuario | Max 255 caracteres |
| `username` | string | No | Nombre de usuario único | Max 255 caracteres, único (excepto el usuario actual) |
| `email` | string | No | Email único | Formato email válido, único (excepto el usuario actual) |
| `password` | string | No | Nueva contraseña | Mínimo 8 caracteres |

**Respuesta exitosa (200):**
```json
{
  "errors": false,
  "data": {
    "id": 1,
    "name": "Juan Pérez Actualizado",
    "username": "jperez",
    "email": "juan.nuevo@example.com",
    "emailVerifiedAt": "2024-01-15T10:30:00.000000Z",
    "createdAt": "2024-01-15T10:30:00.000000Z",
    "updatedAt": "2024-02-13T16:00:00.000000Z"
  }
}
```

**Respuesta con errores de validación (422):**
```json
{
  "errors": true,
  "errorsList": {
    "email": "Este email ya está registrado",
    "username": "Este nombre de usuario ya está en uso"
  }
}
```

**Respuesta con error del servidor (500):**
```json
{
  "errors": true,
  "errorsList": {
    "id": "Error al actualizar el usuario: [mensaje de error]"
  }
}
```

**Ejemplo de uso (actualización completa - PUT):**
```bash
curl -X PUT "http://localhost:8000/api/users/1" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez Actualizado",
    "email": "juan.nuevo@example.com"
  }'
```

**Ejemplo de uso (actualización parcial - PATCH):**
```bash
curl -X PATCH "http://localhost:8000/api/users/1" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "newpassword123"
  }'
```

---

### DELETE /api/users/{id}
Eliminar un usuario.

**Autenticación:** Requerida (Sanctum)

**Estado:** ✅ Implementado

**Parámetros de ruta:**
- `id` (integer) - ID del usuario

**Respuesta exitosa (200):**
```json
{
  "errors": false,
  "message": "Usuario eliminado correctamente"
}
```

**Respuesta con error del servidor (500):**
```json
{
  "errors": true,
  "errorsList": {
    "id": "Error al eliminar el usuario: [mensaje de error]"
  }
}
```

**Respuesta con usuario no encontrado (404):**
Laravel devuelve automáticamente un 404 si el usuario no existe (model binding).

**Ejemplo de uso:**
```bash
curl -X DELETE "http://localhost:8000/api/users/1" \
  -H "Authorization: Bearer {token}"
```

---

## Mensajes de Error de Validación

### Errores del campo `name`
- **El nombre es obligatorio** - No se proporcionó el campo name
- **El nombre no puede superar 255 caracteres** - El name excede el límite

### Errores del campo `username`
- **El nombre de usuario es obligatorio** - No se proporcionó el campo username
- **Este nombre de usuario ya está en uso** - El username ya existe en la base de datos
- **El nombre de usuario no puede superar 255 caracteres** - El username excede el límite

### Errores del campo `email`
- **El email es obligatorio** - No se proporcionó el campo email
- **El email debe ser una dirección válida** - El formato del email es incorrecto
- **Este email ya está registrado** - El email ya existe en la base de datos
- **El email no puede superar 255 caracteres** - El email excede el límite

### Errores del campo `password`
- **La contraseña es obligatoria** - No se proporcionó el campo password (en POST)
- **La contraseña debe tener al menos 8 caracteres** - El password es demasiado corto

### Errores del campo `id`
Errores generales no asociados a un campo específico (normalmente errores 500):
- **Error al crear el usuario: [mensaje]** - Error al ejecutar la creación
- **Error al actualizar el usuario: [mensaje]** - Error al ejecutar la actualización
- **Error al eliminar el usuario: [mensaje]** - Error al ejecutar la eliminación

---

## Notas de Implementación

### Seguridad
- Las contraseñas se hashean automáticamente usando `Hash::make()` antes de guardar
- El password nunca se devuelve en las respuestas (configurado en el modelo User)
- El `remember_token` tampoco se devuelve

### UserResource
El recurso formatea los datos del usuario:
- Convierte `email_verified_at`, `created_at`, `updated_at` a formato ISO 8601
- Oculta campos sensibles (password, remember_token)
- Usa camelCase para los nombres de campos en JSON

### Model Binding
Laravel resuelve automáticamente el usuario por ID en los métodos `show`, `update` y `destroy`, devolviendo 404 si no existe.

### Actualización Parcial
El método `update()` soporta tanto PUT como PATCH. Todos los campos son opcionales gracias a la regla `sometimes` en `UpdateUserRequest`.

### Autorización
Actualmente `authorize()` devuelve `true` en ambos requests. Deberías implementar políticas de autorización según tus necesidades (por ejemplo, solo admins pueden crear usuarios, o usuarios solo pueden actualizar su propio perfil).

---

## Códigos de Estado HTTP

| Código | Descripción | Cuándo se usa |
|--------|-------------|---------------|
| 200 | OK | GET exitoso, UPDATE exitoso, DELETE exitoso |
| 201 | Created | POST exitoso (usuario creado) |
| 422 | Unprocessable Entity | Errores de validación |
| 404 | Not Found | Usuario no encontrado (model binding) |
| 500 | Internal Server Error | Error al ejecutar operación en BD |

