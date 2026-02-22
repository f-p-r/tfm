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
import { forkJoin, of } from 'rxjs';

import { ContextStore } from '../../core/context/context.store';
import { WebScope } from '../../core/web-scope.constants';
import { NewsApiService } from '../../core/news/news-api.service';
import { NewsSummaryDTO } from '../../core/news/news.models';
import { AssociationsResolveService } from '../../core/associations/associations-resolve.service';
import { GamesStore } from '../../core/games/games.store';
import { PageHelpService } from '../../shared/help/page-help.service';
import { getNewsListHelp } from '../../shared/help/page-content/news-list.help';

/**
 * Página pública de listado de noticias.
 *
 * Filtrado según scope del contexto:
 * - GLOBAL: todas las noticias publicadas
 * - GAME:   las que tienen gameId = scopeId
 * - ASSOCIATION: las que tienen scopeType=ASSOCIATION y scopeId del contexto
 *
 * Nota: NewsSummaryDTO no expone un campo hasContent, por lo que el indicador
 * de contenido enriquecido ('...') y el enlace al detalle se muestran siempre.
 */
@Component({
  selector: 'app-news-list-page',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="ds-container">
      <header class="border-b border-neutral-medium pb-4 pt-6">
        <h1 class="h1">{{ pageTitle() }}</h1>
        <p class="text-neutral-dark mt-3 leading-relaxed">
          Mantente al día con las últimas noticias y novedades.
        </p>
      </header>

      <section class="mt-6">
        @if (loading()) {
          <p class="text-neutral-dark">Cargando...</p>
        } @else if (error()) {
          <p class="text-red-600">Error al cargar noticias: {{ error() }}</p>
        } @else if (newsList().length === 0) {
          <p class="text-neutral-dark">No hay noticias disponibles.</p>
        } @else {
          <div class="ds-cards-container">
            @for (news of newsList(); track news.id) {
              <article class="ds-card">
                <!-- Header: solo clicable si hasContent -->
                <div
                  [class]="'ds-card-assoc-header' + (news.hasContent ? ' ds-card-news-header-linked' : '')"
                  [routerLink]="news.hasContent ? ['/noticias', news.id, news.slug] : null"
                >
                  <span class="ds-card-news-title">{{ news.title }}</span>
                </div>

                <div class="ds-card-body">
                  <!-- Fecha de publicación y badges -->
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <div class="flex items-baseline gap-x-2">
                      <span class="ds-card-label">Publicado:</span>
                      <span class="ds-card-text">
                        {{ (news.publishedAt || news.createdAt) | date:'dd/MM/yyyy' }}
                      </span>
                    </div>
                    @if (news.game) {
                      <span class="ds-badge ds-badge-game">{{ news.game.name }}</span>
                    }
                    @if (news.scopeType === WebScope.ASSOCIATION && news.scopeId) {
                      <span class="ds-badge ds-badge-association">
                        {{ getAssociationLabel(news.scopeId) }}
                      </span>
                    }
                  </div>

                  <!-- Texto introductorio -->
                  @if (news.text) {
                    <div class="ds-card-section">
                      <p class="ds-card-text">
                        {{ news.text }}
                        @if (news.hasContent) {
                          <a [routerLink]="['/noticias', news.id, news.slug]" class="ds-card-news-ellipsis">&#8230;</a>
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
export class NewsListPage {
  private readonly newsApi = inject(NewsApiService);
  private readonly associationsResolve = inject(AssociationsResolveService);
  readonly contextStore = inject(ContextStore);
  readonly gameStore = inject(GamesStore);

  readonly WebScope = WebScope;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly newsList = signal<NewsSummaryDTO[]>([]);

  /** Mapa id → label para asociaciones resueltas (scopeId → shortname o name) */
  private readonly associationNames = signal<Map<number, string>>(new Map());

  readonly pageTitle = computed(() => {
    const scopeType = this.contextStore.scopeType();
    const scopeId = this.contextStore.scopeId();

    if (scopeType === WebScope.GAME && scopeId) {
      const game = this.gameStore.getById(scopeId);
      return game ? `Noticias de ${game.name}` : 'Noticias';
    }

    if (scopeType === WebScope.ASSOCIATION && scopeId) {
      const assoc = this.associationsResolve.getById(scopeId);
      return assoc ? `Noticias de ${assoc.shortname ?? assoc.name}` : 'Noticias';
    }

    return 'Noticias';
  });

  constructor() {
    inject(PageHelpService).set(getNewsListHelp(inject(ContextStore).scopeType()));
    effect(() => {
      const scopeType = this.contextStore.scopeType();
      const scopeId = this.contextStore.scopeId();

      this.loading.set(true);
      this.error.set(null);
      this.newsList.set([]);

      // Construir parámetros de filtrado según scope
      let params: Record<string, unknown> = {};

      if (scopeType === WebScope.GAME && scopeId) {
        params = { gameId: scopeId };
      } else if (scopeType === WebScope.ASSOCIATION && scopeId) {
        params = { scopeType: WebScope.ASSOCIATION, scopeId };
      }
      // GLOBAL: sin filtros

      this.newsApi.list(params).subscribe({
        next: (items) => {
          // Ordenar por fecha de publicación descendente
          const sorted = [...items].sort((a, b) => {
            const dateA = new Date(a.publishedAt ?? a.createdAt).getTime();
            const dateB = new Date(b.publishedAt ?? b.createdAt).getTime();
            return dateB - dateA;
          });

          this.newsList.set(sorted);
          this.loading.set(false);

          // Resolver nombres de asociaciones presentes en la lista
          this.resolveAssociationNames(sorted);
        },
        error: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Error desconocido';
          this.error.set(msg);
          this.loading.set(false);
        },
      });
    });
  }

  /** Devuelve el label de la asociación para el badge, o el id como fallback */
  getAssociationLabel(scopeId: number): string {
    return this.associationNames().get(scopeId) ?? `Asociación #${scopeId}`;
  }

  /**
   * Resuelve de forma asíncrona los nombres de todas las asociaciones
   * referenciadas en la lista (solo cuando scopeType === ASSOCIATION).
   */
  private resolveAssociationNames(items: NewsSummaryDTO[]): void {
    const ids = [
      ...new Set(
        items
          .filter((n) => n.scopeType === WebScope.ASSOCIATION && n.scopeId !== null)
          .map((n) => n.scopeId as number),
      ),
    ];

    if (ids.length === 0) return;

    // Intentar resolver desde caché síncronamente primero
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

    // Resolver el resto vía API (con caché y deduplicación)
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
        // Si falla la resolución, los badges mostrarán el id como fallback
        this.associationNames.set(new Map(namesMap));
      },
    });
  }
}
