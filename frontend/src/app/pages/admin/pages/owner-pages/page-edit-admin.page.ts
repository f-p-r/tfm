import { Component, OnInit, signal, computed, effect, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PagesService } from '../../../../core/pages/pages.service';
import { PageDTO, PageUpdateDTO, PageContentDTO } from '../../../../shared/content/page.dto';
import { ContentSegmentsEditorComponent } from '../../../../shared/content/segments-editor/content-segments-editor.component';
import { ContentSegmentsPreviewComponent } from '../../../../shared/content/segments-preview/content-segments-preview.component';

@Component({
  selector: 'app-page-edit-admin',
  imports: [CommonModule, FormsModule, ContentSegmentsEditorComponent, ContentSegmentsPreviewComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './page-edit-admin.page.html',
  styleUrl: './page-edit-admin.page.css',
})
export class PageEditAdminPage implements OnInit {
  private readonly pagesService = inject(PagesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Route params
  readonly pageId = signal<number | null>(null);
  readonly ownerType = signal<string | null>(null);
  readonly ownerId = signal<number | null>(null);

  // Original page data
  readonly originalPage = signal<PageDTO | null>(null);

  // Form fields
  readonly title = signal('');
  readonly slug = signal('');
  readonly published = signal(false);
  readonly content = signal<PageContentDTO>({
    schemaVersion: 1,
    segments: [],
  });

  // Loading/saving states
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Computed
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
    // Sync content signal with editor changes
    effect(() => {
      const content = this.content();
      // This effect ensures content signal is properly tracked
    });
  }

  ngOnInit(): void {
    // Parse route params
    const pageIdParam = this.route.snapshot.paramMap.get('pageId');
    const ownerTypeParam = this.route.snapshot.paramMap.get('ownerType');
    const ownerIdParam = this.route.snapshot.paramMap.get('ownerId');

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
        this.content.set(page.content);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Error al cargar la página');
        this.isLoading.set(false);
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

    this.pagesService.update(id, patch).subscribe({
      next: (updatedPage) => {
        this.originalPage.set(updatedPage);
        this.isSaving.set(false);
        alert('Página guardada correctamente');
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Error al guardar la página');
        this.isSaving.set(false);
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
