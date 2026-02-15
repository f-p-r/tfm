import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { ContactInfo, GroupedContacts } from '../../core/contact/contact.models';
import { CONTACT_CATEGORIES, CONTACT_TYPES, buildContactUrl, getContactActionLabel } from '../../core/contact/contact.constants';
import { ContactIconComponent } from './contact-icon.component';

/**
 * Componente para mostrar una tarjeta completa de información de contacto.
 *
 * Organiza los contactos en dos secciones:
 * 1. Canales de contacto: Emails, teléfonos, WhatsApp (agrupados por categoría)
 * 2. Redes sociales: Grid horizontal con iconos
 *
 * @example
 * <app-contact-card [contacts]="contacts()" />
 */
@Component({
  selector: 'app-contact-card',
  imports: [ContactIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      <!-- Sección: Canales de contacto -->
      @if (groupedContacts().length > 0) {
        <section>
          <h2 class="text-lg font-semibold text-brand-primary mb-4 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            Canales de contacto
          </h2>

          <div class="space-y-6">
            @for (group of groupedContacts(); track group.category) {
              <div class="border-l-2 border-brand-primary pl-4">
                <h3 class="text-sm font-medium text-brand-primary uppercase tracking-wide mb-3">
                  {{ group.label }}
                </h3>
                <div class="space-y-2">
                  @for (contact of group.items; track contact.id) {
                    <div class="flex items-start gap-3">
                      <app-contact-icon
                        [contactType]="contact.contact_type"
                        class="w-5 h-5 text-brand-primary shrink-0 mt-0.5"
                      />
                      <div class="flex-1 min-w-0">
                        @if (contact.label) {
                          <div class="text-xs text-neutral-medium mb-1">{{ contact.label }}</div>
                        }
                        @if (getContactUrl(contact); as url) {
                          <a
                            [href]="url"
                            class="text-neutral-dark hover:text-brand-primary hover:underline break-all"
                            [attr.target]="contact.contact_type === 'email' || contact.contact_type === 'phone' ? null : '_blank'"
                            [attr.rel]="contact.contact_type === 'email' || contact.contact_type === 'phone' ? null : 'noopener noreferrer'"
                          >
                            {{ contact.value }}
                          </a>
                        } @else {
                          <span class="text-neutral-dark">{{ contact.value }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- Sección: Redes sociales -->
      @if (socialContacts().length > 0) {
        <section>
          <h2 class="text-lg font-semibold text-brand-primary mb-4 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            Redes sociales
          </h2>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            @for (contact of socialContacts(); track contact.id) {
              <a
                [href]="getContactUrl(contact) || '#'"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-3 px-4 py-3 bg-neutral-light hover:bg-neutral-medium rounded-lg transition-colors group"
              >
                <app-contact-icon
                  [contactType]="contact.contact_type"
                  class="w-6 h-6 text-neutral-dark group-hover:text-brand-primary shrink-0"
                />
                <span class="text-sm font-medium text-neutral-dark group-hover:text-brand-primary">
                  {{ getContactLabel(contact) }}
                </span>
              </a>
            }
          </div>
        </section>
      }

      <!-- Mensaje si no hay contactos -->
      @if (groupedContacts().length === 0 && socialContacts().length === 0) {
        <div class="text-center py-8 text-neutral-medium">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
          <p>No hay información de contacto disponible.</p>
        </div>
      }
    </div>
  `,
})
export class ContactCardComponent {
  /** Lista de contactos a mostrar */
  readonly contacts = input.required<ContactInfo[]>();

  /** Contactos agrupados por categoría (emails, teléfonos, whatsapp) */
  protected readonly groupedContacts = computed<GroupedContacts[]>(() => {
    const allContacts = this.contacts();

    // Filtrar solo emails, phones y whatsapp
    const channelContacts = allContacts.filter(c =>
      c.contact_type === 'email' ||
      c.contact_type === 'phone' ||
      c.contact_type === 'whatsapp'
    );

    // Agrupar por categoría
    const groups = new Map<string, ContactInfo[]>();

    channelContacts.forEach(contact => {
      const cat = contact.category || 'general';
      if (!groups.has(cat)) {
        groups.set(cat, []);
      }
      groups.get(cat)!.push(contact);
    });

    // Convertir a array ordenado
    return Array.from(groups.entries())
      .map(([category, items]) => ({
        category: category as any,
        label: CONTACT_CATEGORIES[category as keyof typeof CONTACT_CATEGORIES] || category,
        items: items.sort((a, b) => a.order - b.order),
      }))
      .sort((a, b) => {
        // Ordenar categorías: support, membership, events, general, otros
        const order = ['support', 'membership', 'events', 'general', 'press', 'admin', 'other'];
        return order.indexOf(a.category) - order.indexOf(b.category);
      });
  });

  /** Contactos de redes sociales */
  protected readonly socialContacts = computed(() => {
    return this.contacts()
      .filter(c =>
        !['email', 'phone', 'whatsapp', 'address', 'web'].includes(c.contact_type)
      )
      .sort((a, b) => a.order - b.order);
  });

  /**
   * Obtiene la URL de acción para un contacto.
   */
  protected getContactUrl(contact: ContactInfo): string | null {
    return buildContactUrl(contact.contact_type, contact.value);
  }

  /**
   * Obtiene la etiqueta para mostrar en redes sociales.
   */
  protected getContactLabel(contact: ContactInfo): string {
    return CONTACT_TYPES[contact.contact_type].label;
  }
}
