import { Component, OnInit, signal, computed, effect, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PagesService } from '../../../../core/pages/pages.service';
import { PageOwnerType, PageCreateDTO, PageOwnerScope } from '../../../../shared/content/page.dto';
import { PageContentDTO } from '../../../../shared/content/page-content.dto';
import { ContentSegmentsEditorComponent } from '../../../../shared/content/segments-editor/content-segments-editor.component';
import { HelpIComponent } from '../../../../shared/help/help-i/help-i.component';
import { HelpHoverDirective } from '../../../../shared/help/help-hover.directive';
import { HelpContentService } from '../../../../shared/help/help-content.service';
import { PAGE_CREATE_PACK } from './page-create.pack';
import { AdminSidebarContainerComponent } from '../../../../components/admin-sidebar/admin-sidebar-container.component';

@Component({
  selector: 'app-page-create-admin',
  imports: [CommonModule, FormsModule, ContentSegmentsEditorComponent, HelpIComponent, HelpHoverDirective, AdminSidebarContainerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './page-create-admin.page.html',
  styleUrl: './page-create-admin.page.css',
})
export class PageCreateAdminPage implements OnInit {
  private readonly pagesService = inject(PagesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly helpContent = inject(HelpContentService);

  // Route params
  readonly ownerType = signal<PageOwnerType | null>(null);
  readonly ownerId = signal<number | null>(null);

  // Form fields
  readonly title = signal('');
  readonly slug = signal('');
  readonly published = signal(false);
  readonly classNames = signal('');
  readonly content = signal<PageContentDTO>({
    schemaVersion: 1,
    segments: [],
  });

  // States
  readonly isCreating = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly validationErrors = signal<Record<string, string[]>>({});

  // Computed
  readonly canCreate = computed(() => {
    const hasTitle = this.title().trim() !== '';
    const hasSlug = this.slug().trim() !== '';
    const hasSegments = this.content().segments.length > 0;
    return hasTitle && hasSlug && hasSegments;
  });

  readonly ownerTypeLabel = computed(() => {
    const type = this.ownerType();
    if (type === '1') return 'Global';
    if (type === PageOwnerScope.ASSOCIATION) return 'Asociación';
    if (type === PageOwnerScope.GAME) return 'Juego';
    return 'Owner';
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
    let ownerTypeParam = this.route.snapshot.paramMap.get('ownerType');
    let ownerIdParam = this.route.snapshot.paramMap.get('ownerId');

    // Si no hay paramMap, intentar parsear desde URL (para rutas estáticas como /admin/pages/1/create)
    if (!ownerTypeParam) {
      const urlSegments = this.route.snapshot.url;
      // URL esperada: /admin/pages/1/create o /admin/pages/:ownerType/:ownerId/create
      if (urlSegments.length >= 2 && urlSegments[0].path === 'admin' && urlSegments[1].path === 'pages') {
        ownerTypeParam = urlSegments[2]?.path ?? null;
        ownerIdParam = urlSegments[3]?.path ?? null;
      }
    }

    if (!ownerTypeParam) {
      this.errorMessage.set('Parámetro ownerType no válido');
      return;
    }

    const parsedOwnerType = this.parseOwnerType(ownerTypeParam);

    if (parsedOwnerType === null) {
      this.errorMessage.set('Parámetro ownerType no válido');
      return;
    }

    // Para scopeType 1 (global), ownerId es opcional
    let parsedOwnerId: number | null = null;
    if (parsedOwnerType !== '1' && ownerIdParam) {
      parsedOwnerId = parseInt(ownerIdParam, 10);
      if (isNaN(parsedOwnerId)) {
        this.errorMessage.set('Parámetro ownerId no válido');
        return;
      }
    }

    this.ownerType.set(parsedOwnerType);
    this.ownerId.set(parsedOwnerId);
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

  onContentChange(newContent: PageContentDTO): void {
    this.content.set(newContent);
  }

  onCreate(): void {
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

    this.isCreating.set(true);
    this.errorMessage.set(null);
    this.validationErrors.set({});

    this.pagesService.create(input).subscribe({
      next: (createdPage) => {
        this.isCreating.set(false);
        // Navigate to edit page or back to list
        if (ownerType === '1') {
          this.router.navigate(['/admin/pages', '1', 'edit', createdPage.id]);
        } else {
          this.router.navigate(['/admin/pages', ownerType, ownerId, 'edit', createdPage.id]);
        }
      },
      error: (err) => {
        this.isCreating.set(false);

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
