# AuthzController API

Controlador para consultas de autorización (permisos del usuario en scopes específicos).

## Conceptos

### Scope Types
- **1 (GLOBAL)**: Permisos globales del sistema
- **2 (ASSOCIATION)**: Permisos dentro de una asociación específica
- **3 (TOURNAMENT)**: Permisos dentro de un torneo específico

### Breakdown
El parámetro `breakdown` determina el nivel de detalle de la respuesta:
- `true`: Respuesta detallada con explicación de cada permiso
- `false`: Respuesta simple con lista de permisos concedidos

## Endpoints

### POST /api/authz/query
Consultar permisos del usuario autenticado para scopes específicos.

**Autenticación:** Requerida (Sanctum)

**Request Body:**
```json
{
  "scopeType": "integer (required) - 1 (GLOBAL), 2 (ASSOCIATION), 3 (TOURNAMENT)",
  "scopeIds": "array (required) - IDs de los scopes a consultar (vacío para GLOBAL)",
  "scopeIds.*": "integer (min:1)",
  "permissions": "array (required) - Lista de permisos a verificar (vacío para todos)",
  "permissions.*": "string - Nombre del permiso",
  "breakdown": "boolean (required) - true para respuesta detallada, false para simple"
}
```

**Ejemplo sin breakdown:**
```json
{
  "scopeType": 2,
  "scopeIds": [5, 10],
  "permissions": ["news.create", "news.edit"],
  "breakdown": false
}
```

**Respuesta sin breakdown:**
```json
{
  "scopeType": 2,
  "scopeIds": [5, 10],
  "results": {
    "5": ["news.create"],
    "10": ["news.create", "news.edit"]
  }
}
```

**Ejemplo con breakdown:**
```json
{
  "scopeType": 2,
  "scopeIds": [5],
  "permissions": ["news.create", "news.edit"],
  "breakdown": true
}
```

**Respuesta con breakdown:**
```json
{
  "scopeType": 2,
  "scopeIds": [5],
  "results": {
    "5": {
      "news.create": {
        "granted": true,
        "reason": "role",
        "role": "editor"
      },
      "news.edit": {
        "granted": false,
        "reason": "not_granted"
      }
    }
  }
}
```

**Validaciones:**
- `scopeType`: Requerido, debe ser 1, 2, o 3
- `scopeIds`: Requerido, array (puede estar vacío para GLOBAL)
- `scopeIds.*`: Enteros mayores o iguales a 1
- `permissions`: Requerido, array (puede estar vacío para consultar todos)
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
- El sistema evalúa permisos basándose en roles y role_grants
- Los permisos pueden ser directos (via roles) o específicos del scope
- El debug logging puede habilitarse en el código para troubleshooting
