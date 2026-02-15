/**
 * Guard funcional para proteger rutas según permisos del usuario.
 * Verifica si el usuario tiene un permiso específico usando PermissionsStore.
 * Si no tiene el permiso, redirige a la página principal (/).
 *
 * @example
 * ```typescript
 * // En app.routes.ts
 * {
 *   path: 'admin',
 *   component: AdminPage,
 *   canActivate: [requirePermission('admin')]
 * }
 * ```
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { PermissionsStore } from '../core/authz/permissions.store';

/**
 * Factory que crea un guard de permisos para una ruta.
 *
 * @param permission Nombre del permiso requerido (ej: 'admin', 'pages.edit')
 * @returns CanActivateFn que valida el permiso y redirige si no está autorizado
 */
export function requirePermission(permission: string): CanActivateFn {
  return () => {
    const permissionsStore = inject(PermissionsStore);
    const router = inject(Router);

    // Esperar a que los permisos estén cargados
    return new Promise<boolean>((resolve) => {
      permissionsStore.waitForLoad().subscribe(() => {
        const hasPermission = permissionsStore.hasPermission(permission);

        if (!hasPermission) {
          console.warn(`🚫 [PermissionGuard] Acceso denegado: permiso '${permission}' requerido`);
          router.navigate(['/']);
          resolve(false);
        } else {
          console.log(`✅ [PermissionGuard] Acceso permitido: permiso '${permission}' concedido`);
          resolve(true);
        }
      });
    });
  };
}

/**
 * Guard que verifica si el usuario tiene AL MENOS UN permiso en el scope actual.
 * Útil para rutas que deben ser accesibles si el usuario tiene algún permiso de administración.
 *
 * @example
 * ```typescript
 * // En app.routes.ts
 * {
 *   path: 'admin',
 *   component: AdminPage,
 *   canActivate: [requireAnyPermission()]
 * }
 * ```
 */
export function requireAnyPermission(): CanActivateFn {
  return () => {
    const permissionsStore = inject(PermissionsStore);
    const router = inject(Router);

    // Esperar a que los permisos estén cargados
    return new Promise<boolean>((resolve) => {
      permissionsStore.waitForLoad().subscribe(() => {
        const allPermissions = permissionsStore.allPermissions();
        const hasAnyPermission = allPermissions.length > 0;

        if (!hasAnyPermission) {
          console.warn(`🚫 [PermissionGuard] Acceso denegado: se requiere al menos un permiso en este scope`);
          router.navigate(['/']);
          resolve(false);
        } else {
          console.log(`✅ [PermissionGuard] Acceso permitido: usuario tiene ${allPermissions.length} permisos`);
          resolve(true);
        }
      });
    });
  };
}
