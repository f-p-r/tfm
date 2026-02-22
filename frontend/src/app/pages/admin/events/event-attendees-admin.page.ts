import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ContextStore } from '../../../core/context/context.store';

import { AdminSidebarContainerComponent } from '../../../components/admin-sidebar/admin-sidebar-container.component';
import { AdminTableComponent } from '../../../components/core/admin/table/admin-table.component';
import { AdminTableColumn, AdminTableAction } from '../../../components/core/admin/table/admin-table.model';
import { UserEventsApiService, UserEventDTO } from '../../../core/events/user-events-api.service';
import { EventsApiService } from '../../../core/events/events-api.service';
import { PageHelpService } from '../../../shared/help/page-help.service';
import { getAdminEventAttendeesHelp } from '../../../shared/help/page-content/admin-event-attendees.help';

const STATUS_OPTIONS = [
  { value: '1', label: 'Solicitud pendiente' },
  { value: '2', label: 'Admitido' },
  { value: '3', label: 'Rechazado' },
];

/**
 * Página de administración: gestión de inscripciones de un evento.
 *
 * Permite ver el listado de usuarios inscritos y cambiar su estado
 * mediante un modal de confirmación.
 *
 * Acceso: requiere permiso events.edit en el scope actual.
 */
@Component({
  selector: 'app-event-attendees-admin',
  imports: [AdminSidebarContainerComponent, AdminTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ds-admin-shell">

      <app-admin-sidebar-container />

      <main class="ds-admin-main ds-container">
        <div class="flex-1 flex flex-col pt-6 min-h-0">

          <!-- Cabecera -->
          <div class="mb-6 shrink-0 flex items-start justify-between gap-4">
            <div>
              <h1 class="h1">Inscripciones</h1>
              @if (eventTitle()) {
                <p class="text-sm text-neutral-dark mt-1">{{ eventTitle() }}</p>
              }
            </div>
            <button type="button" class="ds-btn ds-btn-secondary shrink-0 mt-1" (click)="goBack()">
              ← Volver
            </button>
          </div>

          <!-- Mensaje de éxito -->
          @if (successMessage()) {
            <div class="mb-4 shrink-0 animate-fade-in">
              <div class="ds-alert ds-alert-success ds-alert-autofade shadow-lg max-w-2xl">
                {{ successMessage() }}
              </div>
            </div>
          }

          <!-- Mensaje de error -->
          @if (errorMessage()) {
            <div class="mb-4 shrink-0 animate-fade-in">
              <div class="ds-alert ds-alert-error shadow-lg max-w-2xl">
                {{ errorMessage() }}
              </div>
            </div>
          }

          <!-- Tabla -->
          <div class="ds-table-card flex-1 min-h-0 mb-4">
            <app-admin-table
              [columns]="columns"
              [data]="tableData()"
              [actions]="actions"
              [isLoading]="isLoading()"
              (action)="onAction($event)"
            />
          </div>

        </div>
      </main>

    </div>

    <!-- Modal cambio de estado -->
    @if (showModal() && selectedAttendee()) {
      <div class="ds-modal-backdrop" (click)="closeModal()">
        <div class="ds-modal-content" style="min-height: 500px" (click)="$event.stopPropagation()">

          <div class="border-b border-neutral-medium p-6 shrink-0">
            <h2 class="h2">Cambiar estado de inscripción</h2>
          </div>

          <div class="p-6 space-y-6 flex-1">
            <!-- Info usuario -->
            <div class="bg-neutral-light border border-neutral-medium rounded-lg p-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="font-semibold text-neutral-dark">Usuario:</span>
                  <span class="ml-2 text-neutral-dark">{{ selectedAttendee()!.user.username }}</span>
                </div>
                <div>
                  <span class="font-semibold text-neutral-dark">Nombre:</span>
                  <span class="ml-2 text-neutral-dark">{{ selectedAttendee()!.user.name }}</span>
                </div>
                @if (selectedAttendee()!.user.email) {
                  <div class="md:col-span-2">
                    <span class="font-semibold text-neutral-dark">Email:</span>
                    <span class="ml-2 text-neutral-dark">{{ selectedAttendee()!.user.email }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Estado actual -->
            <div class="ds-field">
              <label class="ds-label">Estado actual</label>
              <span style="width: fit-content" [class]="'ds-badge ' + statusBadgeClass(selectedAttendee()!.status)">
                {{ selectedAttendee()!.statusType.name }}
              </span>
            </div>

            <!-- Nuevo estado -->
            <div class="ds-field">
              <label for="modal-status" class="ds-label">Nuevo estado</label>
              <select
                id="modal-status"
                class="ds-select"
                style="width: 20ch"
                [value]="modalStatus()"
                (change)="onModalStatusChange($event)"
              >
                <option value="">-- Seleccionar --</option>
                @for (opt of statusOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            </div>
          </div>

          <div class="border-t border-neutral-medium p-6 flex gap-3 justify-center shrink-0">
            <button type="button" class="ds-btn ds-btn-secondary" (click)="closeModal()">Cancelar</button>
            <button
              type="button"
              class="ds-btn ds-btn-primary"
              [disabled]="!modalStatus() || isSubmitting()"
              [class.ds-btn-disabled]="!modalStatus() || isSubmitting()"
              (click)="confirmStatusChange()"
            >
              {{ isSubmitting() ? 'Guardando...' : 'Confirmar' }}
            </button>
          </div>

        </div>
      </div>
    }
  `,
})
export class EventAttendeesAdminPage implements OnInit {
  constructor() { inject(PageHelpService).set(getAdminEventAttendeesHelp(inject(ContextStore).scopeType())); }

  private readonly route = inject(ActivatedRoute);
  private readonly eventsApi = inject(EventsApiService);
  private readonly userEventsApi = inject(UserEventsApiService);
  private readonly location = inject(Location);

  readonly isLoading = signal(true);
  readonly eventTitle = signal<string | null>(null);
  readonly attendees = signal<UserEventDTO[]>([]);
  readonly showModal = signal(false);
  readonly selectedAttendee = signal<UserEventDTO | null>(null);
  readonly modalStatus = signal<string>('');
  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly statusOptions = STATUS_OPTIONS;

  readonly columns: AdminTableColumn[] = [
    { key: 'name',       label: 'Nombre' },
    { key: 'username',   label: 'Usuario' },
    { key: 'email',      label: 'Email' },
    { key: 'statusDate', label: 'Fecha solicitud', type: 'date',  align: 'center' },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      align: 'center',
      badgeConfig: { '1': 'ds-badge-warning', '2': 'ds-badge-success', '3': 'ds-badge-error' },
      badgeLabels: { '1': 'Solicitud pendiente', '2': 'Admitido', '3': 'Rechazado' },
    },
  ];

  readonly actions: AdminTableAction[] = [
    { label: 'Cambiar', action: 'cambiar' },
  ];

  readonly tableData = computed(() =>
    this.attendees().map((att) => ({
      _id: att.id,
      name: att.user.name,
      username: att.user.username,
      email: att.user.email ?? '',
      statusDate: att.statusDate,
      status: String(att.status),
    }))
  );

  private eventId!: number;

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('eventId');
    this.eventId = Number(rawId);

    if (!rawId || isNaN(this.eventId)) {
      this.errorMessage.set('ID de evento no válido.');
      this.isLoading.set(false);
      return;
    }

    this.eventsApi.getById(this.eventId).subscribe({
      next: (e) => this.eventTitle.set(e.title),
    });

    this.userEventsApi.getByEvent(this.eventId).subscribe({
      next: (list) => {
        this.attendees.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar la lista de inscripciones.');
        this.isLoading.set(false);
      },
    });
  }

  onAction(event: { action: string; row: any }): void {
    if (event.action !== 'cambiar') return;
    const att = this.attendees().find((a) => a.id === event.row['_id']);
    if (!att) return;
    this.selectedAttendee.set(att);
    this.modalStatus.set('');
    this.showModal.set(true);
  }

  onModalStatusChange(event: Event): void {
    this.modalStatus.set((event.target as HTMLSelectElement).value);
  }

  confirmStatusChange(): void {
    const att = this.selectedAttendee();
    const newStatus = Number(this.modalStatus()) as 1 | 2 | 3;
    if (!att || !newStatus) return;

    this.isSubmitting.set(true);

    this.userEventsApi.updateStatus(att.id, newStatus).subscribe({
      next: (updated) => {
        this.attendees.update((list) =>
          list.map((a) => (a.id === att.id ? updated : a))
        );
        this.isSubmitting.set(false);
        this.closeModal();
        this.successMessage.set(
          `Estado de ${att.user.name} actualizado correctamente.`
        );
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('No se pudo actualizar el estado. Inténtalo de nuevo.');
      },
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedAttendee.set(null);
    this.modalStatus.set('');
  }

  statusBadgeClass(status: 1 | 2 | 3): string {
    if (status === 1) return 'ds-badge-warning';
    if (status === 2) return 'ds-badge-success';
    return 'ds-badge-error';
  }

  goBack(): void {
    this.location.back();
  }
}
