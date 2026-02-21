import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AdminSidebarContainerComponent } from '../../../components/admin-sidebar/admin-sidebar-container.component';
import { AdminPageSubtitleComponent } from '../../../components/core/admin/admin-page-subtitle/admin-page-subtitle.component';
import { ContentSegmentsEditorComponent } from '../../../shared/content/segments-editor/content-segments-editor.component';
import { HelpIComponent } from '../../../shared/help/help-i/help-i.component';
import { HelpHoverDirective } from '../../../shared/help/help-hover.directive';
import { HelpContentService } from '../../../shared/help/help-content.service';
import { AssociationsApiService } from '../../../core/associations/associations-api.service';
import { ContextStore } from '../../../core/context/context.store';
import { NewsApiService } from '../../../core/news/news-api.service';
import { NewsCreateDTO, NewsDTO, NewsUpdateDTO } from '../../../core/news/news.models';
import { PageContentDTO } from '../../../shared/content/page-content.dto';
import { WebScope } from '../../../core/web-scope.constants';
import { NEWS_FORM_PACK } from './news-form.pack';

/** Juego simplificado para el selector de gameId */
interface GameOption {
  id: number;
  name: string;
}

/**
 * Página de administración: formulario de creación y edición de noticias.
 *
 * El modo (crear / editar) se determina automáticamente según la presencia
 * del parámetro de ruta `newsId`.
 *
 * El scope (global, asociación o juego) se obtiene del ContextStore,
 * que es establecido por resolveScopeGuard antes de activar la ruta.
 *
 * Acceso: requiere permiso news.edit en el scope actual.
 */
@Component({
  selector: 'app-news-form-admin',
  imports: [
    FormsModule,
    AdminSidebarContainerComponent,
    AdminPageSubtitleComponent,
    ContentSegmentsEditorComponent,
    HelpIComponent,
    HelpHoverDirective,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './news-form-admin.page.html',
  styleUrl: './news-form-admin.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsFormAdminPage implements OnInit, AfterViewInit {
  private readonly newsApi = inject(NewsApiService);
  private readonly associationsApi = inject(AssociationsApiService);
  private readonly contextStore = inject(ContextStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly helpContent = inject(HelpContentService);

  // -------------------------------------------------------------------------
  // PARÁMETROS DE RUTA Y SCOPE
  // -------------------------------------------------------------------------

  /** ID de la noticia (solo en modo edición) */
  readonly newsId = signal<number | null>(null);

  /** Tipo de scope actual leído del ContextStore */
  readonly scopeType = computed(() => this.contextStore.scopeType());

  /** ID del scope actual (null para global) */
  readonly scopeId = computed(() => this.contextStore.scopeId());

  // -------------------------------------------------------------------------
  // MODO
  // -------------------------------------------------------------------------

  /** true si hay un newsId en la ruta (modo edición), false si es creación */
  readonly isEditMode = computed(() => this.newsId() !== null);

  // -------------------------------------------------------------------------
  // DATOS ORIGINALES (solo en edición)
  // -------------------------------------------------------------------------

  /** Noticia cargada desde el backend para comparar cambios */
  readonly originalNews = signal<NewsDTO | null>(null);

  // -------------------------------------------------------------------------
  // CAMPOS DEL FORMULARIO
  // -------------------------------------------------------------------------

  readonly title = signal('');
  readonly slug = signal('');
  /** Texto introductorio para tarjetas y listados (obligatorio) */
  readonly text = signal('');
  readonly published = signal(false);
  /** ID del juego relacionado (solo disponible para scopeType=2) */
  readonly gameId = signal<number | null>(null);
  /** Clases CSS globales de la noticia (sincronizadas con content.classNames) */
  readonly classNames = signal('');
  readonly content = signal<PageContentDTO>({ schemaVersion: 1, segments: [] });
  /** Contenido inicial para el editor (se establece una sola vez al cargar) */
  readonly editorInitialContent = signal<PageContentDTO | null>(null);

  // -------------------------------------------------------------------------
  // DATOS AUXILIARES
  // -------------------------------------------------------------------------

  /** Juegos de la asociación actual (cargados solo cuando scopeType=2) */
  readonly associationGames = signal<GameOption[]>([]);

  // -------------------------------------------------------------------------
  // ESTADOS DE CARGA
  // -------------------------------------------------------------------------

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  /** true mientras el usuario está editando un segmento del editor */
  readonly isEditingSegment = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly validationErrors = signal<Record<string, string[]>>({});

  // -------------------------------------------------------------------------
  // COMPUTED
  // -------------------------------------------------------------------------

  /** true si todos los campos obligatorios están cubiertos para poder crear */
  readonly canCreate = computed(() =>
    this.title().trim() !== '' &&
    this.slug().trim() !== '' &&
    this.text().trim() !== ''
  );

  /**
   * true si algún campo del formulario difiere de la noticia original.
   * Solo relevante en modo edición.
   */
  readonly hasChanges = computed(() => {
    if (!this.isEditMode()) return false;
    const original = this.originalNews();
    if (!original) return false;

    return (
      this.title() !== original.title ||
      this.slug() !== original.slug ||
      this.text() !== original.text ||
      this.published() !== original.published ||
      this.gameId() !== original.gameId ||
      JSON.stringify(this.content()) !== JSON.stringify(original.content ?? { schemaVersion: 1, segments: [] })
    );
  });

  /** Título de la página visible en el encabezado */
  readonly pageTitle = computed(() => {
    if (this.isEditMode()) {
      const t = this.title();
      return t ? `Noticia: ${t}` : 'Editar noticia';
    }
    return 'Nueva noticia';
  });

  /** true si el botón de envío debe estar deshabilitado */
  readonly isSubmitDisabled = computed(() => {
    if (this.isEditingSegment()) return true;
    if (this.isEditMode()) {
      return !this.hasChanges() || this.isSaving();
    }
    return !this.canCreate() || this.isSaving();
  });

  // -------------------------------------------------------------------------
  // CONSTRUCTOR
  // -------------------------------------------------------------------------

  constructor() {
    this.helpContent.setPack(NEWS_FORM_PACK);

    // Sincronizar classNames con content.classNames
    effect(() => {
      const cn = this.classNames();
      this.content.update(c => ({ ...c, classNames: cn || undefined }));
    });
  }

  // -------------------------------------------------------------------------
  // CICLO DE VIDA
  // -------------------------------------------------------------------------

  /**
   * ContentSegmentsEditorComponent llama a setPack(CONTENT_EDITOR_HELP) en su
   * constructor, que se ejecuta DESPUÉS del constructor del padre. Por eso
   * re-establecemos el pack aquí, una vez que todos los hijos están iniciados.
   */
  ngAfterViewInit(): void {
    this.helpContent.setPack(NEWS_FORM_PACK);
  }

  ngOnInit(): void {
    // Leer el ID de noticia de la ruta (presente solo en edición)
    const newsIdParam = this.route.snapshot.paramMap.get('newsId');
    if (newsIdParam) {
      const parsed = parseInt(newsIdParam, 10);
      if (isNaN(parsed)) {
        this.errorMessage.set('ID de noticia no válido');
        return;
      }
      this.newsId.set(parsed);
    }

    // Para scopeType=2, cargar los juegos de la asociación
    if (this.scopeType() === WebScope.ASSOCIATION && this.scopeId() !== null) {
      this.cargarJuegosAsociacion(this.scopeId()!);
    }

    if (this.isEditMode()) {
      this.cargarNoticia();
    }
  }

  // -------------------------------------------------------------------------
  // CALLBACKS DE LA PLANTILLA
  // -------------------------------------------------------------------------

  /** Recibe el contenido actualizado desde el editor de segmentos */
  onContentChange(newContent: PageContentDTO): void {
    this.content.set(newContent);
  }

  /** Recibe el estado de edición del editor (bloqueamos envío mientras edita) */
  onEditingStateChange(isEditing: boolean): void {
    this.isEditingSegment.set(isEditing);
  }

  /** Envía el formulario para crear o guardar */
  onSubmit(): void {
    if (this.isEditMode()) {
      this.guardar();
    } else {
      this.crear();
    }
  }

  /** Cancela y vuelve al listado de noticias del scope actual */
  onCancel(): void {
    this.router.navigateByUrl(this.backRoute());
  }

  /** Abre la previsualización del contenido en una nueva pestaña */
  openPreview(): void {
    try {
      sessionStorage.setItem('admin:pagePreview', JSON.stringify({
        title: this.title(),
        content: this.content(),
      }));
      window.open('/admin/pages/preview', '_blank');
    } catch (err) {
      console.error('[NewsForm] Error al abrir vista previa:', err);
    }
  }

  // -------------------------------------------------------------------------
  // MÉTODOS PRIVADOS
  // -------------------------------------------------------------------------

  /**
   * Carga los juegos de una asociación para el selector de gameId.
   * Solo se usa cuando scopeType=2.
   */
  private cargarJuegosAsociacion(associationId: number): void {
    this.associationsApi.getById(associationId).subscribe({
      next: (assoc) => {
        const juegos: GameOption[] = (assoc.games ?? [])
          .filter(g => !g.disabled)
          .map(g => ({ id: g.id, name: g.name }));
        this.associationGames.set(juegos);
      },
      error: (err) => {
        console.error('[NewsForm] Error al cargar juegos de la asociación:', err);
      },
    });
  }

  /** Carga la noticia existente desde el backend (modo edición) */
  private cargarNoticia(): void {
    const id = this.newsId();
    if (id === null) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.newsApi.getById(id).subscribe({
      next: (news) => {
        this.originalNews.set(news);
        this.title.set(news.title);
        this.slug.set(news.slug);
        this.text.set(news.text);
        this.published.set(news.published);
        this.gameId.set(news.gameId);

        const contentCargado = news.content ?? { schemaVersion: 1, segments: [] };
        this.classNames.set(contentCargado.classNames ?? '');
        this.content.set(contentCargado);
        this.editorInitialContent.set(JSON.parse(JSON.stringify(contentCargado)));

        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.status === 404 ? 'Noticia no encontrada' : (err.message ?? 'Error al cargar la noticia')
        );
        console.error('[NewsForm] Error al cargar noticia:', err);
      },
    });
  }

  /** Crea una nueva noticia con los datos del formulario */
  private crear(): void {
    if (!this.canCreate()) {
      this.errorMessage.set('Título, slug y texto son obligatorios');
      return;
    }

    const scopeType = this.scopeType();
    const scopeId = this.scopeId();

    const payload: NewsCreateDTO = {
      scopeType,
      scopeId: scopeType === WebScope.GLOBAL ? null : (scopeId ?? null),
      slug: this.slug(),
      title: this.title(),
      text: this.text(),
      published: this.published(),
      content: this.content().segments.length > 0 ? this.content() : null,
      // gameId solo se envía para scopeType=2 y cuando esté seleccionado
      ...(scopeType === WebScope.ASSOCIATION && this.gameId() !== null
        ? { gameId: this.gameId() }
        : {}),
    };

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.validationErrors.set({});

    this.newsApi.create(payload).subscribe({
      next: (creada) => {
        this.isSaving.set(false);
        // Navegar a la edición de la noticia recién creada
        this.router.navigateByUrl(this.editRoute(creada.id));
      },
      error: (err) => {
        this.isSaving.set(false);
        if (err.status === 422) {
          this.errorMessage.set('Error de validación');
          this.validationErrors.set(err.errors ?? {});
        } else {
          this.errorMessage.set(err.message ?? 'Error al crear la noticia');
        }
        console.error('[NewsForm] Error al crear noticia:', err);
      },
    });
  }

  /** Guarda los cambios de la noticia en modo edición */
  private guardar(): void {
    const id = this.newsId();
    if (id === null) return;

    const patch: NewsUpdateDTO = {
      slug: this.slug(),
      title: this.title(),
      text: this.text(),
      published: this.published(),
      content: this.content().segments.length > 0 ? this.content() : null,
      // gameId solo editable en scopeType=2
      ...(this.scopeType() === WebScope.ASSOCIATION
        ? { gameId: this.gameId() }
        : {}),
    };

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.validationErrors.set({});

    this.newsApi.update(id, patch).subscribe({
      next: (actualizada) => {
        this.originalNews.set(actualizada);
        this.isSaving.set(false);
        // Refrescar el contenido inicial del editor para que hasChanges se recalcule
        const contentActualizado = actualizada.content ?? { schemaVersion: 1, segments: [] };
        this.editorInitialContent.set(JSON.parse(JSON.stringify(contentActualizado)));
        alert('Noticia guardada correctamente');
      },
      error: (err) => {
        this.isSaving.set(false);
        if (err.status === 422) {
          this.errorMessage.set('Error de validación');
          this.validationErrors.set(err.errors ?? {});
        } else {
          this.errorMessage.set(err.message ?? 'Error al guardar la noticia');
        }
        console.error('[NewsForm] Error al guardar noticia:', err);
      },
    });
  }

  /**
   * Devuelve la ruta de vuelta al listado según el scope actual.
   */
  private backRoute(): string {
    switch (this.scopeType()) {
      case WebScope.ASSOCIATION: return '/admin/asociacion/noticias';
      case WebScope.GAME:        return '/admin/juego/noticias';
      default:                   return '/admin/noticias';
    }
  }

  /**
   * Devuelve la ruta de edición para una noticia recién creada.
   */
  private editRoute(id: number): string {
    switch (this.scopeType()) {
      case WebScope.ASSOCIATION: return `/admin/asociacion/noticias/${id}/editar`;
      case WebScope.GAME:        return `/admin/juego/noticias/${id}/editar`;
      default:                   return `/admin/noticias/${id}/editar`;
    }
  }
}
