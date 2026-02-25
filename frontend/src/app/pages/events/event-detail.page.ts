import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';

import { WebScope } from '../../core/web-scope.constants';
import { EventsApiService } from '../../core/events/events-api.service';
import { EventDTO, EventAttendanceDTO } from '../../core/events/event.models';
import { UserEventsApiService } from '../../core/events/user-events-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { AssociationsResolveService } from '../../core/associations/associations-resolve.service';
import { ContentRendererComponent } from '../../shared/content/content-renderer/content-renderer.component';

@Component({
  selector: 'app-event-detail-page',
  imports: [DatePipe, ContentRendererComponent, RouterLink],
  template: `
    <div class="ds-container">
      <div class="pt-6 pb-10">

        @if (loading()) {
          <p class="text-neutral-dark">Cargando...</p>
        } @else if (error()) {
          <p class="text-red-600">{{ error() }}</p>
        } @else if (event(); as e) {

          <!-- Cabecera: título + botón cerrar -->
          <header class="flex items-start gap-16 border-b border-neutral-medium pb-4 mb-6">
            <h1 class="h1">{{ e.title }}</h1>
            <button
              type="button"
              class="ds-btn-close shrink-0 mt-1"
              aria-label="Cerrar"
              (click)="goBack()"
            ><span class="material-symbols-outlined text-base">close</span></button>
          </header>

          <!-- Metadatos + estado de asistencia / botón de inscripción -->
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">

            <!-- Fechas -->
            <div class="flex items-baseline gap-x-2">
              <span class="ds-card-label">Inicio:</span>
              <span class="ds-card-text">{{ e.startsAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            @if (e.endsAt) {
              <div class="flex items-baseline gap-x-2">
                <span class="ds-card-label">Fin:</span>
                <span class="ds-card-text">{{ e.endsAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            }

            <!-- Ubicación (en la misma línea) -->
            @if (locationLabel(e)) {
              <a
                [href]="mapsUrl(e)"
                target="_blank"
                rel="noopener noreferrer"
                class="ds-card-link"
              >📍 {{ locationLabel(e) }}</a>
            }

            <!-- Juego -->
            @if (e.game) {
              <span class="ds-badge ds-badge-game">{{ e.game.name }}</span>
            }

            <!-- Asociación -->
            @if (e.scopeType === WebScope.ASSOCIATION && e.scopeId) {
              <span class="ds-badge ds-badge-association">{{ associationLabel() }}</span>
            }

            <!-- Estado de asistencia o botón de inscripción -->
            @if (attendance(); as att) {
              <span [class]="'ds-badge ' + attendanceBadgeClass(att.status)">
                {{ att.statusType.name }}
              </span>
            } @else if (e.registrationOpen) {
              <button
                type="button"
                class="ds-btn-sm ds-btn-primary"
                [disabled]="enrolling()"
                (click)="requestAttendance(e.id)"
              >
                {{ enrolling() ? 'Enviando...' : 'Solicitar inscripción' }}
              </button>
            } @else {
              <span class="ds-badge ds-badge-inactive">Inscripción no disponible</span>
            }

          </div>

          <!-- Organizado por -->
          <div class="flex items-center gap-x-3 mb-6">
            <span class="ds-card-label">Organizado por:</span>
            <span class="ds-card-text">{{ organizerInfo().name }}</span>
            <a [routerLink]="organizerInfo().url" class="ds-btn ds-btn-primary ds-btn-sm">Contactar</a>
          </div>

          <!-- Mensajes de feedback de inscripción -->
          @if (enrollSuccess()) {
            <div class="ds-alert ds-alert-success ds-alert-autofade mb-6">
              <p>Tu solicitud de inscripción ha sido enviada correctamente.</p>
              <p class="mt-1">Recibirás confirmación en tu correo electrónico.</p>
            </div>
          }
          @if (enrollError()) {
            <p class="ds-error mb-6">{{ enrollError() }}</p>
          }

          <!-- Contenido enriquecido -->
          @if (e.content) {
            <app-content-renderer [content]="e.content" />
          }

        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventsApi = inject(EventsApiService);
  private readonly userEventsApi = inject(UserEventsApiService);
  private readonly associationsResolve = inject(AssociationsResolveService);
  private readonly location = inject(Location);

  private readonly authService = inject(AuthService);
  readonly WebScope = WebScope;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly event = signal<EventDTO | null>(null);

  /** Asistencia actual del usuario (sincronizada con el evento o actualizada tras inscripción) */
  readonly attendance = signal<EventAttendanceDTO | null>(null);

  readonly enrolling = signal(false);
  readonly enrollError = signal<string | null>(null);
  readonly enrollSuccess = signal(false);

  /** Label de la asociación, resuelto del caché o de forma asíncrona */
  readonly associationLabel = computed<string>(() => {
    const e = this.event();
    if (!e || e.scopeType !== WebScope.ASSOCIATION || !e.scopeId) return '';
    const cached = this.associationsResolve.getById(e.scopeId);
    if (cached) return cached.shortname ?? cached.name;
    this.associationsResolve.resolveById(e.scopeId).subscribe(() => {
      this.event.update((v) => (v ? { ...v } : v));
    });
    return `Asociación #${e.scopeId}`;
  });

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const numId = Number(rawId);

    if (!rawId || isNaN(numId)) {
      this.error.set('ID de evento no válido.');
      this.loading.set(false);
      return;
    }

    this.eventsApi.getById(numId).subscribe({
      next: (e) => {
        this.event.set(e);
        this.attendance.set(e.myAttendance);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error al cargar el evento.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  /** Envía la solicitud de inscripción al evento */
  requestAttendance(eventId: number): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.enrolling.set(true);
    this.enrollError.set(null);

    this.userEventsApi.requestAttendance(user.id!, eventId).subscribe({
      next: (result) => {
        this.attendance.set({
          id: result.id,
          status: result.status,
          statusDate: result.statusDate,
          statusType: result.statusType,
        });
        this.enrollSuccess.set(true);
        this.enrolling.set(false);
        setTimeout(() => this.enrollSuccess.set(false), 5000);
      },
      error: () => {
        this.enrollError.set('No se pudo enviar la solicitud. Inténtalo de nuevo.');
        this.enrolling.set(false);
      },
    });
  }

  /** Clase CSS del badge de asistencia según el status */
  attendanceBadgeClass(status: 1 | 2 | 3): string {
    switch (status) {
      case 1: return 'ds-badge-warning';
      case 2: return 'ds-badge-success';
      case 3: return 'ds-badge-error';
    }
  }

  /** Nombre y URL del organizador del evento */
  readonly organizerInfo = computed<{ name: string; url: string }>(() => {
    const e = this.event();
    if (e?.scopeType === WebScope.ASSOCIATION && e.scopeId) {
      const assoc = this.associationsResolve.getById(e.scopeId);
      const name = assoc?.name ?? `Asociación #${e.scopeId}`;
      const slug = assoc?.slug ?? '';
      return { name, url: slug ? `/asociaciones/${slug}/contacto` : '/contacto' };
    }
    return { name: 'Naipeando', url: '/contacto' };
  });

  /** Etiqueta corta de ubicación para mostrar junto a las fechas */
  locationLabel(e: EventDTO): string {
    if (e.streetName) {
      const street = e.streetNumber ? `${e.streetName} ${e.streetNumber}` : e.streetName;
      const parts = [street];
      if (e.municipalityName) parts.push(e.municipalityName);
      if (e.provinceName && e.provinceName !== e.municipalityName) parts.push(e.provinceName);
      return parts.join(', ');
    }
    if (e.municipalityName) {
      return e.provinceName && e.provinceName !== e.municipalityName
        ? `${e.municipalityName}, ${e.provinceName}`
        : e.municipalityName;
    }
    return '';
  }

  /** Construye URL de Google Maps con los campos de ubicación disponibles */
  mapsUrl(e: EventDTO): string {
    const parts: string[] = [];
    if (e.streetName) {
      parts.push(e.streetNumber ? `${e.streetName} ${e.streetNumber}` : e.streetName);
    }
    if (e.municipalityName) parts.push(e.municipalityName);
    if (e.provinceName && e.provinceName !== e.municipalityName) parts.push(e.provinceName);
    if (e.region) parts.push(e.region.name);
    if (e.country) parts.push(e.country.name);
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`;
  }

  goBack(): void {
    this.location.back();
  }
}
