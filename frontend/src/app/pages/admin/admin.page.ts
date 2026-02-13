/**
 * Página principal de administración.
 *
 * Muestra el panel de control general del área de administración.
 * El contenido varía según el scope actual (Global, Asociación, Juego).
 *
 * Estructura:
 * - Navbar superior (sticky)
 * - Sidebar lateral con acciones según permisos
 * - Área de contenido principal (datos generales del scope)
 */

import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { AdminSidebarContainerComponent } from '../../components/admin-sidebar/admin-sidebar-container.component';
import { ContextStore } from '../../core/context/context.store';
import { AuthzService } from '../../core/authz/authz.service';
import { ADMIN_ACTIONS_BY_SCOPE } from '../../core/admin/admin-actions.constants';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { isBreakdownResponse } from '../../core/authz/authz.models';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-admin-page',
  imports: [
    AdminSidebarContainerComponent,
    JsonPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Admin Shell -->
    <div class="ds-admin-shell">

      <!-- Sidebar -->
      <aside id="admin-sidebar" class="ds-admin-sidebar">
        <app-admin-sidebar-container />
      </aside>

      <!-- Main content -->
      <main class="ds-admin-main ds-container">
        <div class="flex-1 flex flex-col pt-6 min-h-0">

          <!-- Page header -->
          <div class="mb-6 shrink-0">
            <h1 class="h1">Panel de Administración</h1>
            <p class="text-neutral-medium mt-2">
              Gestión y configuración del sistema
            </p>
          </div>

          <!-- Content area -->
          <div class="bg-white rounded-lg border border-neutral-medium p-6 shadow-sm">
            <h2 class="h3 mb-4">Bienvenido al panel de administración</h2>
            <p class="p mb-4">
              Utiliza el menú lateral para acceder a las diferentes secciones de gestión.
            </p>
            <p class="p text-neutral-medium text-sm">
              El contenido de esta página se adaptará según el contexto actual
              (Global, Asociación o Juego) y mostrará información relevante del scope activo.
            </p>
          </div>

          <!-- Debug info -->
          <div class="mt-6 bg-gray-100 rounded-lg border border-gray-300 p-4 text-sm">
            <h3 class="font-bold mb-2">🔍 Debug - Contexto actual:</h3>
            <div class="space-y-1 font-mono">
              <div>scopeType: <strong>{{ contextStore.scopeType() }}</strong></div>
              <div>scopeId: <strong>{{ contextStore.scopeId() }}</strong></div>
            </div>
          </div>

          <!-- Debug permisos -->
          <div class="mt-4 bg-blue-50 rounded-lg border border-blue-300 p-4 text-sm">
            <h3 class="font-bold mb-2">🔐 Debug - Permisos del usuario:</h3>
            @if (userPermissions(); as perms) {
              <div class="space-y-2">
                <div class="font-mono">
                  <strong>Todos los permisos en este scope:</strong>
                  <div class="ml-4 text-xs">{{ perms | json }}</div>
                </div>
              </div>
            }
          </div>

          <!-- Debug verificación -->
          <div class="mt-4 bg-yellow-50 rounded-lg border border-yellow-300 p-4 text-sm">
            <h3 class="font-bold mb-2">⚙️ Debug - Verificación de acciones:</h3>
            @if (debugPermissions(); as debug) {
              <div class="space-y-2">
                <div class="font-mono">
                  <strong>Permisos requeridos por acciones:</strong>
                  <div class="ml-4 text-xs">{{ debug.requested | json }}</div>
                </div>
                <div class="font-mono">
                  <strong>Permisos concedidos:</strong>
                  <div class="ml-4 text-xs">{{ debug.granted | json }}</div>
                </div>
                <div class="font-mono">
                  <strong>Acciones autorizadas:</strong>
                  <div class="ml-4 text-xs">{{ debug.authorizedCount }} de {{ debug.totalCount }}</div>
                </div>
              </div>
            }
          </div>

        </div>
      </main>

    </div>
  `
})
export class AdminPage {
  protected readonly contextStore = inject(ContextStore);
  private readonly authz = inject(AuthzService);

  private currentScope = computed(() => ({
    type: this.contextStore.scopeType(),
    id: this.contextStore.scopeId() ?? 0
  }));

  // Signal que muestra TODOS los permisos del usuario en el scope actual
  protected readonly userPermissions = toSignal(
    toObservable(this.currentScope).pipe(
      switchMap(scope => {
        return this.authz.query({
          scopeType: scope.type,
          scopeIds: scope.id === 0 ? [] : [scope.id],
          permissions: [], // Array vacío = devolver TODOS los permisos del usuario
          breakdown: true
        }).pipe(
          map(res => {
            if (isBreakdownResponse(res)) {
              // Combinar wildcard + específicos para mostrar TODOS los permisos del usuario
              const wildcardPerms = res.allPermissions || [];
              const scopeResult = res.results.find(r => r.scopeId === scope.id);
              const scopePerms = scopeResult?.permissions || [];
              // Unir sin duplicados
              return [...new Set([...wildcardPerms, ...scopePerms])];
            }
            return [];
          }),
          catchError(err => {
            console.error('❌ [AdminPage] Error al obtener permisos del usuario:', err);
            return of([]);
          })
        );
      })
    ),
    { initialValue: [] }
  );

  // Signal de debug para mostrar permisos verificados
  protected readonly debugPermissions = toSignal(
    toObservable(this.currentScope).pipe(
      switchMap(scope => {
        const allActions = ADMIN_ACTIONS_BY_SCOPE[scope.type] || [];

        if (allActions.length === 0) {
          return of({ requested: [], granted: [], totalCount: 0, authorizedCount: 0 });
        }

        const permissions = allActions.map(a => a.permission);

        return this.authz.query({
          scopeType: scope.type,
          scopeIds: scope.id === 0 ? [] : [scope.id],
          permissions: permissions,
          breakdown: true
        }).pipe(
          map(res => {
            // Extraer permisos: primero wildcard (allPermissions), luego específicos (results[scopeId])
            let wildcardPerms: string[] = [];
            let scopePerms: string[] = [];

            if (isBreakdownResponse(res)) {
              wildcardPerms = res.allPermissions || [];
              const scopeResult = res.results.find(r => r.scopeId === scope.id);
              scopePerms = scopeResult?.permissions || [];
            }

            // Verificar permiso: primero en wildcard, si no está, en scope-specific
            const hasPermission = (permission: string) =>
              wildcardPerms.includes(permission) || scopePerms.includes(permission);

            const authorizedCount = allActions.filter(a => hasPermission(a.permission)).length;

            // Para debug: mostrar ambos arrays por separado
            const grantedPermissions = [...new Set([...wildcardPerms, ...scopePerms])];

            return {
              requested: permissions,
              granted: grantedPermissions,
              totalCount: allActions.length,
              authorizedCount
            };
          }),
          catchError(err => {
            console.error('❌ [AdminPage] Error al verificar permisos:', err);
            return of({ requested: permissions, granted: [], totalCount: allActions.length, authorizedCount: 0 });
          })
        );
      })
    ),
    { initialValue: null }
  );
}
