import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { PagesService } from '../../core/pages/pages.service';
import { GamesApiService } from '../../core/games/games-api.service';
import { AssociationsApiService } from '../../core/associations/associations-api.service';
import { SiteParamsService } from '../../core/site-params/site-params.service';
import { PageOwnerScope, PageDTO } from '../../shared/content/page.dto';
import { ContentRendererComponent } from '../../shared/content/content-renderer.component';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

/**
 * Componente inteligente para visualizar páginas públicas.
 *
 * Rutas soportadas:
 * - / → homepage global
 * - /paginas/:slug → página global por slug
 * - /juegos/:slug → homepage de juego
 * - /juegos/:slug/:pagina → página de juego por slug
 * - /asociaciones/:slug → homepage de asociación
 * - /asociaciones/:slug/:pagina → página de asociación por slug
 */
@Component({
  selector: 'app-page-viewer',
  imports: [ContentRendererComponent],
  template: `
    @if (loading()) {
      <div class="ds-loading">Cargando...</div>
    } @else if (error()) {
      <div class="ds-error">{{ error() }}</div>
    } @else if (page()) {
      <app-content-renderer [content]="page()!.content" />
    }
  `,
  styles: [`
    :host {
      display: block;
    }
    .ds-loading, .ds-error {
      padding: 2rem;
      text-align: center;
    }
  `]
})
export class PageViewerPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pagesService = inject(PagesService);
  private readonly gamesApi = inject(GamesApiService);
  private readonly associationsApi = inject(AssociationsApiService);
  private readonly siteParamsService = inject(SiteParamsService);

  readonly page = signal<PageDTO | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private routerSubscription?: Subscription;

  ngOnInit(): void {
    // Cargar página inicial
    this.loadCurrentPage();

    // Suscribirse a cambios de navegación
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadCurrentPage();
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private loadCurrentPage(): void {
    const params = this.route.snapshot.params;
    const urlSegments = this.route.snapshot.url.map(seg => seg.path);

    this.loadPage(params, urlSegments);
  }

  private loadPage(params: any, urlSegments: string[]): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(null);

    // Determinar el tipo de página según la URL
    const firstSegment = urlSegments[0];

    // Global homepage: /
    if (!firstSegment || firstSegment === '') {
      this.loadGlobalHomepage();
      return;
    }

    // Global page: /paginas/:slug
    if (firstSegment === 'paginas') {
      const pageSlug = params['slug'];
      if (!pageSlug) {
        this.showError('Slug de página no especificado');
        return;
      }
      this.loadGlobalPage(pageSlug);
      return;
    }

    // Game pages: /juegos/:slug or /juegos/:slug/:pagina
    if (firstSegment === 'juegos') {
      const gameSlug = params['slug'];
      if (!gameSlug) {
        this.showError('Slug de juego no especificado');
        return;
      }

      const pageSlug = params['pagina'];
      if (pageSlug) {
        // Game page by slug
        this.loadGamePage(gameSlug, pageSlug);
      } else {
        // Game homepage
        this.loadGameHomepage(gameSlug);
      }
      return;
    }

    // Association pages: /asociaciones/:slug or /asociaciones/:slug/:pagina
    if (firstSegment === 'asociaciones') {
      const associationSlug = params['slug'];
      if (!associationSlug) {
        this.showError('Slug de asociación no especificado');
        return;
      }

      const pageSlug = params['pagina'];
      if (pageSlug) {
        // Association page by slug
        this.loadAssociationPage(associationSlug, pageSlug);
      } else {
        // Association homepage
        this.loadAssociationHomepage(associationSlug);
      }
      return;
    }

    this.showError('Ruta no reconocida');
  }

  private loadGlobalHomepage(): void {
    this.siteParamsService.getNumber('homepage').subscribe({
      next: (pageId) => {
        if (pageId === null) {
          this.showError('No hay página de inicio configurada');
          return;
        }
        this.loadPageById(pageId);
      },
      error: () => this.showError('Error al obtener la página de inicio')
    });
  }

  private loadGlobalPage(pageSlug: string): void {
    this.pagesService.getPublicPageByOwnerSlug(
      PageOwnerScope.GLOBAL,
      'global', // El ownerSlug para global
      pageSlug
    ).subscribe({
      next: (page) => {
        if (page) {
          this.page.set(page);
        } else {
          this.showError('Página no encontrada');
        }
        this.loading.set(false);
      },
      error: () => {
        this.showError('Error al cargar la página');
        this.loading.set(false);
      }
    });
  }

  private loadGameHomepage(gameSlug: string): void {
    this.pagesService.getPublicHomePage(
      PageOwnerScope.GAME,
      gameSlug
    ).subscribe({
      next: (page) => {
        if (page) {
          this.page.set(page);
        } else {
          this.showError('Página de inicio del juego no encontrada');
        }
        this.loading.set(false);
      },
      error: () => {
        this.showError('Error al cargar la página de inicio del juego');
        this.loading.set(false);
      }
    });
  }

  private loadGamePage(gameSlug: string, pageSlug: string): void {
    this.pagesService.getPublicPageByOwnerSlug(
      PageOwnerScope.GAME,
      gameSlug,
      pageSlug
    ).subscribe({
      next: (page) => {
        if (page) {
          this.page.set(page);
        } else {
          this.showError('Página del juego no encontrada');
        }
        this.loading.set(false);
      },
      error: () => {
        this.showError('Error al cargar la página del juego');
        this.loading.set(false);
      }
    });
  }

  private loadAssociationHomepage(associationSlug: string): void {
    this.pagesService.getPublicHomePage(
      PageOwnerScope.ASSOCIATION,
      associationSlug
    ).subscribe({
      next: (page) => {
        if (page) {
          this.page.set(page);
        } else {
          this.showError('Página de inicio de la asociación no encontrada');
        }
        this.loading.set(false);
      },
      error: () => {
        this.showError('Error al cargar la página de inicio de la asociación');
        this.loading.set(false);
      }
    });
  }

  private loadAssociationPage(associationSlug: string, pageSlug: string): void {
    this.pagesService.getPublicPageByOwnerSlug(
      PageOwnerScope.ASSOCIATION,
      associationSlug,
      pageSlug
    ).subscribe({
      next: (page) => {
        if (page) {
          this.page.set(page);
        } else {
          this.showError('Página de la asociación no encontrada');
        }
        this.loading.set(false);
      },
      error: () => {
        this.showError('Error al cargar la página de la asociación');
        this.loading.set(false);
      }
    });
  }

  private loadPageById(pageId: number): void {
    this.pagesService.getById(pageId).subscribe({
      next: (page) => {
        if (page) {
          this.page.set(page);
        } else {
          this.showError('Página no encontrada');
        }
        this.loading.set(false);
      },
      error: () => {
        this.showError('Error al cargar la página');
        this.loading.set(false);
      }
    });
  }

  private showError(message: string): void {
    this.error.set(message);
    this.loading.set(false);
  }
}
