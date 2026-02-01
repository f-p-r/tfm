import { Component, OnInit, signal, computed, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PagesService } from '../../../../core/pages/pages.service';
import { PageOwnerType, PageCreateDTO, PageOwnerScope } from '../../../../shared/content/page.dto';
import { PageContentDTO } from '../../../../shared/content/page-content.dto';
import { ContentSegmentsEditorComponent } from '../../../../shared/content/segments-editor/content-segments-editor.component';

@Component({
  selector: 'app-page-create-admin',
  imports: [CommonModule, FormsModule, ContentSegmentsEditorComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './page-create-admin.page.html',
  styleUrl: './page-create-admin.page.css',
})
export class PageCreateAdminPage implements OnInit {
  private readonly pagesService = inject(PagesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Route params
  readonly ownerType = signal<PageOwnerType | null>(null);
  readonly ownerId = signal<number | null>(null);

  // Form fields
  readonly title = signal('');
  readonly slug = signal('');
  readonly published = signal(false);
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
    return this.title().trim() !== '' && this.slug().trim() !== '';
  });

  readonly ownerTypeLabel = computed(() => {
    const type = this.ownerType();
    if (type === PageOwnerScope.ASSOCIATION) return 'Asociación';
    if (type === PageOwnerScope.GAME) return 'Juego';
    return 'Owner';
  });

  ngOnInit(): void {
    // Parse route params
    const ownerTypeParam = this.route.snapshot.paramMap.get('ownerType');
    const ownerIdParam = this.route.snapshot.paramMap.get('ownerId');

    if (!ownerTypeParam || !ownerIdParam) {
      this.errorMessage.set('Parámetros de ruta no válidos');
      return;
    }

    const parsedOwnerType = this.parseOwnerType(ownerTypeParam);
    const parsedOwnerId = parseInt(ownerIdParam, 10);

    if (parsedOwnerType === null || isNaN(parsedOwnerId)) {
      this.errorMessage.set('Parámetros de ruta no válidos');
      return;
    }

    this.ownerType.set(parsedOwnerType);
    this.ownerId.set(parsedOwnerId);
  }

  private parseOwnerType(param: string): PageOwnerType | null {
    // Si es '2' o '3', es válido directamente
    if (param === PageOwnerScope.ASSOCIATION || param === PageOwnerScope.GAME) {
      return param as PageOwnerType;
    }
    // Si es número 2 o 3, convertir a string
    const num = parseInt(param, 10);
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

    if (ownerType === null || ownerId === null) {
      this.errorMessage.set('Parámetros de ruta no válidos');
      return;
    }

    if (!this.canCreate()) {
      this.errorMessage.set('Título y slug son obligatorios');
      return;
    }

    const input: PageCreateDTO = {
      ownerType,
      ownerId,
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
        this.router.navigate(['/admin/pages', ownerType, ownerId, 'edit', createdPage.id]);
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

    if (ownerType && ownerId) {
      this.router.navigate(['/admin/pages', ownerType, ownerId]);
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
