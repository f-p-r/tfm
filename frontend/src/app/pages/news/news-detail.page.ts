import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { WebScope } from '../../core/web-scope.constants';
import { NewsApiService } from '../../core/news/news-api.service';
import { NewsDTO } from '../../core/news/news.models';
import { AssociationsResolveService } from '../../core/associations/associations-resolve.service';
import { ContentRendererComponent } from '../../shared/content/content-renderer/content-renderer.component';

@Component({
  selector: 'app-news-detail-page',
  imports: [DatePipe, ContentRendererComponent],
  template: `
    <div class="ds-container">
      <div class="pt-6 pb-10">

        @if (loading()) {
          <p class="text-neutral-dark">Cargando...</p>
        } @else if (error()) {
          <p class="text-red-600">{{ error() }}</p>
        } @else if (news(); as n) {

          <!-- Cabecera: título + botón cerrar -->
          <header class="flex items-start gap-16 border-b border-neutral-medium pb-4 mb-6">
            <h1 class="h1">{{ n.title }}</h1>
            <button
              type="button"
              class="ds-btn-close shrink-0 mt-1"
              aria-label="Cerrar"
              (click)="goBack()"
            ><span class="material-symbols-outlined text-base">close</span></button>
          </header>

          <!-- Metadatos: fecha + badges -->
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
            <div class="flex items-baseline gap-x-2">
              <span class="ds-card-label">Publicado:</span>
              <span class="ds-card-text">
                {{ (n.publishedAt || n.createdAt) | date:'dd/MM/yyyy' }}
              </span>
            </div>
            @if (n.game) {
              <span class="ds-badge ds-badge-game">{{ n.game.name }}</span>
            }
            @if (n.scopeType === WebScope.ASSOCIATION && n.scopeId) {
              <span class="ds-badge ds-badge-association">{{ associationLabel() }}</span>
            }
          </div>

          <!-- Contenido enriquecido -->
          @if (n.content) {
            <app-content-renderer [content]="n.content" />
          }

        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly newsApi = inject(NewsApiService);
  private readonly associationsResolve = inject(AssociationsResolveService);
  private readonly location = inject(Location);

  readonly WebScope = WebScope;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly news = signal<NewsDTO | null>(null);

  /** Label de la asociación, resuelto del caché o de forma asíncrona. */
  readonly associationLabel = computed<string>(() => {
    const n = this.news();
    if (!n || n.scopeType !== WebScope.ASSOCIATION || !n.scopeId) return '';
    const cached = this.associationsResolve.getById(n.scopeId);
    if (cached) return cached.shortname ?? cached.name;
    // No está en caché: lanzar resolución y refrescar señal al obtener resultado
    this.associationsResolve.resolveById(n.scopeId).subscribe(() => {
      this.news.update((v) => (v ? { ...v } : v));
    });
    return `Asociación #${n.scopeId}`;
  });

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const numId = Number(rawId);

    if (!rawId || isNaN(numId)) {
      this.error.set('ID de noticia no válido.');
      this.loading.set(false);
      return;
    }

    this.newsApi.getById(numId).subscribe({
      next: (n) => {
        this.news.set(n);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error al cargar la noticia.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.location.back();
  }
}
