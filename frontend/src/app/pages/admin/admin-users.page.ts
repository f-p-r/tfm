/**
 * Página de administración de usuarios.
 *
 * Muestra la lista completa de usuarios con funcionalidad de:
 * - Visualización en tabla paginada
 * - Restablecer contraseña (acción pendiente de implementación)
 *
 * Requiere permiso 'admin' para acceder.
 */

import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { AdminSidebarContainerComponent } from '../../components/admin-sidebar/admin-sidebar-container.component';
import { AdminTableComponent } from '../../components/core/admin/table/admin-table.component';
import { AdminTableColumn, AdminTableAction } from '../../components/core/admin/table/admin-table.model';
import { UsersService } from '../../core/users/users.service';
import { User } from '../../core/auth/user.model';

@Component({
  selector: 'app-admin-users-page',
  imports: [
    AdminSidebarContainerComponent,
    AdminTableComponent
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
            <h1 class="h1">Gestión de Usuarios</h1>
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
          <div class="ds-table-card flex-1">
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
    { key: 'createdAt', label: 'Fecha creación', type: 'date', align: 'left' }
  ];

  // Acciones disponibles
  protected readonly actions: AdminTableAction[] = [
    { action: 'reset-password', label: 'Restablecer contraseña' }
  ];

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
    if (event.action === 'reset-password') {
      const username = event.row.username;
      this.confirmationMessage.set(
        `Se ha restablecido la contraseña del usuario "${username}".\n(Acción no implementada)`
      );
      setTimeout(() => this.confirmationMessage.set(null), 5000);
    }
  }
}
