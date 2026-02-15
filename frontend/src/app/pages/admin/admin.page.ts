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
import { PermissionsStore } from '../../core/authz/permissions.store';
import { ADMIN_ACTIONS_BY_SCOPE } from '../../core/admin/admin-actions.constants';
import { JsonPipe } from '@angular/common';
import { HasPermissionDirective } from '../../shared/directives';

@Component({
  selector: 'app-admin-page',
  imports: [
    AdminSidebarContainerComponent,
    JsonPipe,
    HasPermissionDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Admin Shell -->
    <div class="ds-admin-shell">

      <!-- Sidebar -->
      <app-admin-sidebar-container />

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

            <!-- Ejemplo de uso de directiva *hasPermission -->
            <div class="mt-6 border-t border-neutral-light pt-6">
              <h3 class="h4 mb-4">Acciones rápidas</h3>
              <div class="flex gap-3 flex-wrap">
                <!-- Botón visible solo con permiso pages.edit -->
                <button
                  *hasPermission="'pages.edit'"
                  type="button"
                  class="ds-button ds-button-primary"
                >
                  Gestionar páginas
                </button>

                <!-- Botón visible solo con permiso users.manage -->
                <button
                  *hasPermission="'users.manage'"
                  type="button"
                  class="ds-button ds-button-secondary"
                >
                  Gestionar usuarios
                </button>

                <!-- Botón visible si tiene AL MENOS UNO de estos permisos -->
                <button
                  *hasPermission="['games.manage', 'associations.manage']"
                  type="button"
                  class="ds-button ds-button-secondary"
                >
                  Gestionar entidades
                </button>

                <!-- Botón visible solo si tiene TODOS estos permisos -->
                <button
                  *hasPermission="['admin', 'config.manage']; mode: 'all'"
                  type="button"
                  class="ds-button ds-button-danger"
                >
                  Configuración avanzada
                </button>
              </div>
            </div>
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
  protected readonly permissionsStore = inject(PermissionsStore);

  /**
   * Todos los permisos del usuario en el scope actual.
   * Lectura directa desde PermissionsStore (sin HTTP, instantáneo).
   */
  protected readonly userPermissions = computed(() => this.permissionsStore.allPermissions());

  /**
   * Información de debug sobre permisos y acciones disponibles.
   * Calcula cuántas acciones tiene autorizadas el usuario.
   */
  protected readonly debugPermissions = computed(() => {
    const scope = this.contextStore.scopeType();
    const allActions = ADMIN_ACTIONS_BY_SCOPE[scope] || [];

    if (allActions.length === 0) {
      return { requested: [], granted: [], totalCount: 0, authorizedCount: 0 };
    }

    const requested = allActions.map(a => a.permission);
    const granted = this.permissionsStore.allPermissions();
    const authorizedCount = allActions.filter(a =>
      this.permissionsStore.hasPermission(a.permission)
    ).length;

    return {
      requested,
      granted,
      totalCount: allActions.length,
      authorizedCount
    };
  });
}
