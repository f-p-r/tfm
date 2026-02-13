/**
 * Página de administración de juegos.
 *
 * Muestra la lista completa de juegos con funcionalidad de:
 * - Visualización en tabla paginada
 * - Edición de juegos existentes
 *
 * Requiere permiso 'admin' para acceder.
 */

import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AdminSidebarContainerComponent } from '../../components/admin-sidebar/admin-sidebar-container.component';
import { AdminTableComponent } from '../../components/core/admin/table/admin-table.component';
import { AdminTableColumn, AdminTableAction } from '../../components/core/admin/table/admin-table.model';
import { GamesStore } from '../../core/games/games.store';

@Component({
  selector: 'app-admin-games-page',
  imports: [
    AdminSidebarContainerComponent,
    AdminTableComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Admin Shell -->
    <div class="ds-admin-shell">

      <!-- Sidebar -->
      <aside id="admin-sidebar" class="ds-admin-sidebar">
        <app-admin-sidebar-container />
      </aside>

      <!-- Main content -->
      <main class="ds-admin-main ds-container">
        <div class="flex-1 flex flex-col pt-6 min-h-0">

          <!-- Page header -->
          <div class="mb-6 shrink-0">
            <h1 class="h1">Gestión de Juegos</h1>
            <p class="text-neutral-medium mt-2">
              Administra los juegos disponibles en la plataforma
            </p>
          </div>

          <!-- Table Card -->
          <div class="ds-table-card flex-1">
            <app-admin-table
              [columns]="columns"
              [data]="paginatedData()"
              [actions]="actions"
              [total]="totalGames()"
              [page]="currentPage()"
              [pageSize]="pageSize"
              [isLoading]="isLoading()"
              (pageChange)="onPageChange($event)"
              (action)="onAction($event)"
            />
          </div>

        </div>
      </main>

    </div>
  `
})
export class AdminGamesPage {
  private readonly gamesStore = inject(GamesStore);
  private readonly router = inject(Router);

  // Paginación
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 15;

  // Estado de carga
  protected readonly isLoading = signal(false);

  // Configuración de columnas
  protected readonly columns: AdminTableColumn[] = [
    { key: 'id', label: 'ID', type: 'text', align: 'left' },
    { key: 'name', label: 'Nombre', type: 'text', align: 'left' },
    { key: 'slug', label: 'Slug', type: 'text', align: 'left' },
    { key: 'team_size', label: 'Tamaño equipos', type: 'text', align: 'center' },
    {
      key: 'disabled',
      label: 'Estado',
      type: 'badge',
      align: 'left',
      badgeConfig: {
        'false': 'ds-badge-active',
        'true': 'ds-badge-alert'
      },
      badgeLabels: {
        'false': 'Activo',
        'true': 'Deshabilitado'
      }
    }
  ];

  // Acciones disponibles
  protected readonly actions: AdminTableAction[] = [
    { action: 'edit', label: 'Modificar' }
  ];

  // Datos completos
  protected readonly allGames = computed(() => this.gamesStore.sortedGames());

  // Total de juegos
  protected readonly totalGames = computed(() => this.allGames().length);

  // Datos paginados
  protected readonly paginatedData = computed(() => {
    const games = this.allGames();
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;

    return games.slice(start, end).map(game => ({
      ...game,
      disabled: game.disabled.toString() // Convertir boolean a string para badges
    }));
  });

  constructor() {
    // Cargar juegos al inicializar
    this.loadGames();
  }

  private loadGames() {
    this.isLoading.set(true);
    this.gamesStore.loadOnce().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false)
    });
  }

  protected onPageChange(page: number) {
    this.currentPage.set(page);
  }

  protected onAction(event: { action: string; row: any }) {
    if (event.action === 'edit') {
      this.router.navigate(['/admin/juegos', event.row.id]);
    }
  }
}
