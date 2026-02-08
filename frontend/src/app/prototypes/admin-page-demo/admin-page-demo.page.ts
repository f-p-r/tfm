import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AdminMenuComponent } from '../../components/core/admin/admin-menu/admin-menu.component';
import { AdminTableToolbarComponent } from '../../components/core/admin/table-toolbar/admin-table-toolbar.component';
import { AdminTableComponent } from '../../components/core/admin/table/admin-table.component';
import { AdminMenuItem } from '../../core/admin/admin-menu.model';
import { AdminTableColumn, AdminTableAction } from '../../components/core/admin/table/admin-table.model';

/**
 * Prototipo: Layout de Administración completo
 * Demuestra el funcionamiento del layout admin con navbar, sidebar, tabla y paginación.
 */
@Component({
  selector: 'app-admin-page-demo',
  imports: [
    CommonModule,
    NavbarComponent,
    AdminMenuComponent,
    AdminTableToolbarComponent,
    AdminTableComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Navbar admin sticky -->
    <div class="h-16 sticky top-0 z-[60]">
      <app-navbar [isAdmin]="true" />
    </div>

    <!-- Admin Shell -->
    <div class="ds-admin-shell">

      <!-- Sidebar -->
      <aside id="admin-sidebar" class="ds-admin-sidebar">
        <app-admin-menu [items]="menuItems" [demoMode]="true" />
      </aside>

      <!-- Main content -->
      <main class="ds-admin-main ds-container">
        <div class="flex-1 flex flex-col pt-6 min-h-0">

          <!-- Page header -->
          <div class="mb-4 flex justify-between items-end shrink-0">
            <div>
              <h1 class="h3">Listado de Socios</h1>
              <p class="text-sm text-neutral-500">Gestión de altas, bajas y solicitudes.</p>
            </div>
          </div>

          <!-- Table card -->
          <div class="ds-table-card h-[500px]">

            <!-- Toolbar -->
            <app-admin-table-toolbar placeholder="Buscar socio por nombre, email o ID...">

              <div filters class="hidden md:block">
                <select class="ds-select py-1.5 text-sm w-auto">
                  <option value="">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="pending">Solicitudes</option>
                </select>
              </div>

              <div actions class="flex gap-2">
                <button class="ds-btn ds-btn-secondary text-xs flex items-center gap-2">
                  <span>📥</span> <span class="hidden sm:inline">Exportar</span>
                </button>
                <button class="ds-btn ds-btn-primary text-xs flex items-center gap-1">
                  <span class="text-lg leading-none">+</span> Nuevo
                </button>
              </div>

            </app-admin-table-toolbar>

            <!-- Table -->
            <app-admin-table
              [columns]="tableColumns"
              [data]="tableData"
              [actions]="tableActions"
              [total]="142"
              [page]="1"
              [pageSize]="15"
              (action)="onTableAction($event)" />

          </div>

          <!-- Footer -->
          <footer class="mt-4 text-center text-xs text-neutral-500 shrink-0">
            <p>&copy; 2026 Naipeando Admin Panel</p>
          </footer>

        </div>
      </main>

    </div>
  `
})
export class AdminPageDemoPage {

  // Configuración del menú lateral
  menuItems: AdminMenuItem[] = [
    {
      label: 'Dashboard',
      icon: '📊',
      route: '/prototypes/admin-page-demo',
      category: 'General'
    },
    {
      label: 'Socios',
      icon: '👥',
      route: '/admin/socios',
      category: 'Gestión'
    },
    {
      label: 'Noticias',
      icon: '📰',
      route: '/admin/noticias',
      category: 'Gestión'
    },
    {
      label: 'Torneos',
      icon: '🏆',
      route: '/admin/torneos',
      category: 'Gestión'
    },
    {
      label: 'Configuración',
      icon: '⚙️',
      route: '/admin/settings',
      category: 'Sistema',
      iconClass: 'hover:rotate-90 transition-transform duration-500'
    }
  ];

  // Configuración de columnas de la tabla
  tableColumns: AdminTableColumn[] = [
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      width: 'w-24',
      badgeConfig: {
        'active': 'ds-badge-active',
        'pending': 'ds-badge-request',
        'incident': 'ds-badge-incident',
        'alert': 'ds-badge-alert'
      },
      badgeLabels: {
        'active': 'Activo',
        'pending': 'Solicitud',
        'incident': 'Incidencia',
        'alert': 'Alerta'
      }
    },
    { key: 'socioId', label: 'Nº Socio' },
    { key: 'name', label: 'Nombre' },
    { key: 'date', label: 'Fecha', type: 'date' }
  ];

  // Acciones por fila
  tableActions: AdminTableAction[] = [
    { label: 'Revisar', action: 'review', class: 'text-brand-primary' }
  ];

  // Datos de ejemplo
  tableData = [
    { id: 1, status: 'pending', socioId: '---', name: 'María García', date: new Date() },
    { id: 2, status: 'active', socioId: 'SOC-001', name: 'Juan Pérez', date: '2024-01-10' },
    { id: 3, status: 'active', socioId: 'SOC-002', name: 'Ana López', date: '2024-01-11' },
    { id: 4, status: 'incident', socioId: 'SOC-003', name: 'Carlos Ruiz', date: '2024-01-12' },
    { id: 5, status: 'alert', socioId: 'SOC-005', name: 'Pablo M.', date: '2024-01-14' },
    { id: 6, status: 'pending', socioId: '---', name: 'Laura S.', date: new Date() },
    { id: 7, status: 'active', socioId: 'SOC-007', name: 'Diego R.', date: '2024-01-15' },
    { id: 8, status: 'active', socioId: 'SOC-008', name: 'Carmen F.', date: '2024-01-16' },
    { id: 9, status: 'incident', socioId: 'SOC-009', name: 'Sergio M.', date: '2024-01-17' },
    { id: 10, status: 'active', socioId: 'SOC-010', name: 'Patricia L.', date: '2024-01-18' },
    { id: 11, status: 'alert', socioId: 'SOC-011', name: 'Roberto C.', date: '2024-01-19' },
    { id: 12, status: 'active', socioId: 'SOC-012', name: 'Isabel G.', date: '2024-01-20' },
    { id: 13, status: 'pending', socioId: '---', name: 'Fernando D.', date: new Date() },
    { id: 14, status: 'active', socioId: 'SOC-014', name: 'Lucía P.', date: '2024-01-21' },
    { id: 15, status: 'active', socioId: 'SOC-015', name: 'Miguel A.', date: '2024-01-22' }
  ];

  onTableAction(event: { action: string; row: any }) {
    console.log('Acción de tabla:', event);
  }
}
