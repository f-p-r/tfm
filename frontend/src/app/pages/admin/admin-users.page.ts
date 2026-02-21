/**
 * Página de administración de usuarios.
 *
 * Muestra la lista completa de usuarios con funcionalidad de:
 * - Visualización en tabla paginada
 * - Gestión de roles por usuario
 * - Restablecer contraseña
 *
 * Requiere permiso 'admin' para acceder.
 */

import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { AdminSidebarContainerComponent } from '../../components/admin-sidebar/admin-sidebar-container.component';
import { AdminPageSubtitleComponent } from '../../components/core/admin/admin-page-subtitle/admin-page-subtitle.component';
import { AdminTableComponent } from '../../components/core/admin/table/admin-table.component';
import { AdminTableColumn, AdminTableAction } from '../../components/core/admin/table/admin-table.model';
import { UsersService } from '../../core/users/users.service';
import { User } from '../../core/auth/user.model';
import { UserRoleManagementModalComponent } from '../../components/core/admin/user-role-management-modal/user-role-management-modal.component';

@Component({
  selector: 'app-admin-users-page',
  imports: [
    AdminSidebarContainerComponent,
    AdminPageSubtitleComponent,
    AdminTableComponent,
    UserRoleManagementModalComponent
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
            <h1 class="h1">Gestión de Usuarios</h1>
            <app-admin-page-subtitle />
          </div>

          <!-- Mensaje de confirmación -->
          @if (confirmationMessage()) {
            <div class="mb-4 shrink-0 animate-fade-in">
              <div class="ds-alert ds-alert-success shadow-lg max-w-2xl mx-auto">
                {{ confirmationMessage() }}
              </div>
            </div>
          }

          <!-- Table Card -->
          <div class="ds-table-card flex-1 min-h-0 mb-4">
            <app-admin-table
              [columns]="columns"
              [data]="users()"
              [actions]="actions"
              [pageSize]="pageSize"
              [isLoading]="isLoading()"
              (action)="onAction($event)"
            />
          </div>

        </div>
      </main>

    </div>

    <!-- Modal de gestión de roles -->
    @if (showRoleManagementModal() && selectedUser()) {
      <app-user-role-management-modal
        [userId]="selectedUserId()"
        [username]="selectedUsername()"
        (close)="onCloseRoleModal()"
        (resetPassword)="onResetPasswordFromModal()"
        (roleChanged)="onRoleChanged()"
      />
    }
  `
})
export class AdminUsersPage {
  private readonly usersService = inject(UsersService);

  // Datos locales
  protected readonly users = signal<User[]>([]);

  // Confirmación
  protected readonly confirmationMessage = signal<string | null>(null);

  // Estado de carga
  protected readonly isLoading = signal(false);

  // Tamaño de página para la tabla
  protected readonly pageSize = 15;

  // Configuración de columnas
  protected readonly columns: AdminTableColumn[] = [
    { key: 'id', label: 'ID', type: 'text', align: 'left' },
    { key: 'username', label: 'Usuario', type: 'text', align: 'left' },
    { key: 'name', label: 'Nombre', type: 'text', align: 'left' },
    { key: 'email', label: 'Email', type: 'text', align: 'left' },
    { key: 'createdAt', label: 'Fecha creación', type: 'date', align: 'center' }
  ];

  // Acciones disponibles
  protected readonly actions: AdminTableAction[] = [
    { action: 'manage', label: 'Gestión' }
  ];

  // Estado del modal
  protected readonly showRoleManagementModal = signal(false);
  protected readonly selectedUser = signal<User | undefined>(undefined);

  // Computed signals para pasar al modal (con valores por defecto)
  protected readonly selectedUserId = computed(() => this.selectedUser()?.id ?? 0);
  protected readonly selectedUsername = computed(() => this.selectedUser()?.username ?? '');

  constructor() {
    // Cargar usuarios al inicializar
    this.loadUsers();
  }

  private loadUsers() {
    this.isLoading.set(true);
    this.usersService.getAll().subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  protected onAction(event: { action: string; row: any }) {
    if (event.action === 'manage') {
      // Buscar el usuario completo
      const user = this.users().find(u => u.id === event.row.id);
      if (user) {
        this.selectedUser.set(user);
        this.showRoleManagementModal.set(true);
        this.confirmationMessage.set(null); // Limpiar mensaje previo
      }
    }
  }

  protected onCloseRoleModal() {
    this.showRoleManagementModal.set(false);
    this.selectedUser.set(undefined);
  }

  protected onResetPasswordFromModal() {
    const user = this.selectedUser();
    if (user) {
      this.confirmationMessage.set(
        `Se ha restablecido la contraseña del usuario "${user.username}".\n(Acción no implementada)`
      );
      this.showRoleManagementModal.set(false);
      this.selectedUser.set(undefined);
      setTimeout(() => this.confirmationMessage.set(null), 5000);
    }
  }

  protected onRoleChanged() {
    // No cerramos el modal, solo mostramos mensaje cuando se cierre
    // El modal ya recarga su lista interna
  }
}
