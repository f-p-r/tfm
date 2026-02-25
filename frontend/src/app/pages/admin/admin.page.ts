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
import { AdminPageSubtitleComponent } from '../../components/core/admin/admin-page-subtitle/admin-page-subtitle.component';
import { ContextStore } from '../../core/context/context.store';
import { PermissionsStore } from '../../core/authz/permissions.store';
import { ADMIN_ACTIONS_BY_SCOPE } from '../../core/admin/admin-actions.constants';
import { WebScope } from '../../core/web-scope.constants';
import { JsonPipe } from '@angular/common';
import { HasPermissionDirective } from '../../shared/directives';
import { PageHelpService } from '../../shared/help/page-help.service';
import { getAdminPageHelp } from '../../shared/help/page-content/admin.help';

@Component({
  selector: 'app-admin-page',
  imports: [
    AdminSidebarContainerComponent,
    AdminPageSubtitleComponent
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
            <app-admin-page-subtitle />
          </div>

          <!-- Content area -->
          <div class="bg-white rounded-lg border border-neutral-medium p-6 shadow-sm">
            <h2 class="h3 mb-4">Bienvenido al panel de administración</h2>
            <p class="p mb-4">
              Utiliza el menú lateral para acceder a las diferentes secciones de gestión.
            </p>



          </div>
        </div>
      </main>

    </div>
  `
})
export class AdminPage {
  constructor() {
    const ctx = inject(ContextStore);
    inject(PageHelpService).set(getAdminPageHelp(ctx.scopeType()));
  }

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
