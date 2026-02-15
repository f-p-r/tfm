import { ChangeDetectionStrategy, Component, inject, computed, signal, effect } from '@angular/core';
import { ContextStore } from '../../../core/context/context.store';
import { AssociationsResolveService } from '../../../core/associations/associations-resolve.service';
import { ContactApiService } from '../../../core/contact/contact-api.service';
import { ContactInfo } from '../../../core/contact/contact.models';
import { ContactCardComponent } from '../../../shared/contact/contact-card.component';

/**
 * Página de contacto de una asociación.
 *
 * Muestra información de contacto de la asociación actual.
 */
@Component({
  selector: 'app-association-contact-page',
  imports: [ContactCardComponent],
  template: `
    <div class="ds-container py-8">
      <header class="border-b border-neutral-medium pb-4">
        <h1 class="h1 text-brand-primary">Contacto</h1>
        @if (associationName()) {
          <p class="text-sm text-neutral-dark mt-1">{{ associationName() }}</p>
        }
      </header>

      <section class="mt-8">
        @if (loading()) {
          <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent"></div>
            <p class="text-neutral-medium mt-4">Cargando información de contacto...</p>
          </div>
        } @else if (error()) {
          <div class="ds-alert ds-alert-error">
            {{ error() }}
          </div>
        } @else {
          <app-contact-card [contacts]="contacts()" />
        }
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationContactPage {
  private readonly contextStore = inject(ContextStore);
  private readonly associationsResolve = inject(AssociationsResolveService);
  private readonly contactApi = inject(ContactApiService);

  readonly associationName = computed(() => {
    const scopeId = this.contextStore.scopeId();
    if (scopeId) {
      const association = this.associationsResolve.getById(scopeId);
      return association?.name;
    }
    return '';
  });

  readonly contacts = signal<ContactInfo[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    // Cargar contactos cuando cambia la asociación
    effect(() => {
      const associationId = this.contextStore.scopeId();
      if (associationId) {
        this.loadContacts(associationId);
      }
    });
  }

  private loadContacts(associationId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.contactApi.getByAssociation(associationId).subscribe({
      next: (contacts) => {
        this.contacts.set(contacts);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading contacts:', err);
        this.error.set('No se pudo cargar la información de contacto');
        this.loading.set(false);
      },
    });
  }
}
