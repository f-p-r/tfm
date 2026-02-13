import { Component, OnInit, signal, computed, effect, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PagesService } from '../../../../core/pages/pages.service';
import { PageDTO, PageUpdateDTO } from '../../../../shared/content/page.dto';
import { PageContentDTO } from '../../../../shared/content/page-content.dto';
import { ContentSegmentsEditorComponent } from '../../../../shared/content/segments-editor/content-segments-editor.component';
import { HelpHoverDirective } from '../../../../shared/help/help-hover.directive';
import { HelpIComponent } from '../../../../shared/help/help-i/help-i.component';
import { AdminSidebarContainerComponent } from '../../../../components/admin-sidebar/admin-sidebar-container.component';


/**
 * Componente de administración para la edición de páginas de contenido.
 * Permite editar el título, slug, estado de publicación y contenido segmentado de una página.
 * Maneja la carga, validación y guardado de cambios en páginas existentes.
 */
@Component({
  selector: 'app-page-edit-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ContentSegmentsEditorComponent,
    HelpHoverDirective,
    HelpIComponent,
    AdminSidebarContainerComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './page-edit-admin.page.html',
  styleUrl: './page-edit-admin.page.css',
})
export class PageEditAdminPage implements OnInit {
  private readonly pagesService = inject(PagesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Parámetros de ruta
  readonly pageId = signal<number | null>(null);
  readonly ownerType = signal<string | null>(null);
  readonly ownerId = signal<number | null>(null);

  // Datos originales de la página
  readonly originalPage = signal<PageDTO | null>(null);

  // Campos del formulario
  readonly title = signal('');
  readonly slug = signal('');
  readonly published = signal(false);
  readonly classNames = signal('');
  readonly content = signal<PageContentDTO>({
    schemaVersion: 1,
    segments: [],
  });

  // Estados de carga y guardado
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly validationErrors = signal<Record<string, string[]>>({});

  // Valores calculados
  readonly hasChanges = computed(() => {
    const original = this.originalPage();
    if (!original) return false;

    return (
      this.title() !== original.title ||
      this.slug() !== original.slug ||
      this.published() !== original.published ||
      JSON.stringify(this.content()) !== JSON.stringify(original.content)
    );
  });

  constructor() {
    // Sincronizar señal de contenido con cambios del editor
    effect(() => {
      const content = this.content();
      // Este efecto asegura que la señal de contenido se rastree correctamente
    });

    // Sincronizar cambios de classNames al contenido
    effect(() => {
      const classNamesValue = this.classNames();
      this.content.update(c => ({ ...c, classNames: classNamesValue || undefined }));
    });
  }

  ngOnInit(): void {
    // Analizar parámetros de ruta
    let pageIdParam = this.route.snapshot.paramMap.get('pageId');
    let ownerTypeParam = this.route.snapshot.paramMap.get('ownerType');
    let ownerIdParam = this.route.snapshot.paramMap.get('ownerId');

    // Si no hay paramMap, intentar parsear desde URL (para rutas estáticas como /admin/pages/1/edit/:pageId)
    if (!ownerTypeParam) {
      const urlSegments = this.route.snapshot.url;
      // URL esperada: /admin/pages/1/edit/123 o /admin/pages/:ownerType/:ownerId/edit/:pageId
      if (urlSegments.length >= 2 && urlSegments[0].path === 'admin' && urlSegments[1].path === 'pages') {
        ownerTypeParam = urlSegments[2]?.path ?? null;
        // Si el siguiente segmento es 'edit', entonces ownerType='1' sin ownerId
        if (urlSegments[3]?.path === 'edit') {
          ownerIdParam = null;
          pageIdParam = urlSegments[4]?.path ?? null;
        } else {
          ownerIdParam = urlSegments[3]?.path ?? null;
          pageIdParam = urlSegments[5]?.path ?? null; // Salta 'edit' en [4]
        }
      }
    }

    if (!pageIdParam) {
      this.errorMessage.set('ID de página no válido');
      return;
    }

    const parsedPageId = parseInt(pageIdParam, 10);
    if (isNaN(parsedPageId)) {
      this.errorMessage.set('ID de página no válido');
      return;
    }

    this.pageId.set(parsedPageId);
    this.ownerType.set(ownerTypeParam);
    this.ownerId.set(ownerIdParam ? parseInt(ownerIdParam, 10) : null);

    this.loadPage();
  }

  private loadPage(): void {
    const id = this.pageId();
    if (id === null) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.pagesService.getById(id).subscribe({
      next: (page) => {
        if (!page) {
          this.errorMessage.set('Página no encontrada');
          this.isLoading.set(false);
          return;
        }

        this.originalPage.set(page);
        this.title.set(page.title);
        this.slug.set(page.slug);
        this.published.set(page.published);
        this.classNames.set(page.content.classNames ?? '');
        this.content.set(page.content);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);

        if (err.status === 404) {
          this.errorMessage.set('Página no encontrada');
        } else {
          this.errorMessage.set(err.message || 'Error al cargar la página');
        }

        console.error(err);
      },
    });
  }

  onContentChange(newContent: PageContentDTO): void {
    this.content.set(newContent);
  }

  onSave(): void {
    const id = this.pageId();
    if (id === null) return;

    const patch: PageUpdateDTO = {
      title: this.title(),
      slug: this.slug(),
      published: this.published(),
      content: this.content(),
    };

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.validationErrors.set({});

    this.pagesService.update(id, patch).subscribe({
      next: (updatedPage) => {
        this.originalPage.set(updatedPage);
        this.isSaving.set(false);
        alert('Página guardada correctamente');
      },
      error: (err) => {
        this.isSaving.set(false);

        if (err.status === 422) {
          this.errorMessage.set('Error de validación');
          this.validationErrors.set(err.errors || {});
        } else {
          this.errorMessage.set(err.message || 'Error al guardar la página');
          this.validationErrors.set({});
        }

        console.error(err);
      },
    });
  }

  onCancel(): void {
    const ownerType = this.ownerType();
    const ownerId = this.ownerId();

    if (ownerType && (ownerType === '1' || ownerId !== null)) {
      if (ownerType === '1') {
        this.router.navigate(['/admin/pages', '1']);
      } else {
        this.router.navigate(['/admin/pages', ownerType, ownerId]);
      }
    } else {
      window.history.back();
    }
  }

  openPreview(): void {
    try {
      const previewData = {
        title: this.title(),
        content: this.content(),
      };
      sessionStorage.setItem('admin:pagePreview', JSON.stringify(previewData));
      window.open('/admin/pages/preview', '_blank');
    } catch (error) {
      console.error('Error al abrir vista previa:', error);
    }
  }
}
