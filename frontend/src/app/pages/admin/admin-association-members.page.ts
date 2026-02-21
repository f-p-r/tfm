/**
 * Página de administración de miembros de una asociación.
 *
 * Muestra la lista de usuarios miembros de la asociación actual con funcionalidad de:
 * - Visualización en tabla paginada
 * - Cambio de estado de membresía
 *
 * Requiere permiso 'admin' para acceder.
 */

import { ChangeDetectionStrategy, Component, inject, signal, computed, effect } from '@angular/core';
import { AdminSidebarContainerComponent } from '../../components/admin-sidebar/admin-sidebar-container.component';
import { AdminPageSubtitleComponent } from '../../components/core/admin/admin-page-subtitle/admin-page-subtitle.component';
import { AdminTableComponent } from '../../components/core/admin/table/admin-table.component';
import { AdminTableColumn, AdminTableAction } from '../../components/core/admin/table/admin-table.model';
import { UserAssociationApiService } from '../../core/users/user-association-api.service';
import { UserAssociation } from '../../core/users/user-association.models';
import { MemberStatusApiService } from '../../core/associations/member-status-api.service';
import { AssociationMemberStatus } from '../../core/associations/member-status.models';
import { MEMBER_STATUS_TYPE_BADGES } from '../../core/associations/member-status.constants';
import { ContextStore } from '../../core/context/context.store';

@Component({
  selector: 'app-admin-association-members-page',
  imports: [
    AdminSidebarContainerComponent,
    AdminPageSubtitleComponent,
    AdminTableComponent
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
            <h1 class="h1">Gestión de Miembros</h1>
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

          <!-- Mensaje de error -->
          @if (errorMessage()) {
            <div class="mb-4 shrink-0 animate-fade-in">
              <div class="ds-alert ds-alert-error shadow-lg max-w-2xl mx-auto">
                {{ errorMessage() }}
              </div>
            </div>
          }

          <!-- Table Card -->
          <div class="ds-table-card flex-1 min-h-0 mb-4">
            <app-admin-table
              [columns]="columns()"
              [data]="membersTableData()"
              [actions]="actions"
              [pageSize]="pageSize"
              [isLoading]="isLoading()"
              (action)="onAction($event)"
            />
          </div>

        </div>
      </main>

    </div>

    <!-- Modal de cambio de estado -->
    @if (showStatusModal() && selectedMembership()) {
      <div class="ds-modal-backdrop" (click)="onCloseModal()">
        <div class="ds-modal-content" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="border-b border-neutral-medium p-6 shrink-0">
            <h2 class="h2">Cambiar Estado de Miembro</h2>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-6">
            <!-- Información del usuario -->
            <div class="bg-neutral-light border border-neutral-medium rounded-lg p-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="font-semibold text-neutral-dark">Usuario:</span>
                  <span class="ml-2 text-neutral-dark">{{ selectedMembership()?.user?.username }}</span>
                </div>
                <div>
                  <span class="font-semibold text-neutral-dark">Nombre:</span>
                  <span class="ml-2 text-neutral-dark">{{ selectedMembership()?.user?.name }}</span>
                </div>
                @if (selectedMembership()?.association_user_id) {
                  <div>
                    <span class="font-semibold text-neutral-dark">Nº Socio:</span>
                    <span class="ml-2 text-neutral-dark">{{ selectedMembership()?.association_user_id }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Estado actual -->
            <div class="ds-field">
              <label class="ds-label">Estado actual</label>
              <div class="flex items-center gap-2">
                @if (selectedMembership()?.status) {
                  <span class="ds-badge {{ getStatusBadgeClass(selectedMembership()!.status!.type.id) }}">
                    {{ selectedMembership()?.status?.name }}
                  </span>
                } @else {
                  <span class="text-neutral-medium text-sm italic">Sin estado asignado</span>
                }
              </div>
            </div>

            <!-- Selector de nuevo estado -->
            <div class="ds-field">
              <label for="new-status" class="ds-label">Nuevo estado</label>
              <select
                id="new-status"
                class="ds-select"
                [value]="selectedStatusId()"
                (change)="onStatusSelected($event)"
              >
                <option value="">-- Seleccionar estado --</option>
                @for (status of availableStatuses(); track status.id) {
                  <option [value]="status.id">
                    {{ status.name }}
                  </option>
                }
              </select>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-neutral-medium p-6 flex gap-3 justify-end shrink-0">
            <button
              type="button"
              (click)="onCloseModal()"
              class="ds-btn ds-btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="onConfirmStatusChange()"
              [disabled]="!selectedStatusId() || isSubmitting()"
              [class.ds-btn-disabled]="!selectedStatusId() || isSubmitting()"
              class="ds-btn ds-btn-primary"
            >
              {{ isSubmitting() ? 'Guardando...' : 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminAssociationMembersPage {
  private readonly contextStore = inject(ContextStore);
  private readonly userAssociationApi = inject(UserAssociationApiService);
  private readonly memberStatusApi = inject(MemberStatusApiService);

  // Datos locales
  protected readonly members = signal<UserAssociation[]>([]);
  protected readonly availableStatuses = signal<AssociationMemberStatus[]>([]);

  // Mensajes
  protected readonly confirmationMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  // Estado de carga
  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);

  // Tamaño de página para la tabla
  protected readonly pageSize = 15;

  // Modal de cambio de estado
  protected readonly showStatusModal = signal(false);
  protected readonly selectedMembership = signal<UserAssociation | undefined>(undefined);
  protected readonly selectedStatusId = signal<number | null>(null);

  // Badge configuration dinámico basado en los estados y miembros cargados
  protected readonly badgeConfig = computed(() => {
    const config: Record<string, string> = {
      'Sin estado': 'ds-badge-request'  // Fallback
    };

    // Construir mapeo de nombre de estado -> clase CSS basado en el tipo
    this.members().forEach(member => {
      if (member.status && member.status.type) {
        const statusName = member.status.name;
        const statusTypeId = member.status.type.id;
        const badgeClass = MEMBER_STATUS_TYPE_BADGES[statusTypeId] || 'ds-badge-request';
        config[statusName] = badgeClass;
      }
    });

    return config;
  });

  // Configuración de columnas - usamos computed para que badgeConfig se actualice
  protected readonly columns = computed<AdminTableColumn[]>(() => [
    { key: 'username', label: 'Usuario', type: 'text', align: 'left' },
    { key: 'name', label: 'Nombre', type: 'text', align: 'left' },
    { key: 'email', label: 'Email', type: 'link', align: 'left', linkPrefix: 'mailto:' },
    { key: 'associationUserId', label: 'Nº Socio', type: 'text', align: 'center' },
    {
      key: 'statusName',
      label: 'Estado',
      type: 'badge',
      align: 'center',
      badgeConfig: this.badgeConfig(),
      badgeLabels: {}
    },
    { key: 'updatedAt', label: 'Última modificación', type: 'date', align: 'center' }
  ]);

  // Acciones disponibles
  protected readonly actions: AdminTableAction[] = [
    { action: 'changeStatus', label: 'Cambiar estado' }
  ];

  // Datos transformados para la tabla
  protected readonly membersTableData = computed(() => {
    return this.members().map(member => ({
      id: member.id,
      username: member.user?.username || '-',
      name: member.user?.name || '-',
      email: member.user?.email || '-',
      associationUserId: member.association_user_id || '-',
      statusName: member.status?.name || 'Sin estado',
      statusTypeId: member.status?.type?.id || 0,
      updatedAt: member.updated_at || member.created_at,
      _original: member  // Guardamos el objeto original para acceder después
    }));
  });

  constructor() {
    // Cargar datos cuando cambia el scope
    effect(() => {
      const associationId = this.contextStore.scopeId();
      if (associationId) {
        this.loadMembers(associationId);
        this.loadAvailableStatuses(associationId);
      }
    });
  }

  private loadMembers(associationId: number): void {
    this.isLoading.set(true);
    this.userAssociationApi
      .getAll({ association_id: associationId })
      .subscribe({
        next: (memberships) => {
          // Ordenar por updated_at descendente
          const sorted = memberships.sort((a, b) => {
            const dateA = new Date(b.updated_at || b.created_at || 0).getTime();
            const dateB = new Date(a.updated_at || a.created_at || 0).getTime();
            return dateA - dateB;
          });
          this.members.set(sorted);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Error al cargar los miembros');
          this.isLoading.set(false);
          setTimeout(() => this.errorMessage.set(null), 5000);
        }
      });
  }

  private loadAvailableStatuses(associationId: number): void {
    this.memberStatusApi
      .getAll(associationId)
      .subscribe({
        next: (statuses) => {
          // Ordenar por order ascendente
          const sorted = statuses.sort((a, b) => a.order - b.order);
          this.availableStatuses.set(sorted);
        },
        error: () => {
          this.errorMessage.set('Error al cargar los estados disponibles');
          setTimeout(() => this.errorMessage.set(null), 5000);
        }
      });
  }

  protected onAction(event: { action: string; row: any }) {
    if (event.action === 'changeStatus') {
      // Recuperar el objeto original desde _original
      const membership = event.row._original as UserAssociation;
      this.selectedMembership.set(membership);
      this.selectedStatusId.set(membership.status_id || null);
      this.showStatusModal.set(true);
      this.confirmationMessage.set(null);
      this.errorMessage.set(null);
    }
  }

  protected onStatusSelected(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;
    this.selectedStatusId.set(value ? Number(value) : null);
  }

  protected onCloseModal(): void {
    this.showStatusModal.set(false);
    this.selectedMembership.set(undefined);
    this.selectedStatusId.set(null);
  }

  protected onConfirmStatusChange(): void {
    const membership = this.selectedMembership();
    const newStatusId = this.selectedStatusId();

    if (!membership || !newStatusId) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    // Actualizar la membresía con el nuevo estado
    this.userAssociationApi
      .update(membership.id, { status_id: newStatusId })
      .subscribe({
        next: () => {
          // Recargar la lista de miembros
          const associationId = this.contextStore.scopeId();
          if (associationId) {
            this.loadMembers(associationId);
          }

          // Mostrar mensaje de confirmación
          const statusName = this.availableStatuses().find(s => s.id === newStatusId)?.name;
          this.confirmationMessage.set(
            `Estado actualizado correctamente${statusName ? ` a "${statusName}"` : ''}`
          );

          // Cerrar modal
          this.onCloseModal();
          this.isSubmitting.set(false);

          // Limpiar mensaje después de 5 segundos
          setTimeout(() => this.confirmationMessage.set(null), 5000);
        },
        error: () => {
          this.errorMessage.set('Error al actualizar el estado. Por favor, inténtelo de nuevo.');
          this.isSubmitting.set(false);
        }
      });
  }

  protected getStatusBadgeClass(typeId: number): string {
    return MEMBER_STATUS_TYPE_BADGES[typeId] || 'ds-badge-request';
  }
}
