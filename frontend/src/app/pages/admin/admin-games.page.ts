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
import { AdminPageSubtitleComponent } from '../../components/core/admin/admin-page-subtitle/admin-page-subtitle.component';
import { AdminTableComponent } from '../../components/core/admin/table/admin-table.component';
import { AdminTableColumn, AdminTableAction } from '../../components/core/admin/table/admin-table.model';
import { GamesApiService } from '../../core/games/games-api.service';
import { GameEditModalComponent } from '../../components/core/admin/game-edit-modal/game-edit-modal.component';
import { Game } from '../../core/games/games.models';
import { PageHelpService } from '../../shared/help/page-help.service';
import { ADMIN_GAMES_PAGE_HELP } from '../../shared/help/page-content/admin-games.help';

@Component({
  selector: 'app-admin-games-page',
  imports: [
    AdminSidebarContainerComponent,
    AdminPageSubtitleComponent,
    AdminTableComponent,
    GameEditModalComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Admin Shell -->
    <div class="ds-admin-shell">

      <!-- Sidebar -->
      <app-admin-sidebar-container />

      <!-- Main content -->
      <main class="ds-admin-main ds-container">
        <div class="flex-1 flex flex-col pt-6 min-h-0">

          <!-- Page header -->
          <div class="mb-6 shrink-0 flex justify-between items-start">
            <div>
              <h1 class="h1">Gestión de Juegos</h1>
              <app-admin-page-subtitle />
              <p class="text-neutral-medium mt-2">
                Administra los juegos disponibles en la plataforma
              </p>
            </div>
            <button class="ds-btn ds-btn-primary" (click)="onCreateGame()">
              Crear juego
            </button>
          </div>

          <!-- Table Card -->
          <div class="ds-table-card flex-1 min-h-0 mb-4">
            <app-admin-table
              [columns]="columns"
              [data]="transformedGames()"
              [actions]="actions"
              [pageSize]="pageSize"
              [isLoading]="isLoading()"
              (action)="onAction($event)"
            />
          </div>

        </div>
      </main>

    </div>

    <!-- Modal de creación/edición -->
    @if (showModal()) {
      <app-game-edit-modal
        [mode]="modalMode()"
        [gameData]="selectedGame()"
        (save)="onSaveGame($event)"
        (cancel)="onCancelModal()"
      />
    }

    <!-- Mensaje de confirmación -->
    @if (confirmationMessage()) {
      <div class="fixed top-4 right-4 z-1001 animate-fade-in">
        <div class="ds-alert ds-alert-success shadow-lg">
          {{ confirmationMessage() }}
        </div>
      </div>
    }
  `
})
export class AdminGamesPage {
  private readonly gamesApi = inject(GamesApiService);

  // Datos locales (sin caché)
  private readonly games = signal<Game[]>([]);

  // Modal
  protected readonly showModal = signal(false);
  protected readonly modalMode = signal<'create' | 'edit'>('edit');
  protected readonly selectedGame = signal<Game | null>(null);
  private readonly modalComponent = viewChild(GameEditModalComponent);

  // Confirmación
  protected readonly confirmationMessage = signal<string | null>(null);

  // Estado de carga
  protected readonly isLoading = signal(false);

  // Tamaño de página para la tabla
  protected readonly pageSize = 15;

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

  // Datos transformados (convertir boolean disabled a string para badges)
  protected readonly transformedGames = computed(() => {
    return this.games().map(game => ({
      ...game,
      disabled: game.disabled.toString()
    }));
  });

  constructor() {
    inject(PageHelpService).set(ADMIN_GAMES_PAGE_HELP);
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

  protected onCreateGame() {
    this.modalMode.set('create');
    this.selectedGame.set(null);
    this.showModal.set(true);
  }

  protected onAction(event: { action: string; row: any }) {
    if (event.action === 'edit') {
      // Convertir disabled string de vuelta a boolean
      const gameData = {
        ...event.row,
        disabled: event.row.disabled === 'true'
      };
      this.modalMode.set('edit');
      this.selectedGame.set(gameData);
      this.showModal.set(true);
    }
  }

  protected onSaveGame(event: { id: number | null; data: Partial<Game> }) {
    const operation = event.id === null
      ? this.gamesApi.createGame(event.data)
      : this.gamesApi.updateGame(event.id, event.data);

    const actionText = event.id === null ? 'creado' : 'modificado';

    operation.subscribe({
      next: (game) => {
        // Cerrar modal
        this.showModal.set(false);
        this.selectedGame.set(null);

        // Mostrar confirmación
        this.confirmationMessage.set(`Juego "${game.name}" ${actionText} correctamente`);
        setTimeout(() => this.confirmationMessage.set(null), 4000);

        // Recargar juegos desde API
        this.loadGames();
      },
      error: (err) => {
        // Mostrar error en el modal
        const errorMsg = err.error?.message || `Error al ${event.id === null ? 'crear' : 'guardar'} el juego`;
        this.modalComponent()?.setError(errorMsg);
      }
    });
  }

  protected onCancelModal() {
    this.showModal.set(false);
    this.selectedGame.set(null);
  }
}
