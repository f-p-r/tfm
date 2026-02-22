import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';

import { ContextStore } from '../../core/context/context.store';
import { WebScope } from '../../core/web-scope.constants';
import { EventsApiService } from '../../core/events/events-api.service';
import { EventSummaryDTO, EventListParams } from '../../core/events/event.models';
import { AssociationsResolveService } from '../../core/associations/associations-resolve.service';
import { GamesStore } from '../../core/games/games.store';
import { PageHelpService } from '../../shared/help/page-help.service';
import { getEventsListHelp } from '../../shared/help/page-content/events-list.help';

/**
 * Página pública de listado de eventos.
 *
 * Filtrado según scope del contexto:
 * - GLOBAL:      todos los eventos publicados y activos
 * - GAME:        los que tienen gameId = scopeId
 * - ASSOCIATION: los que tienen scopeType=ASSOCIATION y scopeId del contexto
 *
 * Solo se muestran eventos con active=true y published=true.
 * Si el usuario está autenticado, se muestra el estado de su asistencia en cada evento.
 */
@Component({
  selector: 'app-events-list-page',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="ds-container">
      <header class="border-b border-neutral-medium pb-4 pt-6">
        <h1 class="h1">{{ pageTitle() }}</h1>
        <p class="text-neutral-dark mt-3 leading-relaxed">
          Consulta los próximos eventos y torneos.
        </p>
      </header>

      <section class="mt-6">
        @if (loading()) {
          <p class="text-neutral-dark">Cargando...</p>
        } @else if (error()) {
          <p class="text-red-600">Error al cargar eventos: {{ error() }}</p>
        } @else if (eventList().length === 0) {
          <p class="text-neutral-dark">No hay eventos disponibles.</p>
        } @else {
          <div class="ds-cards-container">
            @for (event of eventList(); track event.id) {
              <article class="ds-card">
                <!-- Header: clicable si tiene contenido enriquecido -->
                <div
                  [class]="'ds-card-assoc-header' + (event.hasContent ? ' ds-card-news-header-linked' : '')"
                  [routerLink]="event.hasContent ? ['/eventos', event.id, event.slug] : null"
                >
                  <span class="ds-card-news-title">{{ event.title }}</span>
                </div>

                <div class="ds-card-body">
                  <!-- Primera línea: badge de asistencia + inscripción abierta -->
                  @if (event.myAttendance || event.registrationOpen) {
                    <div class="flex flex-wrap items-center gap-2">
                      @if (event.myAttendance) {
                        <span [class]="'ds-badge ' + attendanceBadgeClass(event.myAttendance.status)">
                          {{ event.myAttendance.statusType.name }}
                        </span>
                      }
                      @if (event.registrationOpen) {
                        <span class="ds-badge ds-badge-active">Inscripción abierta</span>
                      }
                    </div>
                  }

                  <!-- Fechas y badges de juego / asociación -->
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <div class="flex items-baseline gap-x-2">
                      <span class="ds-card-label">Inicio:</span>
                      <span class="ds-card-text">
                        {{ event.startsAt | date:'dd/MM/yyyy' }}
                      </span>
                    </div>
                    @if (event.endsAt) {
                      <div class="flex items-baseline gap-x-2">
                        <span class="ds-card-label">Fin:</span>
                        <span class="ds-card-text">
                          {{ event.endsAt | date:'dd/MM/yyyy' }}
                        </span>
                      </div>
                    }
                    @if (event.game) {
                      <span class="ds-badge ds-badge-game">{{ event.game.name }}</span>
                    }
                    @if (event.scopeType === WebScope.ASSOCIATION && event.scopeId) {
                      <span class="ds-badge ds-badge-association">
                        {{ getAssociationLabel(event.scopeId) }}
                      </span>
                    }
                  </div>

                  <!-- Localización -->
                  @if (event.municipalityName || event.region || event.country) {
                    <div class="ds-card-section">
                      <a
                        [href]="mapsUrl(event)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="ds-card-link"
                      >
                        📍
                        @if (event.municipalityName) { {{ event.municipalityName }}{{ event.region ? ', ' : '' }} }
                        @if (event.region) { {{ event.region.name }}{{ event.country ? ' — ' : '' }} }
                        @if (event.country) { {{ event.country.name }} }
                      </a>
                    </div>
                  }

                  <!-- Texto descriptivo -->
                  @if (event.text) {
                    <div class="ds-card-section">
                      <p class="ds-card-text">
                        {{ event.text }}
                        @if (event.hasContent) {
                          <a [routerLink]="['/eventos', event.id, event.slug]" class="ds-card-news-ellipsis">&#8230;</a>
                        }
                      </p>
                    </div>
                  }
                </div>
              </article>
            }
          </div>
        }
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsListPage {
  private readonly eventsApi = inject(EventsApiService);
  private readonly associationsResolve = inject(AssociationsResolveService);
  readonly contextStore = inject(ContextStore);
  readonly gameStore = inject(GamesStore);

  readonly WebScope = WebScope;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly eventList = signal<EventSummaryDTO[]>([]);

  /** Mapa id → label para asociaciones resueltas */
  private readonly associationNames = signal<Map<number, string>>(new Map());

  readonly pageTitle = computed(() => {
    const scopeType = this.contextStore.scopeType();
    const scopeId = this.contextStore.scopeId();

    if (scopeType === WebScope.GAME && scopeId) {
      const game = this.gameStore.getById(scopeId);
      return game ? `Eventos de ${game.name}` : 'Eventos';
    }

    if (scopeType === WebScope.ASSOCIATION && scopeId) {
      const assoc = this.associationsResolve.getById(scopeId);
      return assoc ? `Eventos de ${assoc.shortname ?? assoc.name}` : 'Eventos';
    }

    return 'Eventos';
  });

  constructor() {
    inject(PageHelpService).set(getEventsListHelp(inject(ContextStore).scopeType()));
    effect(() => {
      const scopeType = this.contextStore.scopeType();
      const scopeId = this.contextStore.scopeId();

      this.loading.set(true);
      this.error.set(null);
      this.eventList.set([]);

      // Construir parámetros de filtrado según scope + active=true siempre
      let params: EventListParams = { active: true };

      if (scopeType === WebScope.GAME && scopeId) {
        params = { ...params, gameId: scopeId };
      } else if (scopeType === WebScope.ASSOCIATION && scopeId) {
        params = { ...params, scopeType: WebScope.ASSOCIATION, scopeId };
      }
      // GLOBAL: solo active: true

      this.eventsApi.list(params).subscribe({
        next: (items) => {
          // El API ya ordena por starts_at ascendente (más próximos primero)
          this.eventList.set(items);
          this.loading.set(false);
          this.resolveAssociationNames(items);
        },
        error: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Error desconocido';
          this.error.set(msg);
          this.loading.set(false);
        },
      });
    });
  }

  /** Construye una URL de búsqueda en Google Maps con los datos de ubicación del evento */
  mapsUrl(event: EventSummaryDTO): string {
    const parts: string[] = [];
    if (event.streetName) {
      parts.push(event.streetNumber ? `${event.streetName} ${event.streetNumber}` : event.streetName);
    }
    if (event.municipalityName) parts.push(event.municipalityName);
    if (event.provinceName && event.provinceName !== event.municipalityName) parts.push(event.provinceName);
    if (event.region) parts.push(event.region.name);
    if (event.country) parts.push(event.country.name);
    const query = encodeURIComponent(parts.join(', '));
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  /** Clase CSS del badge de asistencia según el status */
  attendanceBadgeClass(status: 1 | 2 | 3): string {
    switch (status) {
      case 1: return 'ds-badge-warning';
      case 2: return 'ds-badge-success';
      case 3: return 'ds-badge-error';
    }
  }

  /** Devuelve el label de la asociación para el badge, o el id como fallback */
  getAssociationLabel(scopeId: number): string {
    return this.associationNames().get(scopeId) ?? `Asociación #${scopeId}`;
  }

  /**
   * Resuelve de forma asíncrona los nombres de las asociaciones
   * referenciadas en la lista.
   */
  private resolveAssociationNames(items: EventSummaryDTO[]): void {
    const ids = [
      ...new Set(
        items
          .filter((e) => e.scopeType === WebScope.ASSOCIATION && e.scopeId !== null)
          .map((e) => e.scopeId as number),
      ),
    ];

    if (ids.length === 0) return;

    const namesMap = new Map<number, string>();
    const toFetch: number[] = [];

    for (const id of ids) {
      const cached = this.associationsResolve.getById(id);
      if (cached) {
        namesMap.set(id, cached.shortname ?? cached.name);
      } else {
        toFetch.push(id);
      }
    }

    if (toFetch.length === 0) {
      this.associationNames.set(namesMap);
      return;
    }

    const requests = Object.fromEntries(
      toFetch.map((id) => [id, this.associationsResolve.resolveById(id)]),
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        for (const [idStr, assoc] of Object.entries(results)) {
          namesMap.set(Number(idStr), assoc.shortname ?? assoc.name);
        }
        this.associationNames.set(new Map(namesMap));
      },
      error: () => {
        this.associationNames.set(new Map(namesMap));
      },
    });
  }
}
