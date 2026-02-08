import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Componentes de UI Globales
import { NavbarComponent } from '../components/navbar/navbar.component';

// Componentes del Panel de Admin (Nuevos)
import { AdminMenuComponent } from '../components/core/admin/admin-menu/admin-menu.component';
import { AdminTableToolbarComponent } from '../components/core/admin/table-toolbar/admin-table-toolbar.component';
import { AdminTableComponent } from '../components/core/admin/table/admin-table.component';

// Modelos
import { AdminMenuItem } from '../core/admin/admin-menu.model';
// Nota: Ajusta esta ruta si moviste el modelo junto al componente o lo dejaste en core/table
import { AdminTableColumn, AdminTableAction } from '../components/core/admin/table/admin-table.model';

@Component({
  selector: 'app-styleguide-page',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    AdminMenuComponent,        // <--- Importante para el menú
    AdminTableToolbarComponent,// <--- Importante para el toolbar
    AdminTableComponent        // <--- Importante para la tabla
  ],
  templateUrl: './styleguide.page.html',
  styleUrl: './styleguide.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StyleguidePage {

  // --- 1. CONFIGURACIÓN DEL MENÚ LATERAL ---
  public demoMenuItems: AdminMenuItem[] = [
    {
      label: 'Dashboard',
      icon: '📊',
      route: '/admin',
      category: 'General'
    },
    {
      label: 'Socios',
      icon: '👥',
      route: '/admin/socios',
      permission: 'users.view', // Ejemplo de permiso
      category: 'Gestión'
    },
    {
      label: 'Noticias',
      icon: '📰',
      route: '/admin/noticias',
      permission: 'news.view',
      category: 'Gestión'
    },
    {
      label: 'Configuración',
      icon: '⚙️',
      route: '/admin/settings',
      permission: 'settings.edit',
      category: 'Sistema',
      iconClass: 'hover:rotate-90 transition-transform duration-500' // Ejemplo de CSS extra
    },
  ];

  // --- 2. CONFIGURACIÓN DE LA TABLA ---
  public tableColumns: AdminTableColumn[] = [
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
  public tableActions: AdminTableAction[] = [
    { label: 'Revisar', action: 'review', class: 'text-brand-primary hover:underline' }
  ];

  // Datos Fake para la demo
  public tableData = [
    { id: 1, status: 'pending', socioId: '---', name: 'María García', date: new Date() },
    { id: 2, status: 'active', socioId: 'SOC-001', name: 'Juan Pérez', date: '2024-01-10' },
    { id: 3, status: 'active', socioId: 'SOC-002', name: 'Ana López', date: '2024-01-11' },
    { id: 4, status: 'incident', socioId: 'SOC-003', name: 'Carlos Ruiz', date: '2024-01-12' },
    { id: 5, status: 'alert', socioId: 'SOC-005', name: 'Pablo M.', date: '2024-01-14' },
    { id: 6, status: 'pending', socioId: '---', name: 'María García', date: new Date() },
    { id: 7, status: 'active', socioId: 'SOC-001', name: 'Juan Pérez', date: '2024-01-10' },
    { id: 8, status: 'active', socioId: 'SOC-002', name: 'Ana López', date: '2024-01-11' },
    { id: 9, status: 'incident', socioId: 'SOC-003', name: 'Carlos Ruiz', date: '2024-01-12' },
    { id: 10, status: 'alert', socioId: 'SOC-005', name: 'Pablo M.', date: '2024-01-14' },
    { id: 11, status: 'pending', socioId: '---', name: 'María García', date: new Date() },
    { id: 12, status: 'active', socioId: 'SOC-001', name: 'Juan Pérez', date: '2024-01-10' },
    { id: 13, status: 'active', socioId: 'SOC-002', name: 'Ana López', date: '2024-01-11' },
    { id: 14, status: 'incident', socioId: 'SOC-003', name: 'Carlos Ruiz', date: '2024-01-12' },
    { id: 15, status: 'alert', socioId: 'SOC-005', name: 'Pablo M.', date: '2024-01-14' },
    { id: 1, status: 'pending', socioId: '---', name: 'María García', date: new Date() },
    { id: 2, status: 'active', socioId: 'SOC-001', name: 'Juan Pérez', date: '2024-01-10' },
    { id: 3, status: 'active', socioId: 'SOC-002', name: 'Ana López', date: '2024-01-11' },
    { id: 4, status: 'incident', socioId: 'SOC-003', name: 'Carlos Ruiz', date: '2024-01-12' },
    { id: 5, status: 'alert', socioId: 'SOC-005', name: 'Pablo M.', date: '2024-01-14' },
    { id: 6, status: 'pending', socioId: '---', name: 'María García', date: new Date() },
    { id: 7, status: 'active', socioId: 'SOC-001', name: 'Juan Pérez', date: '2024-01-10' },
    { id: 8, status: 'active', socioId: 'SOC-002', name: 'Ana López', date: '2024-01-11' },
    { id: 9, status: 'incident', socioId: 'SOC-003', name: 'Carlos Ruiz', date: '2024-01-12' },
    { id: 10, status: 'alert', socioId: 'SOC-005', name: 'Pablo M.', date: '2024-01-14' },
    { id: 11, status: 'pending', socioId: '---', name: 'María García', date: new Date() },
    { id: 12, status: 'active', socioId: 'SOC-001', name: 'Juan Pérez', date: '2024-01-10' },
    { id: 13, status: 'active', socioId: 'SOC-002', name: 'Ana López', date: '2024-01-11' },
    { id: 14, status: 'incident', socioId: 'SOC-003', name: 'Carlos Ruiz', date: '2024-01-12' },
    { id: 15, status: 'alert', socioId: 'SOC-005', name: 'Pablo M.', date: '2024-01-14' },
  ];

  // --- 3. MANEJADORES DE EVENTOS ---
  onTableAction(event: { action: string, row: any }) {
    console.log('Acción tabla:', event.action, event.row);
  }
}
