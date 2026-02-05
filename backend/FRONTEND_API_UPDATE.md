# Actualización de API - Endpoints de Páginas

## Cambios Realizados

Se ha agregado un **nuevo endpoint público** para obtener páginas por ID, separando las operaciones de lectura pública de las administrativas.

---

## Nuevo Endpoint Público

### `GET /api/pages/{id}`

**Autenticación:** NO requerida

**Descripción:** Obtiene una página publicada por su ID. Solo devuelve páginas con `published = true`.

**Parámetros de ruta:**
- `id` (integer) - ID de la página

**Ejemplo de uso:**
```javascript
// Sin necesidad de token de autenticación
const response = await fetch('http://localhost:8000/api/pages/3');
const page = await response.json();
```

**Respuesta exitosa (200 OK):**
```json
{
  "id": 3,
  "ownerType": "2",
  "ownerId": 15,
  "slug": "inicio",
  "title": "Página de Inicio",
  "publishedAt": "2026-02-01T00:00:00.000000Z",
  "content": {
    "schemaVersion": 1,
    "segments": [
      {
        "type": "text",
        "content": "Contenido de la página..."
      }
    ]
  },
  "updatedAt": "2026-02-05T00:00:00.000000Z"
}
```

**Respuestas de error:**
- `404 Not Found` - La página no existe o no está publicada

**Importante:** Este endpoint filtra automáticamente páginas no publicadas. Si la página existe pero `published = false`, devolverá 404.

---

## Endpoints Existentes (Sin cambios en funcionalidad)

### Endpoints Públicos (sin autenticación):
- `GET /api/pages/home` - Obtener home page por owner
- `GET /api/pages/by-owner-slug` - Obtener página por slug del owner y slug de página
- **`GET /api/pages/{id}`** ← NUEVO

### Endpoints Admin (requieren autenticación):
- `GET /api/admin/pages` - Listar páginas por owner
- `GET /api/admin/pages/{id}` - Ver página (incluye borradores)
- `POST /api/admin/pages` - Crear página
- `PATCH /api/admin/pages/{id}` - Actualizar página
- `DELETE /api/admin/pages/{id}` - Eliminar página

---

## Diferencias Entre Endpoints

| Característica | `/api/pages/{id}` (Público) | `/api/admin/pages/{id}` (Admin) |
|---------------|------------------------------|----------------------------------|
| Autenticación | ❌ No requerida | ✅ Requerida (Sanctum) |
| Páginas no publicadas | ❌ No accesibles (404) | ✅ Accesibles |
| Borradores | ❌ No visibles | ✅ Visibles |
| Contexto de uso | Vista pública del sitio | Panel de administración |

---

## Cuándo Usar Cada Endpoint

### Usa `/api/pages/{id}` (público) cuando:
- Estés en el frontend público del sitio
- Necesites mostrar contenido a usuarios no autenticados
- Solo quieras páginas publicadas

### Usa `/api/admin/pages/{id}` (admin) cuando:
- Estés en el panel de administración
- Necesites ver/editar borradores
- El usuario esté autenticado y tenga permisos de gestión

---

## Migración de Código Existente

Si actualmente usas `/api/admin/pages/{id}` para visualización pública, deberías cambiarlo:

### ❌ Antes (requería autenticación):
```javascript
const response = await fetch('http://localhost:8000/api/admin/pages/3', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### ✅ Ahora (sin autenticación para público):
```javascript
const response = await fetch('http://localhost:8000/api/pages/3');
```

### ✅ Admin (mantener con autenticación):
```javascript
const response = await fetch('http://localhost:8000/api/admin/pages/3', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Otros Cambios en la API

### Associations - Endpoints de Lectura Ahora Públicos

Los siguientes endpoints de associations ya **NO requieren autenticación**:

- `GET /api/associations` - Listar asociaciones
- `GET /api/associations/{id}` - Ver asociación por ID
- `GET /api/associations/by-slug/{slug}` - Ver asociación por slug

Los endpoints de escritura **SÍ requieren autenticación**:
- `POST /api/associations` - Crear
- `PUT/PATCH /api/associations/{id}` - Actualizar
- `DELETE /api/associations/{id}` - Eliminar

---

## Documentación Completa

Ver documentación detallada en:
- `/docs/api/PagesController.md`
- `/docs/api/AssociationController.md`

---

## Resumen para Desarrolladores Frontend

1. **Nuevo endpoint público**: `GET /api/pages/{id}` para obtener páginas publicadas sin autenticación
2. **Associations públicas**: Los GET de associations ya no requieren login
3. **Separación clara**: Usa `/api/pages/*` para público y `/api/admin/pages/*` para administración
4. **Filtrado automático**: Los endpoints públicos solo devuelven contenido publicado

---

Fecha de actualización: 5 de febrero de 2026
