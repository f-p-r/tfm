import { Component, OnInit, signal, computed, effect, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PagesService } from '../../../../core/pages/pages.service';
import { OwnerPagesSettingsService } from '../../../../core/pages/owner-pages-settings.service';
import { PageSummaryDTO, PageDTO, PageOwnerType } from '../../../../shared/content/page.dto';
import { ContentSegmentsPreviewComponent } from '../../../../shared/content/segments-preview/content-segments-preview.component';
import { WebScope } from '../../../../core/web-scope.constants';

@Component({
  selector: 'app-owner-pages-admin',
  imports: [CommonModule, FormsModule, ContentSegmentsPreviewComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './owner-pages-admin.page.html',
  styleUrl: './owner-pages-admin.page.css',
})
export class OwnerPagesAdminPage implements OnInit {
  private readonly pagesService = inject(PagesService);
  private readonly settingsService = inject(OwnerPagesSettingsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Route params
  readonly ownerType = signal<PageOwnerType | null>(null);
  readonly ownerId = signal<number | null>(null);

  // Data
  readonly pages = signal<PageSummaryDTO[]>([]);
  readonly homePageId = signal<number | null>(null);
  readonly selectedPageId = signal<number | null>(null);
  readonly selectedPageContent = signal<PageDTO | null>(null);

  // Loading states
  readonly isLoadingPages = signal(false);
  readonly isLoadingHomePage = signal(false);
  readonly isLoadingPageContent = signal(false);
  readonly isSavingHomePage = signal(false);

  // Computed
  readonly selectedPage = computed(() => {
    const id = this.selectedPageId();
    return this.pages().find((p) => p.id === id) ?? null;
  });

  readonly ownerTypeLabel = computed(() => {
    const type = this.ownerType();
    if (type === WebScope.ASSOCIATION) return 'Asociación';
    if (type === WebScope.GAME) return 'Juego';
    return 'Owner';
  });

  constructor() {
    // Load page content when selectedPageId changes
    effect(() => {
      const pageId = this.selectedPageId();
      if (pageId === null) {
        this.selectedPageContent.set(null);
        return;
      }

      this.isLoadingPageContent.set(true);
      this.pagesService.getById(pageId).subscribe({
        next: (page) => {
          this.selectedPageContent.set(page);
          this.isLoadingPageContent.set(false);
        },
        error: () => {
          this.isLoadingPageContent.set(false);
        },
      });
    });
  }

  ngOnInit(): void {
    // Parse route params
    const ownerTypeParam = this.route.snapshot.paramMap.get('ownerType');
    const ownerIdParam = this.route.snapshot.paramMap.get('ownerId');

    if (!ownerTypeParam || !ownerIdParam) {
      console.error('Missing route params');
      return;
    }

    const parsedOwnerType = this.parseOwnerType(ownerTypeParam);
    const parsedOwnerId = parseInt(ownerIdParam, 10);

    if (parsedOwnerType === null || isNaN(parsedOwnerId)) {
      console.error('Invalid route params');
      return;
    }

    this.ownerType.set(parsedOwnerType);
    this.ownerId.set(parsedOwnerId);

    // Load data
    this.loadPages();
    this.loadHomePageId();
  }

  private parseOwnerType(param: string): PageOwnerType | null {
    const num = parseInt(param, 10);
    if (!isNaN(num)) {
      return num as PageOwnerType;
    }
    return param as PageOwnerType;
  }

  private loadPages(): void {
    const ownerType = this.ownerType();
    const ownerId = this.ownerId();
    if (ownerType === null || ownerId === null) return;

    this.isLoadingPages.set(true);
    this.pagesService.listByOwner(ownerType, ownerId).subscribe({
      next: (pages) => {
        this.pages.set(pages);
        this.isLoadingPages.set(false);

        // Auto-select first page if none selected
        if (this.selectedPageId() === null && pages.length > 0) {
          this.selectedPageId.set(pages[0].id);
        }
      },
      error: () => {
        this.isLoadingPages.set(false);
      },
    });
  }

  private loadHomePageId(): void {
    const ownerType = this.ownerType();
    const ownerId = this.ownerId();
    if (ownerType === null || ownerId === null) return;

    this.isLoadingHomePage.set(true);
    this.settingsService.getHomePageId(ownerType, ownerId).subscribe({
      next: (pageId) => {
        this.homePageId.set(pageId);
        this.isLoadingHomePage.set(false);
      },
      error: () => {
        this.isLoadingHomePage.set(false);
      },
    });
  }

  onHomePageChange(pageId: number): void {
    const ownerType = this.ownerType();
    const ownerId = this.ownerId();
    if (ownerType === null || ownerId === null) return;

    this.isSavingHomePage.set(true);
    this.settingsService.setHomePageId(ownerType, ownerId, pageId).subscribe({
      next: () => {
        this.homePageId.set(pageId);
        this.isSavingHomePage.set(false);
      },
      error: () => {
        this.isSavingHomePage.set(false);
      },
    });
  }

  onSelectPage(pageId: number): void {
    this.selectedPageId.set(pageId);
  }

  onCreatePage(): void {
    const ownerType = this.ownerType();
    const ownerId = this.ownerId();
    if (ownerType === null || ownerId === null) return;

    this.router.navigate(['/admin/pages', ownerType, ownerId, 'create']);
  }

  onEditPage(pageId: number): void {
    const ownerType = this.ownerType();
    const ownerId = this.ownerId();
    if (ownerType === null || ownerId === null) return;

    this.router.navigate(['/admin/pages', ownerType, ownerId, 'edit', pageId]);
  }

  getPublishedLabel(published: boolean): string {
    return published ? 'Publicada' : 'Borrador';
  }
}
