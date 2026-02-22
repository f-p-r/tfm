/**
 * Página de administración de estados de miembros de asociaciones.
 *
 * Muestra la lista de estados configurados para la asociación actual con:
 * - Visualización en tabla paginada
 * - Creación de nuevos estados
 * - Edición de estados existentes mediante modal
 * - Eliminación de estados con confirmación
 *
 * Requiere permiso 'admin' para la asociación en el scope activo.
 */

import { ChangeDetectionStrategy, Component, inject, signal, computed, viewChild } from '@angular/core';
import { AdminSidebarContainerComponent } from '../../components/admin-sidebar/admin-sidebar-container.component';
import { AdminPageSubtitleComponent } from '../../components/core/admin/admin-page-subtitle/admin-page-subtitle.component';
import { AdminTableComponent } from '../../components/core/admin/table/admin-table.component';
import { AdminTableColumn, AdminTableAction } from '../../components/core/admin/table/admin-table.model';
import { MemberStatusApiService } from '../../core/associations/member-status-api.service';
import { MemberStatusEditModalComponent } from '../../components/core/admin/member-status-edit-modal/member-status-edit-modal.component';
import { AssociationMemberStatus } from '../../core/associations/member-status.models';
import { ContextStore } from '../../core/context/context.store';
import { MEMBER_STATUS_TYPE_NAMES, MEMBER_STATUS_TYPE_BADGES } from '../../core/associations/member-status.constants';
import { PageHelpService } from '../../shared/help/page-help.service';
import { ADMIN_MEMBER_STATUSES_PAGE_HELP } from '../../shared/help/page-content/admin-member-statuses.help';

@Component({
  selector: 'app-admin-member-statuses-page',
  imports: [
    AdminSidebarContainerComponent,
    AdminPageSubtitleComponent,
    AdminTableComponent,
    MemberStatusEditModalComponent
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
          <div class="mb-6 shrink-0 flex justify-between items-start">
            <div>
              <h1 class="h1">Gestión de Estados de Miembros</h1>
              <app-admin-page-subtitle />
              <p class="text-neutral-medium mt-2">
                Configura los estados disponibles para los miembros de esta asociación
              </p>
            </div>
            <button class="ds-btn ds-btn-primary" (click)="onCreateStatus()">
              Crear estado
            </button>
          </div>

          <!-- Error general -->
          @if (generalError()) {
            <div class="ds-alert ds-alert-error mb-4 shrink-0">
              {{ generalError() }}
            </div>
          }

          <!-- Mensaje de confirmación -->
          @if (confirmationMessage()) {
            <div class="ds-alert ds-alert-success mb-4 shrink-0 animate-fade-in">
              {{ confirmationMessage() }}
            </div>
          }

          <!-- Table Card -->
          <div class="ds-table-card flex-1 min-h-0 mb-4">
            <app-admin-table
              [columns]="columns"
              [data]="statuses()"
              [actions]="actions"
              [pageSize]="pageSize"
              [isLoading]="isLoading()"
              (action)="onAction($event)"
            />
          </div>

        </div>
      </main>

    </div>

    <!-- Modal de creación/edición -->
    @if (showModal()) {
      <app-member-status-edit-modal
        [mode]="modalMode()"
        [associationId]="associationId()"
        [statusData]="selectedStatus()"
        (save)="onSaveStatus($event)"
        (cancel)="onCancelModal()"
      />
    }

    <!-- Modal de confirmación para eliminar -->
    @if (showDeleteConfirmation()) {
      <div class="ds-modal-backdrop">
        <div class="ds-modal-content max-w-md">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-neutral-medium">
            <h2 class="h3">Confirmar eliminación</h2>
          </div>

          <!-- Body -->
          <div class="px-6 py-4">
            <p class="text-neutral-dark">
              ¿Estás seguro de que deseas eliminar el estado <strong>"{{ statusToDelete()?.name }}"</strong>?
            </p>
            <p class="text-sm text-neutral-medium mt-2">
              Esta acción no se puede deshacer.
            </p>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-neutral-medium flex justify-end gap-3">
            <button
              type="button"
              class="ds-btn ds-btn-secondary"
              (click)="onCancelDelete()"
              [disabled]="isDeleting()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="ds-btn ds-btn-danger"
              (click)="onConfirmDelete()"
              [disabled]="isDeleting()"
            >
              {{ isDeleting() ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminMemberStatusesPage {
  private readonly memberStatusApi = inject(MemberStatusApiService);
  private readonly contextStore = inject(ContextStore);

  // Datos locales
  protected readonly statuses = signal<AssociationMemberStatus[]>([]);
  protected readonly associationId = computed(() => this.contextStore.scopeId() ?? 0);

  // Modal de edición
  protected readonly showModal = signal(false);
  protected readonly modalMode = signal<'create' | 'edit'>('edit');
  protected readonly selectedStatus = signal<AssociationMemberStatus | null>(null);
  private readonly modalComponent = viewChild(MemberStatusEditModalComponent);

  // Modal de confirmación de eliminación
  protected readonly showDeleteConfirmation = signal(false);
  protected readonly statusToDelete = signal<AssociationMemberStatus | null>(null);
  protected readonly isDeleting = signal(false);

  // Mensajes
  protected readonly confirmationMessage = signal<string | null>(null);
  protected readonly generalError = signal<string | null>(null);

  // Estado de carga
  protected readonly isLoading = signal(false);

  // Tamaño de página para la tabla
  protected readonly pageSize = 15;

  // Configuración de columnas
  protected readonly columns: AdminTableColumn[] = [
    { key: 'name', label: 'Nombre', type: 'text', align: 'left' },
    {
      key: 'type',
      label: 'Tipo',
      type: 'badge',
      align: 'left',
      badgeConfig: {
        '1': MEMBER_STATUS_TYPE_BADGES[1],
        '2': MEMBER_STATUS_TYPE_BADGES[2],
        '3': MEMBER_STATUS_TYPE_BADGES[3],
        '4': MEMBER_STATUS_TYPE_BADGES[4],
        '5': MEMBER_STATUS_TYPE_BADGES[5]
      },
      badgeLabels: {
        '1': MEMBER_STATUS_TYPE_NAMES[1],
        '2': MEMBER_STATUS_TYPE_NAMES[2],
        '3': MEMBER_STATUS_TYPE_NAMES[3],
        '4': MEMBER_STATUS_TYPE_NAMES[4],
        '5': MEMBER_STATUS_TYPE_NAMES[5]
      }
    },
    { key: 'description', label: 'Descripción', type: 'text', align: 'left' },
    { key: 'order', label: 'Orden', type: 'text', align: 'center' }
  ];

  // Acciones disponibles
  protected readonly actions: AdminTableAction[] = [
    { action: 'edit', label: 'Modificar' },
    { action: 'delete', label: 'Eliminar'}
  ];

  constructor() {
    inject(PageHelpService).set(ADMIN_MEMBER_STATUSES_PAGE_HELP);
    // Cargar estados al inicializar
    this.loadStatuses();
  }

  private loadStatuses() {
    const assocId = this.associationId();
    if (!assocId) {
      this.generalError.set('No hay una asociación seleccionada en el contexto actual');
      return;
    }

    this.isLoading.set(true);
    this.generalError.set(null);

    this.memberStatusApi.getAll(assocId).subscribe({
      next: (statuses) => {
        this.statuses.set(statuses);
        this.isLoading.set(false);
      },
      error: (errorResponse) => {
        this.isLoading.set(false);
        this.handleHttpError(errorResponse);
      }
    });
  }

  protected onCreateStatus() {
    this.modalMode.set('create');
    this.selectedStatus.set(null);
    this.showModal.set(true);
  }

  protected onAction(event: { action: string; row: any }) {
    if (event.action === 'edit') {
      this.modalMode.set('edit');
      this.selectedStatus.set(event.row);
      this.showModal.set(true);
    } else if (event.action === 'delete') {
      this.statusToDelete.set(event.row);
      this.showDeleteConfirmation.set(true);
    }
  }

  protected onSaveStatus(event: { id: number | null; data: any }) {
    const modal = this.modalComponent();
    if (!modal) return;

    modal.setSaving(true);

    const operation = event.id === null
      ? this.memberStatusApi.create(event.data)
      : this.memberStatusApi.update(event.id, event.data);

    const actionText = event.id === null ? 'creado' : 'modificado';

    operation.subscribe({
      next: (response: any) => {
        // La API devuelve directamente el objeto cuando es exitoso, o {errors: true, errorsList: {...}} cuando hay errores
        if (response.errors === true && response.errorsList) {
          // Errores de validación
          modal.setErrors(response.errorsList);
          modal.setSaving(false);
        } else {
          // Éxito - la respuesta es el objeto directamente
          modal.setSaving(false);
          this.showModal.set(false);
          this.selectedStatus.set(null);

          this.confirmationMessage.set(`Estado "${response.name}" ${actionText} correctamente`);
          setTimeout(() => this.confirmationMessage.set(null), 4000);

          this.loadStatuses();
        }
      },
      error: (errorResponse) => {
        modal.setSaving(false);

        // Formato 1: {errors: true, errorsList: {...}}
        if (errorResponse.error?.errors === true && errorResponse.error?.errorsList) {
          modal.setErrors(errorResponse.error.errorsList);
        }
        // Formato 2: Error 422 Laravel
        else if (errorResponse.status === 422 && errorResponse.error?.errors) {
          const backendErrors: Record<string, string> = {};
          Object.entries(errorResponse.error.errors).forEach(([field, messages]) => {
            backendErrors[field] = (messages as string[])[0];
          });
          modal.setErrors(backendErrors);
        }
        // Formato 3: Error genérico
        else {
          const errorMsg = errorResponse.error?.message || `Error al ${event.id === null ? 'crear' : 'guardar'} el estado`;
          modal.setErrors({ general: errorMsg });
        }
      }
    });
  }

  protected onCancelModal() {
    this.showModal.set(false);
    this.selectedStatus.set(null);
  }

  protected onCancelDelete() {
    this.showDeleteConfirmation.set(false);
    this.statusToDelete.set(null);
  }

  protected onConfirmDelete() {
    const status = this.statusToDelete();
    if (!status) return;

    this.isDeleting.set(true);

    this.memberStatusApi.delete(status.id).subscribe({
      next: () => {
        this.showDeleteConfirmation.set(false);
        this.statusToDelete.set(null);
        this.isDeleting.set(false);

        this.confirmationMessage.set(`Estado "${status.name}" eliminado correctamente`);
        setTimeout(() => this.confirmationMessage.set(null), 4000);

        this.loadStatuses();
      },
      error: (errorResponse) => {
        this.isDeleting.set(false);
        this.showDeleteConfirmation.set(false);
        this.statusToDelete.set(null);

        this.handleHttpError(errorResponse);
      }
    });
  }

  private handleHttpError(errorResponse: any): void {
    // Formato 1: {errors: true, errorsList: {...}}
    if (errorResponse.error?.errors === true && errorResponse.error?.errorsList) {
      const messages = Object.values(errorResponse.error.errorsList).join('. ');
      this.generalError.set(messages);
    }
    // Formato 2: Error con mensaje
    else if (errorResponse.error?.message) {
      this.generalError.set(errorResponse.error.message);
    }
    // Formato 3: Error genérico
    else {
      this.generalError.set('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
    }

    // Auto-ocultar después de 5 segundos
    setTimeout(() => this.generalError.set(null), 5000);
  }
}
