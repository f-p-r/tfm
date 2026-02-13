/**
 * Componente smart que gestiona el sidebar de administración.
 *
 * Responsabilidades:
 * - Lee el contexto (scope) actual desde ContextStore
 * - Obtiene las acciones correspondientes al scope
 * - Verifica permisos del usuario con AuthzService
 * - Prepara los datos y los pasa al componente de renderizado
 *
 * El componente se actualiza automáticamente cuando cambia el scope.
 */

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { ContextStore } from '../../core/context/context.store';
import { AuthzService } from '../../core/authz/authz.service';
import { ADMIN_ACTIONS_BY_SCOPE, AdminAction } from '../../core/admin/admin-actions.constants';
import { AdminMenuItem } from '../../core/admin/admin-menu.model';
import { AdminMenuComponent } from '../core/admin/admin-menu/admin-menu.component';
import { isBreakdownResponse } from '../../core/authz/authz.models';

@Component({
  selector: 'app-admin-sidebar-container',
  imports: [AdminMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-admin-menu [items]="authorizedMenuItems() || []" />
  `
})
export class AdminSidebarContainerComponent {
  private contextStore = inject(ContextStore);
  private authz = inject(AuthzService);

  /**
   * Scope actual como computed signal
   */
  private currentScope = computed(() => ({
    type: this.contextStore.scopeType(),
    id: this.contextStore.scopeId() ?? 0
  }));

  /**
   * Items del menú autorizados según el scope y permisos del usuario.
   * Se actualiza automáticamente cuando cambia el scope.
   */
  readonly authorizedMenuItems = toSignal(
    toObservable(this.currentScope).pipe(
      switchMap(scope => {
        const allActions = ADMIN_ACTIONS_BY_SCOPE[scope.type] || [];

        // Si no hay acciones definidas para este scope, retornar array vacío
        if (allActions.length === 0) {
          return of([]);
        }

        const permissions = allActions.map(a => a.permission);

        return this.authz.query({
          scopeType: scope.type,
          scopeIds: scope.id === 0 ? [] : [scope.id],
          permissions: permissions,
          breakdown: true
        }).pipe(
          map(res => {
            // Filtrar acciones según respuesta de permisos
            let allowedPermissions: string[] = [];

            if (isBreakdownResponse(res)) {
              const scopeResult = res.results.find(r => r.scopeId === scope.id);
              allowedPermissions = scopeResult?.permissions || [];
            }

            // Transformar AdminAction[] a AdminMenuItem[]
            return allActions
              .filter(action => allowedPermissions.includes(action.permission))
              .map(action => this.toMenuItem(action));
          }),
          catchError(err => {
            console.error('❌ [AdminSidebarContainer] Error al verificar permisos:', err);
            return of([]);
          })
        );
      })
    ),
    { initialValue: [] }
  );

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
}
