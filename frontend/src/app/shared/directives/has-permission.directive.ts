/**
 * Directiva estructural para mostrar/ocultar contenido según permisos del usuario.
 * Verifica permisos usando PermissionsStore de forma reactiva.
 *
 * @example
 * ```html
 * <!-- Permiso único -->
 * <button *hasPermission="'pages.edit'" (click)="edit()">Editar</button>
 *
 * <!-- Múltiples permisos (modo ANY - tiene al menos uno) -->
 * <div *hasPermission="['admin', 'pages.edit']">
 *   Panel de gestión
 * </div>
 *
 * <!-- Múltiples permisos (modo ALL - tiene todos) -->
 * <section *hasPermission="['users.manage', 'users.create']; mode: 'all'">
 *   Gestión completa de usuarios
 * </section>
 *
 * <!-- Con template else -->
 * <div *hasPermission="'admin'; else noAccess">
 *   Contenido protegido
 * </div>
 * <ng-template #noAccess>
 *   <p>Sin permisos</p>
 * </ng-template>
 * ```
 */

import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect,
} from '@angular/core';
import { PermissionsStore } from '../../core/authz/permissions.store';

type PermissionMode = 'any' | 'all';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private permissionsStore = inject(PermissionsStore);

  private permission: string | string[] = '';
  private mode: PermissionMode = 'any';
  private elseTemplateRef: TemplateRef<any> | null = null;
  private hasView = false;
  private hasElseView = false;

  /**
   * Permiso o permisos requeridos para mostrar el contenido.
   * Puede ser un string único o un array de strings.
   */
  @Input()
  set hasPermission(permission: string | string[]) {
    this.permission = permission;
    this.updateView();
  }

  /**
   * Modo de verificación para múltiples permisos:
   * - 'any': Muestra si tiene AL MENOS UNO de los permisos (por defecto)
   * - 'all': Muestra solo si tiene TODOS los permisos
   */
  @Input()
  set hasPermissionMode(mode: PermissionMode) {
    this.mode = mode;
    this.updateView();
  }

  /**
   * Template alternativo a mostrar si NO tiene el permiso.
   * Equivalente al 'else' de *ngIf
   */
  @Input()
  set hasPermissionElse(templateRef: TemplateRef<any> | null) {
    this.elseTemplateRef = templateRef;
    this.updateView();
  }

  constructor() {
    // Efecto reactivo: actualiza la vista cuando cambian los permisos
    effect(() => {
      // Forzar re-evaluación cuando cambien los permisos del store
      this.permissionsStore.allPermissions();
      this.updateView();
    });
  }

  /**
   * Actualiza la vista (muestra/oculta el contenido) según los permisos.
   */
  private updateView(): void {
    const hasPermission = this.checkPermission();

    if (hasPermission) {
      // Tiene permiso → mostrar contenido principal
      if (!this.hasView) {
        this.viewContainer.clear();
        this.hasView = true;
        this.hasElseView = false;
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      // NO tiene permiso → mostrar template else o limpiar
      if (this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
        this.hasElseView = false;
      }

      if (!this.hasElseView) {
        this.viewContainer.clear(); // garantiza que no haya vistas huérfanas
        if (this.elseTemplateRef) {
          this.viewContainer.createEmbeddedView(this.elseTemplateRef);
          this.hasElseView = true;
        }
      }
    }
  }

  /**
   * Verifica si el usuario tiene el/los permiso(s) requerido(s).
   * @returns true si tiene acceso, false si no
   */
  private checkPermission(): boolean {
    if (!this.permission) {
      return false;
    }

    // Permiso único (string)
    if (typeof this.permission === 'string') {
      return this.permissionsStore.hasPermission(this.permission);
    }

    // Múltiples permisos (array)
    if (Array.isArray(this.permission)) {
      if (this.permission.length === 0) {
        return false;
      }

      if (this.mode === 'all') {
        // Modo ALL: debe tener TODOS los permisos
        return this.permissionsStore.hasAllPermissions(this.permission);
      } else {
        // Modo ANY (por defecto): debe tener AL MENOS UNO
        return this.permissionsStore.hasAnyPermission(this.permission);
      }
    }

    return false;
  }
}
