/**
 * Página de administración de asociaciones.
 *
 * Muestra la lista completa de asociaciones con funcionalidad de:
 * - Visualización en tabla paginada
 * - Creación y edición mediante modal
 *
 * Requiere permiso 'admin' para acceder.
 */

import { ChangeDetectionStrategy, Component, inject, signal, computed, viewChild } from '@angular/core';
import { AdminSidebarContainerComponent } from '../../components/admin-sidebar/admin-sidebar-container.component';
import { AdminTableComponent } from '../../components/core/admin/table/admin-table.component';
import { AdminTableColumn, AdminTableAction } from '../../components/core/admin/table/admin-table.model';
import { AssociationsApiService } from '../../core/associations/associations-api.service';
import { Association } from '../../core/associations/associations.models';
import { AssociationEditModalComponent } from '../../components/core/admin/association-edit-modal/association-edit-modal.component';

@Component({
  selector: 'app-admin-associations-page',
  imports: [
    AdminSidebarContainerComponent,
    AdminTableComponent,
    AssociationEditModalComponent
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

          <!-- Mensaje de confirmación -->
          @if (successMessage()) {
            <div class="ds-alert ds-alert-success mb-4 animate-fade-in shrink-0">
              {{ successMessage() }}
            </div>
          }

          <!-- Page header -->
          <div class="mb-6 shrink-0 flex items-center justify-between">
            <h1 class="h1">Gestión de Asociaciones</h1>
            <button class="ds-btn ds-btn-primary" (click)="onCreateAssociation()">
              Crear asociación
            </button>
          </div>

          <!-- Table Card -->
          <div class="ds-table-card flex-1">
            <app-admin-table
              [columns]="columns"
              [data]="transformedAssociations()"
              [actions]="actions"
              [pageSize]="pageSize"
              [isLoading]="isLoading()"
              (action)="onAction($event)"
            />
          </div>

        </div>
      </main>

    </div>

    <!-- Modal de edición -->
    @if (showModal()) {
      <app-association-edit-modal
        [associationData]="selectedAssociation() || null"
        [mode]="modalMode()"
        (save)="onSaveAssociation($event)"
        (cancel)="onCancelModal()"
      />
    }
  `
})
export class AdminAssociationsPage {
  private readonly associationsApi = inject(AssociationsApiService);

  // Datos locales
  protected readonly associations = signal<Association[]>([]);

  // Estado de carga
  protected readonly isLoading = signal(false);

  // Tamaño de página para la tabla
  protected readonly pageSize = 15;

  // Estado del modal
  protected readonly showModal = signal(false);
  protected readonly modalMode = signal<'create' | 'edit'>('create');
  protected readonly selectedAssociation = signal<Association | undefined>(undefined);

  // Mensaje de confirmación
  protected readonly successMessage = signal<string | null>(null);

  // Referencia al modal para manejar errores del servidor
  protected readonly modalComponent = viewChild(AssociationEditModalComponent);

  // Configuración de columnas
  protected readonly columns: AdminTableColumn[] = [
    { key: 'id', label: 'ID', type: 'text', align: 'left' },
    { key: 'name', label: 'Nombre', type: 'text', align: 'left' },
    { key: 'slug', label: 'Slug', type: 'text', align: 'left' },
    { key: 'country', label: 'País', type: 'text', align: 'left' },
    { key: 'region', label: 'Región', type: 'text', align: 'left' },
    { key: 'responsable', label: 'Responsable', type: 'text', align: 'left' },
    {
      key: 'disabled',
      label: 'Estado',
      type: 'badge',
      align: 'center',
      badgeConfig: {
        'false': 'ds-badge-active',
        'true': 'ds-badge-alert'
      },
      badgeLabels: {
        'false': 'Activa',
        'true': 'Deshabilitada'
      }
    },
    { key: 'createdAt', label: 'Fecha creación', type: 'date', align: 'left' }
  ];

  // Acciones disponibles
  protected readonly actions: AdminTableAction[] = [
    { action: 'edit', label: 'Editar' }
  ];

  // Datos transformados para la tabla
  protected readonly transformedAssociations = computed(() => {
    return this.associations().map(assoc => ({
      id: assoc.id,
      name: assoc.name,
      slug: assoc.slug,
      country: assoc.country?.name || '-',
      region: assoc.region?.name || '-',
      responsable: assoc.owner?.username || '-',
      disabled: assoc.disabled.toString(),
      createdAt: assoc.created_at || ''
    }));
  });

  constructor() {
    // Cargar asociaciones al inicializar
    this.loadAssociations();
  }

  private loadAssociations() {
    this.isLoading.set(true);
    this.associationsApi.getAll(true).subscribe({
      next: (data) => {
        this.associations.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  protected onAction(event: { action: string; row: any }) {
    if (event.action === 'edit') {
      // Buscar la asociación completa y abrir el modal de edición
      const association = this.associations().find(a => a.id === event.row.id);
      if (association) {
        this.selectedAssociation.set(association);
        this.modalMode.set('edit');
        this.showModal.set(true);
        this.successMessage.set(null); // Limpiar mensaje previo
      }
    }
  }

  /**
   * Abre el modal para crear una nueva asociación.
   */
  protected onCreateAssociation() {
    this.selectedAssociation.set(undefined);
    this.modalMode.set('create');
    this.showModal.set(true);
    this.successMessage.set(null); // Limpiar mensaje previo
  }

  /**
   * Guarda la asociación (crear o actualizar).
   */
  protected onSaveAssociation(event: { id: number | null; data: Partial<Association> }) {
    const apiCall = event.id === null
      ? this.associationsApi.create(event.data)
      : this.associationsApi.update(event.id, event.data);

    const actionText = event.id === null ? 'crear' : 'guardar';
    const isCreate = event.id === null;

    apiCall.subscribe({
      next: () => {
        // Recargar la lista y cerrar el modal
        this.loadAssociations();
        this.showModal.set(false);

        // Mostrar mensaje de confirmación
        const message = isCreate
          ? 'Asociación creada correctamente'
          : 'Asociación actualizada correctamente';
        this.successMessage.set(message);

        // Ocultar mensaje después de 5 segundos
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: (err) => {
        // Mostrar error en el modal
        const errorMsg = err.error?.message || `Error al ${actionText} la asociación`;
        this.modalComponent()?.setError(errorMsg);
      }
    });
  }

  /**
   * Cierra el modal sin guardar.
   */
  protected onCancelModal() {
    this.showModal.set(false);
  }
}
