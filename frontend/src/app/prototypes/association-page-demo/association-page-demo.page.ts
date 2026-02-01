import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ContentRendererComponent } from '../../shared/content/content-renderer.component';
import { PagesService } from '../../core/pages/pages.service';
import { PageDTO, PageSummaryDTO } from '../../shared/content/page.dto';
import { WebScope } from '../../core/web-scope.constants';

/**
 * Prototipo: Demostración de páginas de asociación.
 * Muestra cómo renderizar páginas con segmentos y cambiar la home.
 */
@Component({
  selector: 'app-association-page-demo',
  imports: [NavbarComponent, ContentRendererComponent, FormsModule],
  template: `
    <app-navbar />
    <main class="ds-main">
      <div class="ds-page">
        <div class="ds-container">
          <!-- Header con datos de la asociación mock -->
          <header class="border-b border-neutral-medium pb-6 mb-6">
            <p class="text-xs uppercase tracking-wide text-neutral-muted mb-2">Prototipo</p>
            <h1 class="h1">{{ association.name }}</h1>
            <p class="text-sm text-neutral-dark mt-1">Slug: {{ association.slug }}</p>
            <p class="text-sm text-neutral-dark">Home Page ID: {{ homePageId() }}</p>
          </header>

          <!-- Selector de Home Page -->
          <section class="mb-6 bg-neutral-lightest p-4 rounded-lg border border-neutral-medium">
            <label class="block text-sm font-semibold text-neutral-dark mb-2">
              Página de inicio:
            </label>
            <select
              class="w-full max-w-md px-3 py-2 border border-neutral-medium rounded bg-white"
              [ngModel]="homePageId()"
              (ngModelChange)="homePageId.set(+$event)"
            >
              @for (page of availablePages(); track page.id) {
                <option [value]="page.id">
                  {{ page.title }} ({{ page.slug }})
                </option>
              }
            </select>
            <p class="text-xs text-neutral-muted mt-2">
              Selecciona qué página se mostrará como inicio de la asociación
            </p>
          </section>

          <!-- Contenido de la página home -->
          <section>
            @if (loading()) {
              <div class="text-neutral-dark">Cargando página...</div>
            } @else if (currentPage(); as page) {
              <div class="mb-4 pb-4 border-b border-neutral-light">
                <h2 class="text-2xl font-semibold text-neutral-darkest">{{ page.title }}</h2>
                <p class="text-sm text-neutral-muted mt-1">
                  Publicado: {{ page.published }} | Actualizado: {{ formatDate(page.updatedAt) }}
                </p>
              </div>
              <app-content-renderer [content]="page.content" />
            } @else {
              <div class="text-neutral-dark">No se encontró la página seleccionada</div>
            }
          </section>
        </div>
      </div>
    </main>
  `,
  styles: `
    select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationPageDemoPage {
  private readonly pagesService = inject(PagesService);

  // Asociación mock
  readonly association = {
    id: 2,
    name: 'Asociación Gaming Demo',
    slug: 'asociacion-demo',
  };

  // Home page ID como signal para que el effect lo pueda trackear
  readonly homePageId = signal(1); // Página "Bienvenida" por defecto

  readonly availablePages = signal<PageSummaryDTO[]>([]);
  readonly currentPage = signal<PageDTO | null>(null);
  readonly loading = signal(true);

  constructor() {
    // Cargar lista de páginas disponibles
    this.pagesService
      .listByOwner(WebScope.ASSOCIATION, this.association.id)
      .subscribe((pages) => {
        this.availablePages.set(pages);
      });

    // Efecto que carga la página home cuando cambia homePageId
    effect(() => {
      const homeId = this.homePageId();
      this.loadPage(homeId);
    });
  }

  onHomePageChange(): void {
    // El effect detectará el cambio automáticamente
  }

  private loadPage(pageId: number): void {
    this.loading.set(true);
    this.pagesService.getById(pageId).subscribe({
      next: (page) => {
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: () => {
        this.currentPage.set(null);
        this.loading.set(false);
      },
    });
  }

  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
