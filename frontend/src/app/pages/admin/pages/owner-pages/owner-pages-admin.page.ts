import { Component, OnInit, signal, computed, effect, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PagesService } from '../../../../core/pages/pages.service';
import { OwnerPagesSettingsService } from '../../../../core/pages/owner-pages-settings.service';
import { PageSummaryDTO, PageDTO, PageOwnerType, PageOwnerScope } from '../../../../shared/content/page.dto';
import { ContentSegmentsPreviewComponent } from '../../../../shared/content/segments-preview/content-segments-preview.component';
import { AdminSidebarContainerComponent } from '../../../../components/admin-sidebar/admin-sidebar-container.component';
import { AdminPageSubtitleComponent } from '../../../../components/core/admin/admin-page-subtitle/admin-page-subtitle.component';
import { ContextStore } from '../../../../core/context/context.store';
import { PageHelpService } from '../../../../shared/help/page-help.service';
import { getAdminPagesListHelp } from '../../../../shared/help/page-content/admin-pages-list.help';

@Component({
  selector: 'app-owner-pages-admin',
  imports: [
    CommonModule,
    FormsModule,
    ContentSegmentsPreviewComponent,
    AdminSidebarContainerComponent,
    AdminPageSubtitleComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './owner-pages-admin.page.html',
  styleUrl: './owner-pages-admin.page.css',
})
export class OwnerPagesAdminPage implements OnInit {
  private readonly pagesService = inject(PagesService);
  private readonly settingsService = inject(OwnerPagesSettingsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contextStore = inject(ContextStore);

  // Parámetros de ruta
  readonly ownerType = signal<PageOwnerType | null>(null);
  readonly ownerId = signal<number | null>(null);

  // Datos
  readonly pages = signal<PageSummaryDTO[]>([]);
  readonly homePageId = signal<number | null>(null);
  readonly selectedPageId = signal<number | null>(null);
  readonly selectedPageContent = signal<PageDTO | null>(null);

  // Estados de carga
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
    if (type === '1') return 'Global';
    if (type === PageOwnerScope.ASSOCIATION) return 'Asociación';
    if (type === PageOwnerScope.GAME) return 'Juego';
    return 'Owner';
  });

  constructor() {
    inject(PageHelpService).set(getAdminPagesListHelp(inject(ContextStore).scopeType()));
    // Cargar contenido de página cuando selectedPageId cambia
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
    // Parsear parámetros de ruta
    let ownerTypeParam = this.route.snapshot.paramMap.get('ownerType');
    let ownerIdParam = this.route.snapshot.paramMap.get('ownerId');

    // Si no hay paramMap, intentar parsear desde URL (para rutas estáticas como /admin/pages/1)
    if (!ownerTypeParam) {
      const urlSegments = this.route.snapshot.url;
      // URL esperada: /admin/pages/1 o /admin/pages/:ownerType/:ownerId o /admin/pages/:ownerType
      if (urlSegments.length >= 2 && urlSegments[0].path === 'admin' && urlSegments[1].path === 'pages') {
        ownerTypeParam = urlSegments[2]?.path ?? null;
        ownerIdParam = urlSegments[3]?.path ?? null;
      }
    }

    if (!ownerTypeParam) {
      console.error('Missing ownerType param');
      return;
    }

    const parsedOwnerType = this.parseOwnerType(ownerTypeParam);

    if (parsedOwnerType === null) {
      console.error('Invalid ownerType param');
      return;
    }

    // Determinar ownerId:
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
        console.error('Invalid ownerId param');
        return;
      }
    } else {
      // NO hay ownerId en la URL → leer del contexto actual
      const scopeType = this.contextStore.scopeType();
      const scopeId = this.contextStore.scopeId();

      // Verificar que el contexto actual coincida con el ownerType
      if (scopeType.toString() === parsedOwnerType && scopeId !== null) {
        parsedOwnerId = scopeId;
        console.log(`[INFO] [OwnerPagesAdmin] Usando scopeId del contexto: ${parsedOwnerId}`);
      } else {
        console.error(`[WARN] [OwnerPagesAdmin] ownerType ${parsedOwnerType} requiere ownerId pero no está en la URL ni en el contexto actual (${scopeType}:${scopeId})`);
        return;
      }
    }

    this.ownerType.set(parsedOwnerType);
    this.ownerId.set(parsedOwnerId);

    // Cargar datos
    this.loadPages();
    this.loadHomePageId();
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

  private loadPages(): void {
    const ownerType = this.ownerType();
    const ownerId = this.ownerId();
    if (ownerType === null) return;
    // Para scopeType 1 (global), ownerId puede ser null
    if (ownerType !== '1' && ownerId === null) return;

    this.isLoadingPages.set(true);
    this.pagesService.listByOwner(ownerType, ownerId ?? 0).subscribe({
      next: (pages) => {
        this.pages.set(pages);
        this.isLoadingPages.set(false);

        // Seleccionar automáticamente la primera página si no hay ninguna seleccionada
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
    if (ownerType === null) return;
    // Para scopeType 1 (global), ownerId puede ser null
    if (ownerType !== '1' && ownerId === null) return;

    this.isLoadingHomePage.set(true);
    this.settingsService.getHomePageId(ownerType, ownerId ?? 0).subscribe({
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
    if (ownerType === null) return;
    // Para scopeType 1 (global), ownerId puede ser null
    if (ownerType !== '1' && ownerId === null) return;

    this.isSavingHomePage.set(true);
    this.settingsService.setHomePageId(ownerType, ownerId ?? 0, pageId).subscribe({
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
    if (ownerType === null) return;

    if (ownerType === '1') {
      this.router.navigate(['/admin/pages', '1', 'create']);
    } else {
      if (ownerId === null) return;
      this.router.navigate(['/admin/pages', ownerType, ownerId, 'create']);
    }
  }

  onEditPage(pageId: number): void {
    const ownerType = this.ownerType();
    const ownerId = this.ownerId();
    if (ownerType === null) return;

    if (ownerType === '1') {
      this.router.navigate(['/admin/pages', '1', 'edit', pageId]);
    } else {
      if (ownerId === null) return;
      this.router.navigate(['/admin/pages', ownerType, ownerId, 'edit', pageId]);
    }
  }

  getPublishedLabel(published: boolean): string {
    return published ? 'Publicada' : 'Borrador';
  }
}
