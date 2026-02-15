/**
 * Componente smart que gestiona el sidebar de administración.
 *
 * Responsabilidades:
 * - Lee el contexto (scope) actual desde ContextStore
 * - Obtiene las acciones correspondientes al scope
 * - Verifica permisos del usuario con PermissionsStore (verificación síncrona)
 * - Prepara los datos y los pasa al componente de renderizado
 *
 * El componente se actualiza automáticamente cuando cambia el scope o los permisos.
 */

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { ContextStore } from '../../core/context/context.store';
import { PermissionsStore } from '../../core/authz/permissions.store';
import { ADMIN_ACTIONS_BY_SCOPE, AdminAction } from '../../core/admin/admin-actions.constants';
import { AdminMenuItem } from '../../core/admin/admin-menu.model';
import { AdminMenuComponent } from '../core/admin/admin-menu/admin-menu.component';

@Component({
  selector: 'app-admin-sidebar-container',
  imports: [AdminMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Botón hamburguesa flotante para móvil (solo visible cuando sidebar está cerrado) -->
    @if (sidebarCollapsed()) {
      <button
        type="button"
        class="ds-mobile-sidebar-toggle"
        (click)="toggleSidebar()"
        aria-label="Abrir menú">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    }

    <!-- Overlay para móvil -->
    @if (!sidebarCollapsed()) {
      <div class="ds-sidebar-overlay" (click)="toggleSidebar()"></div>
    }

    <!-- Sidebar -->
    <aside
      id="admin-sidebar"
      class="ds-admin-sidebar"
      [class.ds-admin-sidebar-closed]="sidebarCollapsed()">
      <app-admin-menu
        [items]="authorizedMenuItems()"
        [collapsed]="sidebarCollapsed()"
        (toggleCollapsed)="toggleSidebar()" />
    </aside>
  `
})
export class AdminSidebarContainerComponent {
  private contextStore = inject(ContextStore);
  private permissionsStore = inject(PermissionsStore);

  // Estado del sidebar (false = expandido por defecto)
  readonly sidebarCollapsed = signal(false);

  /**
   * Items del menú autorizados según el scope y permisos del usuario.
   * Se actualiza automáticamente cuando cambia el scope o los permisos.
   * Verificación síncrona desde PermissionsStore (sin HTTP, instantáneo).
   */
  readonly authorizedMenuItems = computed(() => {
    const scopeType = this.contextStore.scopeType();
    const allActions = ADMIN_ACTIONS_BY_SCOPE[scopeType] || [];

    // Filtrar acciones según permisos (verificación síncrona)
    return allActions
      .filter(action => this.permissionsStore.hasPermission(action.permission))
      .map(action => this.toMenuItem(action));
  });

  /**
   * Transforma una AdminAction a AdminMenuItem.
   * AdminAction tiene todos los campos que necesita AdminMenuItem.
   */
  private toMenuItem(action: AdminAction): AdminMenuItem {
    return {
      label: action.label,
      icon: action.icon,
      route: action.route,
      category: action.category,
      iconClass: action.iconClass,
      helpKey: action.helpKey
    };
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(collapsed => !collapsed);
  }
}
