# AuthzController API

Controlador para consultas de autorización (permisos del usuario en scopes específicos).

## Conceptos

### Scope Types
- **1 (GLOBAL)**: Permisos globales del sistema
- **2 (ASSOCIATION)**: Permisos dentro de una asociación específica
- **3 (GAME)**: Permisos dentro de un juego específico

### Breakdown
El parámetro `breakdown` determina el nivel de detalle de la respuesta:
- `true`: Respuesta detallada con lista de permisos por scopeId
- `false`: Respuesta simple con lista de scopeIds donde el usuario tiene al menos un permiso

### All (Wildcard)
El campo `all` en la respuesta indica si el usuario tiene permisos wildcard (aplicables a todos los scopes del tipo):
- `true`: El usuario tiene permisos para todos los scopes de ese tipo a través de un role grant con scope_id null
- `false`: El usuario solo tiene permisos en scopes específicos

## Endpoints

### POST /api/authz/query
Consultar permisos del usuario autenticado para scopes específicos.

**Autenticación:** Requerida (Sanctum)

**Request Body:**
```json
{
  "scopeType": "integer (required) - 1 (GLOBAL), 2 (ASSOCIATION), 3 (GAME)",
  "scopeIds": "array (present) - IDs de los scopes a consultar (puede estar vacío)",
  "scopeIds.*": "integer (min:1)",
  "permissions": "array (present) - Lista de permisos a filtrar (puede estar vacío para todos)",
  "permissions.*": "string - Nombre del permiso",
  "breakdown": "boolean (required) - true para respuesta detallada, false para simple"
}
```

**Ejemplo sin breakdown:**
```json
{
  "scopeType": 2,
  "scopeIds": [],
  "permissions": ["news.create", "news.edit"],
  "breakdown": false
}
```

**Respuesta sin breakdown:**
```json
{
  "scopeType": 2,
  "all": false,
  "scopeIds": [5, 10, 15]
}
```

**Descripción de respuesta sin breakdown:**
- `scopeType`: El tipo de scope consultado
- `all`: Si el usuario tiene permisos wildcard (para todos los scopes)
- `scopeIds`: Array de IDs de scopes donde el usuario tiene al menos uno de los permisos solicitados (o cualquier permiso si no se especificaron)

**Ejemplo con breakdown:**
```json
{
  "scopeType": 2,
  "scopeIds": [],
  "permissions": ["news.create", "news.edit", "news.delete"],
  "breakdown": true
}
```

**Respuesta con breakdown:**
```json
{
  "scopeType": 2,
  "all": true,
  "allPermissions": ["news.create", "news.edit"],
  "results": [
    {
      "scopeId": 5,
      "permissions": ["news.create"]
    },
    {
      "scopeId": 10,
      "permissions": ["news.create", "news.edit", "news.delete"]
    }
  ]
}
```

**Descripción de respuesta con breakdown:**
- `scopeType`: El tipo de scope consultado
- `all`: Si el usuario tiene permisos wildcard
- `allPermissions`: Array de permisos wildcard del usuario (aplicables a todos los scopeId)
- `results`: Array de objetos con scopeId y sus permisos específicos
  - `scopeId`: ID del scope
  - `permissions`: Array de permisos que el usuario tiene en ese scope

**Validaciones:**
- `scopeType`: Requerido, debe ser 1, 2, o 3
- `scopeIds`: Presente (array, puede estar vacío)
- `scopeIds.*`: Enteros mayores o iguales a 1
- `permissions`: Presente (array, puede estar vacío para consultar todos los permisos)
- `permissions.*`: Strings con nombres de permisos
- `breakdown`: Requerido, booleano

**Respuestas:**
- **200 OK** - Resultado de la consulta (formato según breakdown)

- **422 Unprocessable Entity** - Error de validación
  ```json
  {
    "message": "Validation failed",
    "errors": {
      "scopeType": ["The scope type field is required."]
    }
  }
  ```

- **401 Unauthorized** - No autenticado

**Notas:**
- El sistema evalúa permisos basándose en role_grants que relacionan usuarios con roles
- Los permisos pueden ser wildcard (scope_id null, aplican a todos los scopes) o específicos de un scope
- Si se especifica el array `permissions`, se filtran solo esos permisos; si está vacío, se devuelven todos
- Los permisos se obtienen de los roles asignados a través de role_grants
- El debug logging puede habilitarse cambiando `$enableDebugLogging = true` en el controlador (logs en `storage/logs/laravel.log`)
