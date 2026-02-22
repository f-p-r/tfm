import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { PagesService } from '../../core/pages/pages.service';
import { GamesApiService } from '../../core/games/games-api.service';
import { AssociationsApiService } from '../../core/associations/associations-api.service';
import { SiteParamsService } from '../../core/site-params/site-params.service';
import { PageOwnerScope, PageOwnerType, PageDTO, PageNavItemDTO } from '../../shared/content/page.dto';
import { ContentRendererComponent } from '../../shared/content/content-renderer/content-renderer.component';
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
    @if (navPages().length > 1) {
      <nav >
        <div class="ds-container py-2 flex items-center gap-2">
          <span class="text-xs text-neutral-dark whitespace-nowrap">Ir a:</span>
          <select
            class="w-full sm:w-auto text-xs border border-neutral-medium rounded px-3 bg-white text-neutral-dark focus:outline-none focus:ring-2 focus:ring-primary"
            [value]="page()?.slug"
            (change)="onPageSelect($event)">
            @for (p of navPages(); track p.id) {
              <option [value]="p.slug">{{ p.title }}</option>
            }
          </select>
        </div>
      </nav>
    }
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

  /** Lista de páginas del owner para el selector de navegación */
  readonly navPages = signal<PageNavItemDTO[]>([]);
  private navOwnerType: PageOwnerType | null = null;
  private navOwnerSlug: string | null = null;

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
      this.loadNavPages(PageOwnerScope.GLOBAL, 'global');
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
      this.loadNavPages(PageOwnerScope.GLOBAL, 'global');
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
      this.loadNavPages(PageOwnerScope.GAME, gameSlug);

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
      this.loadNavPages(PageOwnerScope.ASSOCIATION, associationSlug);

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

  private loadNavPages(ownerType: PageOwnerType, ownerSlug: string): void {
    // Solo recargar si cambia el owner para evitar llamadas innecesarias al navegar entre páginas del mismo owner
    if (this.navOwnerType === ownerType && this.navOwnerSlug === ownerSlug) return;

    this.navOwnerType = ownerType;
    this.navOwnerSlug = ownerSlug;

    this.pagesService.listPublicByOwner(ownerType, ownerSlug).subscribe({
      next: (pages) => {
        // Home primero, luego el resto en el orden que devuelve el backend (título asc)
        const sorted = [
          ...pages.filter(p => p.home),
          ...pages.filter(p => !p.home),
        ];
        this.navPages.set(sorted);
      },
      error: () => this.navPages.set([]),
    });
  }

  private clearNavPages(): void {
    this.navOwnerType = null;
    this.navOwnerSlug = null;
    this.navPages.set([]);
  }

  onPageSelect(event: Event): void {
    const slug = (event.target as HTMLSelectElement).value;
    const selectedPage = this.navPages().find(p => p.slug === slug);
    if (!selectedPage || !this.navOwnerSlug || !this.navOwnerType) return;

    let url: string[];
    if (this.navOwnerType === PageOwnerScope.ASSOCIATION) {
      url = selectedPage.home
        ? ['/asociaciones', this.navOwnerSlug]
        : ['/asociaciones', this.navOwnerSlug, slug];
    } else if (this.navOwnerType === PageOwnerScope.GAME) {
      url = selectedPage.home
        ? ['/juegos', this.navOwnerSlug]
        : ['/juegos', this.navOwnerSlug, slug];
    } else {
      url = selectedPage.home ? ['/'] : ['/paginas', slug];
    }

    this.router.navigate(url);
  }

  private loadGlobalHomepage(): void {
    this.siteParamsService.getNumber('homepage').subscribe({
      next: (pageId) => {
        if (pageId === null) {
          this.showError('No hay página de inicio configurada. Por favor, contacta con el administrador del sitio.');
          return;
        }
        this.loadPageById(pageId);
      },
      error: (err) => {
        console.error('Error loading homepage:', err);
        this.showError('No hay página de inicio configurada. Por favor, contacta con el administrador del sitio.');
      }
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
    this.pagesService.getPublicById(pageId).subscribe({
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
