import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { AdminSidebarContainerComponent } from '../../../components/admin-sidebar/admin-sidebar-container.component';
import { AdminPageSubtitleComponent } from '../../../components/core/admin/admin-page-subtitle/admin-page-subtitle.component';
import { AdminTableComponent } from '../../../components/core/admin/table/admin-table.component';
import { AdminTableAction, AdminTableColumn } from '../../../components/core/admin/table/admin-table.model';
import { ContentRendererComponent } from '../../../shared/content/content-renderer/content-renderer.component';
import { ContextStore } from '../../../core/context/context.store';
import { NewsApiService } from '../../../core/news/news-api.service';
import { NewsDTO, NewsSummaryDTO } from '../../../core/news/news.models';
import { WebScope } from '../../../core/web-scope.constants';

/** Fila de la tabla de noticias — mapeo plano para AdminTableComponent */
interface NewsTableRow {
  id: number;
  title: string;
  slug: string;
  gameName: string;
  publishedLabel: string;
  publishedAt: string | null;
}

/**
 * Página de administración: listado de noticias.
 *
 * Muestra las noticias del scope actual (global, asociación o juego)
 * incluyendo borradores. Permite previsualizar y acceder a la gestión
 * de cada noticia.
 *
 * Acceso: requiere permiso news.edit en el scope actual.
 */
@Component({
  selector: 'app-news-list-admin',
  imports: [
    AdminSidebarContainerComponent,
    AdminPageSubtitleComponent,
    AdminTableComponent,
    ContentRendererComponent,
  ],
  templateUrl: './news-list-admin.page.html',
  styleUrl: './news-list-admin.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsListAdminPage implements OnInit {
  private readonly newsApi = inject(NewsApiService);
  private readonly contextStore = inject(ContextStore);
  private readonly router = inject(Router);

  // -------------------------------------------------------------------------
  // ESTADO
  // -------------------------------------------------------------------------

  /** Lista original de noticias cargadas desde el backend */
  readonly news = signal<NewsSummaryDTO[]>([]);

  /** Indica si hay una carga en progreso */
  readonly isLoading = signal(false);

  /** Mensaje de error de carga, null si no hay error */
  readonly errorMessage = signal<string | null>(null);

  /** Noticia completa seleccionada para mostrar en el modal de previsualización */
  readonly selectedNews = signal<NewsDTO | null>(null);

  /** Controla la visibilidad del modal de previsualización */
  readonly showPreviewModal = signal(false);

  /** true mientras se carga la noticia completa para el modal */
  readonly isLoadingPreview = signal(false);

  // -------------------------------------------------------------------------
  // CONFIGURACIÓN DE LA TABLA
  // -------------------------------------------------------------------------

  /** Definición de columnas de la tabla */
  readonly columns: AdminTableColumn[] = [
    { key: 'id', label: 'ID', type: 'text', align: 'center' },
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'slug', label: 'Slug', type: 'text' },
    { key: 'gameName', label: 'Juego', type: 'text' },
    {
      key: 'publishedLabel',
      label: 'Estado',
      type: 'badge',
      align: 'center',
      badgeConfig: {
        Publicada: 'ds-badge-active',
        Borrador: 'ds-badge-inactive',
      },
    },
    { key: 'publishedAt', label: 'Publicada el', type: 'date', align: 'center' },
  ];

  /** Acciones disponibles por fila */
  readonly tableActions: AdminTableAction[] = [
    { label: 'Gestión', action: 'gestión' },
  ];

  // -------------------------------------------------------------------------
  // DATOS DERIVADOS
  // -------------------------------------------------------------------------

  /**
   * Filas de la tabla derivadas de la lista de noticias.
   * Mapea el DTO plano que necesita AdminTableComponent.
   */
  readonly tableRows = computed<NewsTableRow[]>(() =>
    this.news().map((n) => ({
      id: n.id,
      title: n.title,
      slug: n.slug,
      gameName: n.game?.name ?? '—',
      publishedLabel: n.published ? 'Publicada' : 'Borrador',
      publishedAt: n.publishedAt,
    }))
  );

  // -------------------------------------------------------------------------
  // CICLO DE VIDA
  // -------------------------------------------------------------------------

  ngOnInit(): void {
    this.cargarNoticias();
  }

  // -------------------------------------------------------------------------
  // MÉTODOS PÚBLICOS (bindings de plantilla)
  // -------------------------------------------------------------------------

  /**
   * Abre el modal de previsualización con la noticia de la fila clicada.
   * El rowClick emite la fila mapeada (NewsTableRow), se busca la noticia
   * original por ID para tener todos los datos disponibles en el modal.
   */
  onRowClick(row: NewsTableRow): void {
    this.selectedNews.set(null);
    this.showPreviewModal.set(true);
    this.isLoadingPreview.set(true);

    this.newsApi.getById(row.id).subscribe({
      next: (noticia) => {
        this.selectedNews.set(noticia);
        this.isLoadingPreview.set(false);
      },
      error: () => {
        this.isLoadingPreview.set(false);
      },
    });
  }

  /** Cierra el modal de previsualización */
  onClosePreview(): void {
    this.showPreviewModal.set(false);
    this.selectedNews.set(null);
    this.isLoadingPreview.set(false);
  }

  /**
   * Gestiona las acciones de fila emitidas por AdminTableComponent.
   * @param event Objeto con el nombre de la acción y la fila afectada
   */
  onTableAction(event: { action: string; row: NewsTableRow }): void {
    if (event.action === 'gestión') {
      this.router.navigateByUrl(this.editRoute(event.row.id));
    }
  }

  /** Navega al formulario de creación según el scope actual */
  onNuevaNoticia(): void {
    this.router.navigateByUrl(this.createRoute());
  }

  /** Construye la ruta de edición según el scope actual */
  private editRoute(id: number): string {
    switch (this.contextStore.scopeType()) {
      case WebScope.ASSOCIATION: return `/admin/asociacion/noticias/${id}/editar`;
      case WebScope.GAME:        return `/admin/juego/noticias/${id}/editar`;
      default:                   return `/admin/noticias/${id}/editar`;
    }
  }

  /** Construye la ruta de creación según el scope actual */
  private createRoute(): string {
    switch (this.contextStore.scopeType()) {
      case WebScope.ASSOCIATION: return '/admin/asociacion/noticias/nueva';
      case WebScope.GAME:        return '/admin/juego/noticias/nueva';
      default:                   return '/admin/noticias/nueva';
    }
  }

  // -------------------------------------------------------------------------
  // MÉTODOS PRIVADOS
  // -------------------------------------------------------------------------

  /**
   * Carga las noticias del scope actual desde el backend.
   * Incluye borradores (requiere permiso news.edit, garantizado por el guard de la ruta).
   */
  private cargarNoticias(): void {
    const scopeType = this.contextStore.scopeType();
    const scopeId = this.contextStore.scopeId();

    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Construir parámetros de filtrado según el scope actual
    const params = this.buildListParams(scopeType, scopeId);

    this.newsApi.list(params).subscribe({
      next: (noticias) => {
        this.news.set(noticias);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message ?? 'Error al cargar las noticias');
        this.isLoading.set(false);
        console.error('[NewsListAdmin] Error al cargar noticias:', err);
      },
    });
  }

  /**
   * Construye los parámetros de filtrado para el endpoint según el scope activo.
   */
  private buildListParams(
    scopeType: WebScope,
    scopeId: number | null
  ): Parameters<NewsApiService['list']>[0] {
    const base = { includeUnpublished: true };

    if (scopeType === WebScope.GLOBAL) {
      return { ...base, scopeType: WebScope.GLOBAL };
    }

    return {
      ...base,
      scopeType,
      ...(scopeId !== null ? { scopeId } : {}),
    };
  }
}
