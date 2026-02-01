# API de Consulta de Permisos

## Endpoint: POST /api/authz/query

Endpoint para consultar los permisos efectivos de un usuario autenticado en un scope específico.

### Autenticación
Requiere autenticación con Sanctum (cookie stateful): `middleware('auth:sanctum')`

### URL
```
POST /api/authz/query
```

### Request Body
```json
{
  "scopeType": number,      // Obligatorio: 1 (GLOBAL), 2 (ASSOCIATION), 3 (GAME)
  "scopeIds": number[],     // Obligatorio: Array de IDs (puede estar vacío)
  "permissions": string[],  // Obligatorio: Array de permisos (puede estar vacío)
  "breakdown": boolean      // Obligatorio: true para detalle, false para resumen
}
```

#### Parámetros

- **scopeType** (number): Tipo de scope a consultar
  - `1` = GLOBAL
  - `2` = ASSOCIATION
  - `3` = GAME

- **scopeIds** (array): Lista de IDs específicos a consultar
  - Si está vacío `[]`: consulta todos los IDs donde el usuario tenga permisos
  - Si contiene IDs: filtra solo esos IDs

- **permissions** (array): Lista de permisos a verificar
  - Si está vacío `[]`: devuelve todos los permisos del usuario
  - Si contiene permisos: filtra solo esos permisos (condición OR)

- **breakdown** (boolean): Nivel de detalle de la respuesta
  - `false`: Respuesta resumida (solo scopeIds)
  - `true`: Respuesta detallada (permisos por scopeId)

---

## Respuestas

### Formato con breakdown=false (Resumen)

```json
{
  "scopeType": number,
  "all": boolean,          // true si hay wildcard (scope_id=null)
  "scopeIds": number[]     // IDs donde tiene al menos 1 permiso
}
```

**Ejemplo:**
```json
{
  "scopeType": 2,
  "all": false,
  "scopeIds": [5, 12, 18]
}
```

### Formato con breakdown=true (Detallado)

```json
{
  "scopeType": number,
  "all": boolean,
  "allPermissions": string[],  // Permisos del wildcard (ordenados)
  "results": [
    {
      "scopeId": number,
      "permissions": string[]    // Permisos específicos (ordenados)
    }
  ]
}
```

**Ejemplo:**
```json
{
  "scopeType": 2,
  "all": true,
  "allPermissions": ["news.create", "news.update"],
  "results": [
    {
      "scopeId": 5,
      "permissions": ["news.delete", "news.publish"]
    },
    {
      "scopeId": 12,
      "permissions": ["news.publish"]
    }
  ]
}
```

---

## Semántica y Reglas

### Wildcard (scope_id = null)
Un `RoleGrant` con `scope_id = null` significa "todos los IDs" para ese `scopeType`.
- Si existe, `all = true` en la respuesta
- Sus permisos aparecen en `allPermissions` (con breakdown=true)

### Coincidencia Exacta de Scope
Los permisos **NO** heredan entre scope types:
- Un permiso en `scopeType=1` (GLOBAL) **NO** da acceso a associations o games
- Solo se evalúan grants con `scope_type` exactamente igual al solicitado

### Filtro de Permisos (OR)
Cuando `permissions` no está vacío:
- Se verifica si el usuario tiene **AL MENOS UNO** de los permisos solicitados
- Condición OR: `["news.create", "news.update"]` → tiene create **O** update

### Ordenación
- Arrays de permisos: ordenados alfabéticamente
- Results (breakdown=true): ordenados por scopeId ascendente
- scopeIds (breakdown=false): ordenados ascendente

---

## Ejemplos de Uso

### Ejemplo 1: ¿En qué associations puedo crear noticias?

**Request:**
```json
{
  "scopeType": 2,
  "scopeIds": [],
  "permissions": ["news.create"],
  "breakdown": false
}
```

**Response:**
```json
{
  "scopeType": 2,
  "all": false,
  "scopeIds": [5, 12, 18]
}
```

### Ejemplo 2: ¿Qué permisos tengo en association #5?

**Request:**
```json
{
  "scopeType": 2,
  "scopeIds": [5],
  "permissions": [],
  "breakdown": true
}
```

**Response:**
```json
{
  "scopeType": 2,
  "all": false,
  "allPermissions": [],
  "results": [
    {
      "scopeId": 5,
      "permissions": ["news.create", "news.delete", "news.publish", "news.update"]
    }
  ]
}
```

### Ejemplo 3: ¿Puedo publicar o borrar en associations #5 y #12?

**Request:**
```json
{
  "scopeType": 2,
  "scopeIds": [5, 12],
  "permissions": ["news.publish", "news.delete"],
  "breakdown": true
}
```

**Response:**
```json
{
  "scopeType": 2,
  "all": false,
  "allPermissions": [],
  "results": [
    {
      "scopeId": 5,
      "permissions": ["news.delete", "news.publish"]
    },
    {
      "scopeId": 12,
      "permissions": ["news.publish"]
    }
  ]
}
```
*Nota: El usuario tiene publish en ambas, pero delete solo en #5*

### Ejemplo 4: Tengo wildcard en games

**Request:**
```json
{
  "scopeType": 3,
  "scopeIds": [],
  "permissions": [],
  "breakdown": true
}
```

**Response:**
```json
{
  "scopeType": 3,
  "all": true,
  "allPermissions": ["tournament.create", "tournament.manage"],
  "results": [
    {
      "scopeId": 7,
      "permissions": ["tournament.delete"]
    }
  ]
}
```
*Nota: El usuario tiene wildcard (create, manage en todos) + permiso extra (delete) específico en game #7*

### Ejemplo 5: Verificar permisos globales

**Request:**
```json
{
  "scopeType": 1,
  "scopeIds": [],
  "permissions": [],
  "breakdown": false
}
```

**Response:**
```json
{
  "scopeType": 1,
  "all": true,
  "scopeIds": []
}
```
*Nota: Tiene permisos globales (wildcard), pero scopeIds está vacío porque global no tiene IDs específicos*

---

## Casos de Uso Frontend

### Mostrar botones según permisos
```javascript
// Verificar si puede crear noticias en alguna association
const response = await fetch('/api/authz/query', {
  method: 'POST',
  body: JSON.stringify({
    scopeType: 2,
    scopeIds: [],
    permissions: ['news.create'],
    breakdown: false
  })
});

if (response.scopeIds.length > 0) {
  // Mostrar botón "Nueva Noticia"
}
```

### Habilitar acciones en lista
```javascript
// Obtener permisos detallados para associations visibles
const response = await fetch('/api/authz/query', {
  method: 'POST',
  body: JSON.stringify({
    scopeType: 2,
    scopeIds: [5, 12, 18],
    permissions: ['news.update', 'news.delete'],
    breakdown: true
  })
});

// Activar botones edit/delete según permisos por ID
response.results.forEach(result => {
  const hasEdit = result.permissions.includes('news.update');
  const hasDelete = result.permissions.includes('news.delete');
  // Actualizar UI...
});
```

### Selector de scope con permisos
```javascript
// Listar associations donde puede crear contenido
const response = await fetch('/api/authz/query', {
  method: 'POST',
  body: JSON.stringify({
    scopeType: 2,
    scopeIds: [],
    permissions: ['news.create', 'tournament.create'],
    breakdown: false
  })
});

// Mostrar dropdown solo con associations permitidas
const allowedAssociations = associations.filter(a => 
  response.scopeIds.includes(a.id)
);
```

---

## Implementación Backend

### Archivos creados
- `app/Enums/ScopeType.php` - Enum con valores 1/2/3
- `app/Http/Requests/AuthzQueryRequest.php` - Validación del request
- `app/Services/AuthzService.php` - Lógica de consulta de permisos
- `app/Http/Controllers/AuthzController.php` - Controlador del endpoint

### Dependencias
- Laravel 11
- Sanctum (auth)
- Spatie Laravel Permission (roles y permisos)
- Tabla `role_grants` con wildcard support
