/**
 * Página de administración de juegos.
 *
 * Muestra la lista completa de juegos con funcionalidad de:
 * - Visualización en tabla paginada
 * - Edición de juegos existentes mediante modal
 *
 * Requiere permiso 'admin' para acceder.
 */

import { ChangeDetectionStrategy, Component, inject, signal, computed, viewChild } from '@angular/core';
import { AdminSidebarContainerComponent } from '../../components/admin-sidebar/admin-sidebar-container.component';
import { AdminTableComponent } from '../../components/core/admin/table/admin-table.component';
import { AdminTableColumn, AdminTableAction } from '../../components/core/admin/table/admin-table.model';
import { GamesApiService } from '../../core/games/games-api.service';
import { GameEditModalComponent } from '../../components/core/admin/game-edit-modal/game-edit-modal.component';
import { Game } from '../../core/games/games.models';

@Component({
  selector: 'app-admin-games-page',
  imports: [
    AdminSidebarContainerComponent,
    AdminTableComponent,
    GameEditModalComponent
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

    <!-- Modal de edición -->
    @if (showModal()) {
      <app-game-edit-modal
        [gameData]="selectedGame()"
        (save)="onSaveGame($event)"
        (cancel)="onCancelModal()"
      />
    }
  `
})
export class AdminGamesPage {
  private readonly gamesApi = inject(GamesApiService);

  // Datos locales (sin caché)
  private readonly games = signal<Game[]>([]);

  // Modal
  protected readonly showModal = signal(false);
  protected readonly selectedGame = signal<Game | null>(null);
  private readonly modalComponent = viewChild(GameEditModalComponent);

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
      align: 'center',
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

  // Datos ordenados alfabéticamente
  protected readonly allGames = computed(() => {
    const list = this.games();
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  });

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
    // Llamada directa a API incluyendo juegos deshabilitados
    this.gamesApi.getGames(true).subscribe({
      next: (games) => {
        this.games.set(games);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  protected onPageChange(page: number) {
    this.currentPage.set(page);
  }

  protected onAction(event: { action: string; row: any }) {
    if (event.action === 'edit') {
      // Convertir disabled string de vuelta a boolean
      const gameData = {
        ...event.row,
        disabled: event.row.disabled === 'true'
      };
      this.selectedGame.set(gameData);
      this.showModal.set(true);
    }
  }

  protected onSaveGame(event: { id: number; data: Partial<Game> }) {
    this.gamesApi.updateGame(event.id, event.data).subscribe({
      next: () => {
        // Cerrar modal
        this.showModal.set(false);
        this.selectedGame.set(null);

        // Recargar juegos desde API
        this.loadGames();
      },
      error: (err) => {
        // Mostrar error en el modal
        const errorMsg = err.error?.message || 'Error al guardar el juego';
        this.modalComponent()?.setError(errorMsg);
      }
    });
  }

  protected onCancelModal() {
    this.showModal.set(false);
    this.selectedGame.set(null);
  }
}
