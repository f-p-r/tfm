import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ContactApiService } from '../../core/contact/contact-api.service';
import { ContactInfo } from '../../core/contact/contact.models';
import { ContactCardComponent } from '../../shared/contact/contact-card.component';

/**
 * Página de contacto global (Naipeando).
 *
 * Muestra información de contacto de Naipeando.
 */
@Component({
  selector: 'app-contact-page',
  imports: [ContactCardComponent],
  template: `
    <div class="ds-container py-8">
      <header class="border-b border-neutral-medium pb-4">
        <div class="flex justify-between items-start">
          <div>
            <h1 class="h1 text-brand-primary">Contacto</h1>
            <p class="text-sm text-neutral-dark mt-1">Naipeando</p>
          </div>
          <button class="ds-btn ds-btn-secondary" (click)="onGoBack()">
            Volver
          </button>
        </div>
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
export class ContactPage implements OnInit {
  private readonly contactApi = inject(ContactApiService);
  private readonly location = inject(Location);

  readonly contacts = signal<ContactInfo[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadContacts();
  }

  protected onGoBack(): void {
    this.location.back();
  }

  private loadContacts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.contactApi.getGlobal().subscribe({
      next: (contacts) => {
        this.contacts.set(contacts);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading global contacts:', err);
        this.error.set('No se pudo cargar la información de contacto');
        this.loading.set(false);
      },
    });
  }
}
