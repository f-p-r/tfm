# Directiva `*hasPermission`

Directiva estructural para mostrar/ocultar contenido según los permisos del usuario en el scope actual.

## Características

- ✅ **Reactiva**: Se actualiza automáticamente cuando cambian los permisos
- ✅ **Síncrona**: Verificación instantánea (sin HTTP, lee desde memoria)
- ✅ **Flexible**: Soporta permisos únicos o múltiples
- ✅ **Modos ANY/ALL**: Para múltiples permisos
- ✅ **Template else**: Como `*ngIf`

## Instalación

```typescript
import { HasPermissionDirective } from './shared/directives';

@Component({
  imports: [HasPermissionDirective],
  // ...
})
```

## Uso básico

### Permiso único

```html
<!-- Mostrar solo si tiene permiso 'pages.edit' -->
<button *hasPermission="'pages.edit'" (click)="edit()">
  Editar página
</button>
```

### Múltiples permisos (modo ANY)

Por defecto, si pasas un array de permisos, se muestra el contenido si tiene **AL MENOS UNO**.

```html
<!-- Mostrar si tiene 'admin' O 'pages.edit' -->
<div *hasPermission="['admin', 'pages.edit']">
  <h2>Panel de gestión</h2>
  <p>Tienes acceso al panel de administración o edición de páginas.</p>
</div>
```

### Múltiples permisos (modo ALL)

Si necesitas que tenga **TODOS** los permisos, usa `mode: 'all'`:

```html
<!-- Mostrar solo si tiene 'users.manage' Y 'users.create' -->
<section *hasPermission="['users.manage', 'users.create']; mode: 'all'">
  <h2>Gestión completa de usuarios</h2>
  <p>Puedes crear y gestionar usuarios.</p>
</section>
```

### Con template else

Como `*ngIf`, puedes mostrar contenido alternativo si NO tiene el permiso:

```html
<div *hasPermission="'admin'; else noAccess">
  <h1>Panel de administración</h1>
  <p>Bienvenido al área de administración.</p>
</div>

<ng-template #noAccess>
  <div class="alert alert-warning">
    <p>No tienes permisos de administración.</p>
  </div>
</ng-template>
```

## Ejemplos prácticos

### Botones condicionales

```html
<div class="actions">
  <!-- Solo administradores -->
  <button *hasPermission="'admin'" class="btn-primary">
    Panel admin
  </button>

  <!-- Solo editores de páginas -->
  <button *hasPermission="'pages.edit'" class="btn-secondary">
    Editar página
  </button>

  <!-- Gestores de usuarios O administradores -->
  <button *hasPermission="['users.manage', 'admin']" class="btn-secondary">
    Gestionar usuarios
  </button>
</div>
```

### Secciones protegidas

```html
<div class="dashboard">
  <h1>Dashboard</h1>

  <!-- Estadísticas: solo si puede ver reportes -->
  <section *hasPermission="'reports.view'">
    <h2>Estadísticas</h2>
    <app-stats-widget />
  </section>

  <!-- Usuarios: solo si puede gestionar usuarios -->
  <section *hasPermission="'users.manage'">
    <h2>Usuarios recientes</h2>
    <app-recent-users />
  </section>

  <!-- Configuración: solo admin con permisos de config -->
  <section *hasPermission="['admin', 'config.manage']; mode: 'all'">
    <h2>Configuración avanzada</h2>
    <app-advanced-config />
  </section>
</div>
```

### Tabla con acciones condicionales

```html
<table>
  <thead>
    <tr>
      <th>Usuario</th>
      <th>Email</th>
      <th *hasPermission="['users.edit', 'users.delete']">Acciones</th>
    </tr>
  </thead>
  <tbody>
    @for (user of users(); track user.id) {
      <tr>
        <td>{{ user.name }}</td>
        <td>{{ user.email }}</td>
        <td *hasPermission="['users.edit', 'users.delete']">
          <button *hasPermission="'users.edit'" (click)="edit(user)">
            Editar
          </button>
          <button *hasPermission="'users.delete'" (click)="delete(user)">
            Eliminar
          </button>
        </td>
      </tr>
    }
  </tbody>
</table>
```

### Navegación condicional

```html
<nav class="sidebar">
  <a routerLink="/admin">Dashboard</a>

  <a *hasPermission="'pages.edit'" routerLink="/admin/pages">
    Páginas
  </a>

  <a *hasPermission="'users.manage'" routerLink="/admin/users">
    Usuarios
  </a>

  <a *hasPermission="'games.manage'" routerLink="/admin/games">
    Juegos
  </a>

  <a *hasPermission="['admin', 'config.manage']; mode: 'all'" routerLink="/admin/config">
    Configuración
  </a>
</nav>
```

### Con mensajes alternativos

```html
<div class="page-editor">
  <h1>Editor de páginas</h1>

  <div *hasPermission="'pages.edit'; else readOnly">
    <!-- Editor completo con todos los controles -->
    <app-rich-editor [(content)]="pageContent" />
    <button (click)="save()">Guardar cambios</button>
  </div>

  <ng-template #readOnly>
    <!-- Vista de solo lectura -->
    <div class="alert alert-info">
      No tienes permisos para editar. Vista de solo lectura.
    </div>
    <app-content-viewer [content]="pageContent" />
  </ng-template>
</div>
```

## Comparación con verificación en TypeScript

### ❌ Antes (verificación en TS)

```typescript
// component.ts
protected canEdit = computed(() =>
  this.permissionsStore.hasPermission('pages.edit')
);

protected canDelete = computed(() =>
  this.permissionsStore.hasPermission('pages.delete')
);
```

```html
<!-- template.html -->
@if (canEdit()) {
  <button (click)="edit()">Editar</button>
}
@if (canDelete()) {
  <button (click)="delete()">Eliminar</button>
}
```

### ✅ Después (con directiva)

```html
<!-- template.html -->
<button *hasPermission="'pages.edit'" (click)="edit()">
  Editar
</button>
<button *hasPermission="'pages.delete'" (click)="delete()">
  Eliminar
</button>
```

**Menos código, más declarativo, más fácil de mantener.**

## Casos especiales

### Permiso wildcard `*`

Si el usuario tiene el permiso especial `*` (wildcard/superadmin), la directiva mostrará el contenido para CUALQUIER permiso solicitado.

```html
<!-- Si usuario tiene '*', se muestra aunque no tenga 'specific.permission' -->
<div *hasPermission="'specific.permission'">
  Este contenido se muestra para admins con wildcard
</div>
```

### Sin permisos cargados

Si los permisos aún no se han cargado, la directiva oculta el contenido por defecto (comportamiento seguro).

```html
<!-- No se muestra hasta que loadForCurrentScope() termine -->
<button *hasPermission="'admin'">Admin</button>
```

## Ventajas

1. **Código más limpio**: Lógica de permisos en el template, no en TS
2. **Reusabilidad**: Misma directiva en toda la app
3. **Reactivo**: Se actualiza automáticamente cuando cambian permisos
4. **Type-safe**: TypeScript verifica los inputs
5. **Performante**: Sin llamadas HTTP, lectura desde memoria

## Cuándo usar cada opción

| Uso | Solución recomendada |
|-----|----------------------|
| Mostrar/ocultar botón | `*hasPermission` directiva |
| Proteger ruta | `requirePermission()` guard |
| Lógica compleja de negocio | `permissionsStore.hasPermission()` en TS |
| Botón con múltiples condiciones | Computed + directiva combinados |

## Notas técnicas

- **Reactividad**: Usa `effect()` para reaccionar a cambios en `PermissionsStore`
- **Rendimiento**: Verificación síncrona O(1) desde Set en memoria
- **Angular 18+**: Compatible con señales y nuevo control flow
- **Standalone**: No requiere NgModule

## Ver también

- [permission.guard.ts](../guards/permission.guard.ts) - Guard para proteger rutas
- [permissions.store.ts](../core/authz/permissions.store.ts) - Store centralizado de permisos
- [authz.service.ts](../core/authz/authz.service.ts) - Servicio de autorización con caché
