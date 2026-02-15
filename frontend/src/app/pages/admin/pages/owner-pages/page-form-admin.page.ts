import { Component, OnInit, signal, computed, effect, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PagesService } from '../../../../core/pages/pages.service';
import { PageOwnerType, PageCreateDTO, PageUpdateDTO, PageDTO, PageOwnerScope } from '../../../../shared/content/page.dto';
import { PageContentDTO } from '../../../../shared/content/page-content.dto';
import { ContentSegmentsEditorComponent } from '../../../../shared/content/segments-editor/content-segments-editor.component';
import { HelpIComponent } from '../../../../shared/help/help-i/help-i.component';
import { HelpHoverDirective } from '../../../../shared/help/help-hover.directive';
import { HelpContentService } from '../../../../shared/help/help-content.service';
import { PAGE_CREATE_PACK } from './page-create.pack';
import { AdminSidebarContainerComponent } from '../../../../components/admin-sidebar/admin-sidebar-container.component';
import { ContextStore } from '../../../../core/context/context.store';

/**
 * Componente unificado para crear y editar páginas de contenido.
 * El modo (create/edit) se determina automáticamente según la presencia del parámetro pageId en la ruta.
 */
@Component({
  selector: 'app-page-form-admin',
  imports: [
    CommonModule,
    FormsModule,
    ContentSegmentsEditorComponent,
    HelpIComponent,
    HelpHoverDirective,
    AdminSidebarContainerComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './page-form-admin.page.html',
  styleUrl: './page-form-admin.page.css',
})
export class PageFormAdminPage implements OnInit {
  private readonly pagesService = inject(PagesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly helpContent = inject(HelpContentService);
  private readonly contextStore = inject(ContextStore);

  // Route params
  readonly pageId = signal<number | null>(null);
  readonly ownerType = signal<PageOwnerType | null>(null);
  readonly ownerId = signal<number | null>(null);

  // Mode detection
  readonly isEditMode = computed(() => this.pageId() !== null);

  // Datos originales (solo en edit)
  readonly originalPage = signal<PageDTO | null>(null);

  // Form fields
  readonly title = signal('');
  readonly slug = signal('');
  readonly published = signal(false);
  readonly classNames = signal('');
  readonly content = signal<PageContentDTO>({
    schemaVersion: 1,
    segments: [],
  });
  readonly editorInitialContent = signal<PageContentDTO | null>(null);

  // States
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isEditingSegment = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly validationErrors = signal<Record<string, string[]>>({});

  // Computed
  readonly hasValidContent = computed(() => {
    return this.content().segments.length > 0;
  });

  readonly canCreate = computed(() => {
    const hasTitle = this.title().trim() !== '';
    const hasSlug = this.slug().trim() !== '';
    return hasTitle && hasSlug && this.hasValidContent();
  });

  readonly hasChanges = computed(() => {
    if (!this.isEditMode()) return false;

    const original = this.originalPage();
    if (!original) return false;

    return (
      this.title() !== original.title ||
      this.slug() !== original.slug ||
      this.published() !== original.published ||
      JSON.stringify(this.content()) !== JSON.stringify(original.content)
    );
  });

  readonly ownerTypeLabel = computed(() => {
    const type = this.ownerType();
    if (type === '1') return 'Global';
    if (type === PageOwnerScope.ASSOCIATION) return 'Asociación';
    if (type === PageOwnerScope.GAME) return 'Juego';
    return 'Owner';
  });

  readonly pageTitle = computed(() => {
    if (this.isEditMode()) {
      const title = this.title();
      return title ? `Página ${title}` : 'Editar página';
    }
    return 'Nueva página';
  });

  readonly isSubmitDisabled = computed(() => {
    if (this.isEditingSegment()) return true;
    if (this.isEditMode()) {
      return !this.hasChanges() || !this.hasValidContent() || this.isSaving();
    }
    return !this.canCreate() || this.isSaving();
  });

  constructor() {
    // Establecer el pack de ayuda para esta pantalla
    this.helpContent.setPack(PAGE_CREATE_PACK);

    // Sync classNames changes to content
    effect(() => {
      const classNamesValue = this.classNames();
      this.content.update(c => ({ ...c, classNames: classNamesValue || undefined }));
    });
  }

  ngOnInit(): void {
    // Parse route params
    let pageIdParam = this.route.snapshot.paramMap.get('pageId');
    let ownerTypeParam = this.route.snapshot.paramMap.get('ownerType');
    let ownerIdParam = this.route.snapshot.paramMap.get('ownerId');

    // Si no hay paramMap, intentar parsear desde URL
    if (!ownerTypeParam) {
      const urlSegments = this.route.snapshot.url;
      // URL esperada: /admin/pages/1/create o /admin/pages/1/edit/123
      if (urlSegments.length >= 2 && urlSegments[0].path === 'admin' && urlSegments[1].path === 'pages') {
        ownerTypeParam = urlSegments[2]?.path ?? null;

        // Si el siguiente segmento es 'create' o 'edit', entonces ownerType='1' sin ownerId
        if (urlSegments[3]?.path === 'create') {
          ownerIdParam = null;
        } else if (urlSegments[3]?.path === 'edit') {
          ownerIdParam = null;
          pageIdParam = urlSegments[4]?.path ?? null;
        } else {
          // Tiene ownerId
          ownerIdParam = urlSegments[3]?.path ?? null;
          // Buscar 'create' o 'edit'
          if (urlSegments[4]?.path === 'create') {
            pageIdParam = null;
          } else if (urlSegments[4]?.path === 'edit') {
            pageIdParam = urlSegments[5]?.path ?? null;
          }
        }
      }
    }

    // Validate and set ownerType
    if (!ownerTypeParam) {
      this.errorMessage.set('Parámetro ownerType no válido');
      return;
    }

    const parsedOwnerType = this.parseOwnerType(ownerTypeParam);
    if (parsedOwnerType === null) {
      this.errorMessage.set('Parámetro ownerType no válido');
      return;
    }

    // Parse ownerId
    // 1. Si es global (tipo 1): ownerId es null
    // 2. Si hay ownerId en la URL: usar ese
    // 3. Si NO hay ownerId en la URL pero es tipo 2/3: leer del ContextStore
    let parsedOwnerId: number | null = null;

    if (parsedOwnerType === '1') {
      // Global: no necesita ownerId
      parsedOwnerId = null;
    } else if (ownerIdParam) {
      // Hay ownerId explícito en la URL
      parsedOwnerId = parseInt(ownerIdParam, 10);
      if (isNaN(parsedOwnerId)) {
        this.errorMessage.set('Parámetro ownerId no válido');
        return;
      }
    } else {
      // NO hay ownerId en la URL → leer del contexto actual
      const scopeType = this.contextStore.scopeType();
      const scopeId = this.contextStore.scopeId();

      // Verificar que el contexto actual coincida con el ownerType
      if (scopeType.toString() === parsedOwnerType && scopeId !== null) {
        parsedOwnerId = scopeId;
        console.log(`📌 [PageFormAdmin] Usando scopeId del contexto: ${parsedOwnerId}`);
      } else {
        this.errorMessage.set(`ownerType ${parsedOwnerType} requiere ownerId pero no está en la URL ni en el contexto actual`);
        return;
      }
    }

    // Parse pageId if in edit mode
    if (pageIdParam) {
      const parsedPageId = parseInt(pageIdParam, 10);
      if (isNaN(parsedPageId)) {
        this.errorMessage.set('ID de página no válido');
        return;
      }
      this.pageId.set(parsedPageId);
    }

    this.ownerType.set(parsedOwnerType);
    this.ownerId.set(parsedOwnerId);

    // Load page if in edit mode
    if (this.isEditMode()) {
      this.loadPage();
    }
  }

  private parseOwnerType(param: string): PageOwnerType | null {
    // Si es '1' (global), '2' o '3', es válido directamente
    if (param === '1' || param === PageOwnerScope.ASSOCIATION || param === PageOwnerScope.GAME) {
      return param as PageOwnerType;
    }
    // Si es número 1, 2 o 3, convertir a string
    const num = parseInt(param, 10);
    if (num === 1) return '1';
    if (num === 2) return PageOwnerScope.ASSOCIATION;
    if (num === 3) return PageOwnerScope.GAME;
    // Si es otro tipo futuro (news, event, page), devolver tal cual
    return param as PageOwnerType;
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
        this.editorInitialContent.set(JSON.parse(JSON.stringify(page.content)));
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

  onEditingStateChange(isEditing: boolean): void {
    this.isEditingSegment.set(isEditing);
  }

  onSubmit(): void {
    if (this.isEditMode()) {
      this.onSave();
    } else {
      this.onCreate();
    }
  }

  private onCreate(): void {
    const ownerType = this.ownerType();
    const ownerId = this.ownerId();

    if (ownerType === null) {
      this.errorMessage.set('Parámetros de ruta no válidos');
      return;
    }

    // Para scopeType 1 (global), ownerId puede ser null
    if (ownerType !== '1' && ownerId === null) {
      this.errorMessage.set('Parámetros de ruta no válidos');
      return;
    }

    if (!this.canCreate()) {
      // Determinar qué está faltando
      if (this.title().trim() === '' || this.slug().trim() === '') {
        this.errorMessage.set('Título y slug son obligatorios');
      } else if (this.content().segments.length === 0) {
        this.errorMessage.set('La página ha de tener al menos un segmento');
      }
      return;
    }

    const input: PageCreateDTO = {
      ownerType,
      ownerId: ownerId ?? 0,
      title: this.title(),
      slug: this.slug(),
      published: this.published(),
      content: this.content(),
    };

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.validationErrors.set({});

    this.pagesService.create(input).subscribe({
      next: (createdPage) => {
        this.isSaving.set(false);
        // Navigate to edit page
        if (ownerType === '1') {
          this.router.navigate(['/admin/pages', '1', 'edit', createdPage.id]);
        } else {
          this.router.navigate(['/admin/pages', ownerType, ownerId, 'edit', createdPage.id]);
        }
      },
      error: (err) => {
        this.isSaving.set(false);

        if (err.status === 422) {
          this.errorMessage.set('Error de validación');
          this.validationErrors.set(err.errors || {});
        } else {
          this.errorMessage.set(err.message || 'Error al crear la página');
          this.validationErrors.set({});
        }

        console.error(err);
      },
    });
  }

  private onSave(): void {
    const id = this.pageId();
    if (id === null) return;

    // Validar que tenga contenido
    if (!this.hasValidContent()) {
      this.errorMessage.set('La página debe tener al menos un segmento de contenido');
      return;
    }

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
