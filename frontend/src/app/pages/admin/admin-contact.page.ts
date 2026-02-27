/**
 * Página de administración de información de contacto.
 *
 * Muestra la lista de contactos configurados para el contexto actual con:
 * - Visualización en tabla paginada
 * - Creación de nuevos contactos
 * - Edición de contactos existentes mediante modal
 * - Eliminación de contactos con confirmación
 * - Validación de límites por tipo de contacto
 *
 * Funciona en scope Global, Asociación o Juego según el contexto activo.
 */

import { ChangeDetectionStrategy, Component, inject, signal, computed, viewChild } from '@angular/core';
import { AdminSidebarContainerComponent } from '../../components/admin-sidebar/admin-sidebar-container.component';
import { AdminPageSubtitleComponent } from '../../components/core/admin/admin-page-subtitle/admin-page-subtitle.component';
import { AdminTableComponent } from '../../components/core/admin/table/admin-table.component';
import { AdminTableColumn, AdminTableAction } from '../../components/core/admin/table/admin-table.model';
import { ContactApiService } from '../../core/contact/contact-api.service';
import { ContactEditModalComponent } from '../../components/core/admin/contact-edit-modal/contact-edit-modal.component';
import { ContactInfo, CreateContactInfo } from '../../core/contact/contact.models';
import { ContextStore } from '../../core/context/context.store';
import { CONTACT_TYPES, CONTACT_CATEGORIES } from '../../core/contact/contact.constants';
import { WebScope } from '../../core/web-scope.constants';
import { PageHelpService } from '../../shared/help/page-help.service';
import { getAdminContactHelp } from '../../shared/help/page-content/admin-contact.help';

@Component({
  selector: 'app-admin-contact-page',
  imports: [
    AdminSidebarContainerComponent,
    AdminPageSubtitleComponent,
    AdminTableComponent,
    ContactEditModalComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Shell de administración -->
    <div class="ds-admin-shell">

      <!-- Sidebar -->
      <app-admin-sidebar-container />

      <!-- Contenido principal -->
      <main class="ds-admin-main ds-container">
        <div class="flex-1 flex flex-col min-h-0">

          <!-- Cabecera de página -->
          <div class="flex items-start justify-between gap-4 py-6">
            <div>
              <h2 class="h2">Gestión de Contactos</h2>
              <app-admin-page-subtitle />
            </div>
            <button class="ds-btn ds-btn-primary mt-1" (click)="onCreateContact()">
              Crear contacto
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
              [data]="contacts()"
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
      <app-contact-edit-modal
        [mode]="modalMode()"
        [ownerType]="ownerType()"
        [ownerId]="ownerId()"
        [contactData]="selectedContact()"
        [existingContacts]="contacts()"
        (save)="onSaveContact($event)"
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
              ¿Estás seguro de que deseas eliminar el contacto <strong>"{{ getContactLabel(contactToDelete()) }}"</strong>?
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
export class AdminContactPage {
  private readonly contactApi = inject(ContactApiService);
  private readonly contextStore = inject(ContextStore);

  // Datos del contexto
  protected readonly ownerType = computed(() => this.contextStore.scopeType() ?? WebScope.GLOBAL);
  protected readonly ownerId = computed(() => this.contextStore.scopeId());
  protected readonly scopeName = computed(() => {
    const type = this.ownerType();
    switch (type) {
      case WebScope.GLOBAL: return 'Naipeando';
      case WebScope.ASSOCIATION: return 'esta asociación';
      case WebScope.GAME: return 'este juego';
      default: return 'el contexto actual';
    }
  });

  // Datos locales
  protected readonly contacts = signal<ContactInfo[]>([]);

  // Modal de edición
  protected readonly showModal = signal(false);
  protected readonly modalMode = signal<'create' | 'edit'>('edit');
  protected readonly selectedContact = signal<ContactInfo | null>(null);
  private readonly modalComponent = viewChild(ContactEditModalComponent);

  // Modal de confirmación de eliminación
  protected readonly showDeleteConfirmation = signal(false);
  protected readonly contactToDelete = signal<ContactInfo | null>(null);
  protected readonly isDeleting = signal(false);

  // Mensajes
  protected readonly confirmationMessage = signal<string | null>(null);
  protected readonly generalError = signal<string | null>(null);

  // Estado de carga
  protected readonly isLoading = signal(false);

  // Tamaño de página para la tabla
  protected readonly pageSize = 20;

  // Configuración de columnas
  protected readonly columns: AdminTableColumn[] = [
    { key: 'contact_type', label: 'Tipo', type: 'text', align: 'left' },
    { key: 'value', label: 'Valor', type: 'text', align: 'left' },
    { key: 'category_label', label: 'Categoría', type: 'text', align: 'left' },
    { key: 'label', label: 'Etiqueta', type: 'text', align: 'left' },
    { key: 'order', label: 'Orden', type: 'text', align: 'center' },
    { key: 'is_public', label: 'Público', type: 'text', align: 'center' }
  ];

  // Acciones disponibles
  protected readonly actions: AdminTableAction[] = [
    { action: 'edit', label: 'Modificar' },
    { action: 'delete', label: 'Eliminar'}
  ];

  constructor() {
    inject(PageHelpService).set(getAdminContactHelp(inject(ContextStore).scopeType()));
    // Cargar contactos al inicializar
    this.loadContacts();
  }

  private loadContacts() {
    const ownerType = this.ownerType();
    const ownerId = this.ownerId();

    this.isLoading.set(true);
    this.generalError.set(null);

    this.contactApi.getAll({ owner_type: ownerType, owner_id: ownerId || undefined }).subscribe({
      next: (contacts) => {
        this.contacts.set(contacts);
        this.isLoading.set(false);
      },
      error: (errorResponse) => {
        this.isLoading.set(false);
        this.handleHttpError(errorResponse);
      }
    });
  }

  protected onCreateContact() {
    this.modalMode.set('create');
    this.selectedContact.set(null);
    this.showModal.set(true);
  }

  protected onAction(event: { action: string; row: ContactInfo }) {
    if (event.action === 'edit') {
      this.modalMode.set('edit');
      this.selectedContact.set(event.row);
      this.showModal.set(true);
    } else if (event.action === 'delete') {
      this.contactToDelete.set(event.row);
      this.showDeleteConfirmation.set(true);
    }
  }

  protected onSaveContact(data: CreateContactInfo) {
    const modal = this.modalComponent();
    if (!modal) return;

    const selectedContact = this.selectedContact();
    const isEdit = this.modalMode() === 'edit' && selectedContact;

    const operation = isEdit
      ? this.contactApi.update(selectedContact.id, data)
      : this.contactApi.create(data);

    const actionText = isEdit ? 'modificado' : 'creado';

    operation.subscribe({
      next: (response) => {
        // Verificar si es error
        if ('errors' in response && response.errors) {
          const errorsList = response.errorsList || {};
          const formattedErrors: Record<string, string[]> = {};
          Object.entries(errorsList).forEach(([key, value]) => {
            formattedErrors[key] = [value as string];
          });
          modal.setServerErrors(formattedErrors);
          return;
        }

        // Éxito
        modal.resetSaving();
        this.showModal.set(false);
        this.selectedContact.set(null);

        const label = this.getContactLabel(response as ContactInfo);
        this.confirmationMessage.set(`Contacto "${label}" ${actionText} correctamente`);
        setTimeout(() => this.confirmationMessage.set(null), 4000);

        this.loadContacts();
      },
      error: (errorResponse) => {
        // Formato Laravel 422: {message: "...", errors: {field: ["error1", "error2"]}}
        if (errorResponse.status === 422 && errorResponse.error?.errors) {
          modal.setServerErrors(errorResponse.error.errors);
        }
        // Error genérico
        else {
          const errorMsg = errorResponse.error?.message || `Error al ${isEdit ? 'guardar' : 'crear'} el contacto`;
          modal.setServerErrors({ general: [errorMsg] });
        }
      }
    });
  }

  protected onCancelModal() {
    this.showModal.set(false);
    this.selectedContact.set(null);
  }

  protected onCancelDelete() {
    this.showDeleteConfirmation.set(false);
    this.contactToDelete.set(null);
  }

  protected onConfirmDelete() {
    const contact = this.contactToDelete();
    if (!contact) return;

    this.isDeleting.set(true);

    this.contactApi.delete(contact.id).subscribe({
      next: () => {
        this.showDeleteConfirmation.set(false);
        this.contactToDelete.set(null);
        this.isDeleting.set(false);

        const label = this.getContactLabel(contact);
        this.confirmationMessage.set(`Contacto "${label}" eliminado correctamente`);
        setTimeout(() => this.confirmationMessage.set(null), 4000);

        this.loadContacts();
      },
      error: (errorResponse) => {
        this.isDeleting.set(false);
        this.showDeleteConfirmation.set(false);
        this.contactToDelete.set(null);

        this.handleHttpError(errorResponse);
      }
    });
  }

  protected getContactLabel(contact: ContactInfo | null): string {
    if (!contact) return '';
    const typeLabel = CONTACT_TYPES[contact.contact_type]?.label || contact.contact_type;
    return contact.label || `${typeLabel}: ${contact.value}`;
  }

  private handleHttpError(errorResponse: any): void {
    // Error con mensaje
    if (errorResponse.error?.message) {
      this.generalError.set(errorResponse.error.message);
    }
    // Error genérico
    else {
      this.generalError.set('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
    }

    // Auto-ocultar después de 5 segundos
    setTimeout(() => this.generalError.set(null), 5000);
  }
}
