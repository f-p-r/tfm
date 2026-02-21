/**
 * Página de administración de juegos relacionados con una asociación.
 *
 * Permite:
 * - Ver juegos actualmente asociados en tabla
 * - Añadir nuevas asociaciones desde un desplegable
 * - Eliminar asociaciones existentes
 * - Confirmar todos los cambios de una vez (envío único a API)
 * - Cancelar y descartar cambios pendientes
 *
 * Importante: Los cambios son locales hasta confirmar. El desplegable se actualiza
 * dinámicamente mostrando solo juegos no asociados en el estado actual de la pantalla.
 */

import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { Location } from '@angular/common';
import { AdminSidebarContainerComponent } from '../../../components/admin-sidebar/admin-sidebar-container.component';
import { AdminPageSubtitleComponent } from '../../../components/core/admin/admin-page-subtitle/admin-page-subtitle.component';
import { AdminTableComponent } from '../../../components/core/admin/table/admin-table.component';
import { AdminTableColumn, AdminTableAction } from '../../../components/core/admin/table/admin-table.model';
import { AssociationsApiService } from '../../../core/associations/associations-api.service';
import { GamesApiService } from '../../../core/games/games-api.service';
import { Game } from '../../../core/games/games.models';
import { ContextStore } from '../../../core/context/context.store';

@Component({
  selector: 'app-admin-association-games-page',
  imports: [
    AdminSidebarContainerComponent,
    AdminPageSubtitleComponent,
    AdminTableComponent,
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
          <div class="mb-6 shrink-0">
            <h1 class="h1">Juegos Relacionados</h1>
            <app-admin-page-subtitle />
          </div>

          <!-- Alerta informativa -->
          <div class="ds-alert ds-alert-info mb-6 shrink-0">
            <strong>Información:</strong> Los cambios no se guardarán hasta que pulses "Confirmar Cambios". Puedes añadir o eliminar varios juegos antes de confirmar.
          </div>

          <!-- Mensaje de éxito -->
          @if (successMessage()) {
            <div class="ds-alert ds-alert-success mb-4 shrink-0 animate-fade-in">
              {{ successMessage() }}
            </div>
          }

          <!-- Mensaje de error -->
          @if (errorMessage()) {
            <div class="ds-alert ds-alert-error mb-4 shrink-0 animate-fade-in">
              {{ errorMessage() }}
            </div>
          }

          <!-- Añadir juego -->
          <div class="bg-white border border-neutral-medium rounded-lg p-6 mb-6 shrink-0">
            <h2 class="h3 mb-4">Añadir Juego</h2>
            <div class="flex gap-3 items-end">
              <div class="ds-field">
                <select
                  id="game-selector"
                  class="ds-select"
                  style="max-width: 30ch"
                  [value]="selectedGameId()"
                  (change)="onGameSelected($event)"
                  [disabled]="availableGames().length === 0 || isLoading()"
                >
                  <option value="">-- Selecciona un juego --</option>
                  @for (game of availableGames(); track game.id) {
                    <option [value]="game.id">{{ game.name }}</option>
                  }
                </select>
              </div>
              <button
                class="ds-btn ds-btn-primary"
                (click)="onAddGame()"
                [disabled]="!selectedGameId() || isLoading()"
              >
                Añadir
              </button>
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="flex gap-3 justify-end shrink-0 mb-4">
            <button
              class="ds-btn ds-btn-secondary"
              (click)="onCancel()"
              [disabled]="isLoading()"
            >
              Cancelar
            </button>
            <button
              class="ds-btn ds-btn-primary"
              (click)="onConfirmChanges()"
              [disabled]="!hasChanges() || isLoading()"
            >
              {{ isLoading() ? 'Guardando...' : 'Confirmar Cambios' }}
            </button>
          </div>

          <!-- Tabla de juegos asociados -->
          <div class="ds-table-card flex-1 min-h-0 mb-4">
            <app-admin-table
              [columns]="columns"
              [data]="transformedCurrentGames()"
              [actions]="actions"
              [pageSize]="pageSize"
              [isLoading]="isLoading()"
              (action)="onAction($event)"
            />
          </div>

        </div>
      </main>

    </div>

    <!-- Modal de confirmación para guardar cambios -->
    @if (showConfirmModal()) {
      <div class="ds-modal-backdrop">
        <div class="ds-modal-content max-w-md">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-neutral-medium">
            <h2 class="h3">Confirmar cambios</h2>
          </div>

          <!-- Body -->
          <div class="px-6 py-4">
            <p class="text-neutral-dark">
              ¿Confirmas que deseas guardar los cambios realizados en los juegos asociados?
            </p>
            @if (changesSummary(); as summary) {
              <ul class="mt-4 text-sm text-neutral-dark space-y-1">
                @if (summary.added > 0) {
                  <li><strong>Añadidos:</strong> {{ summary.added }} juego{{ summary.added > 1 ? 's' : '' }}</li>
                }
                @if (summary.removed > 0) {
                  <li><strong>Eliminados:</strong> {{ summary.removed }} juego{{ summary.removed > 1 ? 's' : '' }}</li>
                }
              </ul>
            }
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-neutral-medium flex justify-end gap-3">
            <button
              type="button"
              class="ds-btn ds-btn-secondary"
              (click)="onCancelConfirm()"
              [disabled]="isLoading()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="ds-btn ds-btn-primary"
              (click)="onExecuteSave()"
              [disabled]="isLoading()"
            >
              {{ isLoading() ? 'Guardando...' : 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal de confirmación de guardado exitoso -->
    @if (showSuccessModal()) {
      <div class="ds-modal-backdrop">
        <div class="ds-modal-content max-w-md">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-neutral-medium">
            <h2 class="h3">✓ Cambios guardados</h2>
          </div>

          <!-- Body -->
          <div class="px-6 py-4">
            <p class="text-neutral-dark">
              Los cambios en los juegos relacionados se han guardado correctamente.
            </p>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-neutral-medium flex justify-end gap-3">
            <button
              type="button"
              class="ds-btn ds-btn-primary"
              (click)="onCloseSuccessModal()"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminAssociationGamesPage {
  private readonly contextStore = inject(ContextStore);
  private readonly associationsApi = inject(AssociationsApiService);
  private readonly gamesApi = inject(GamesApiService);
  private readonly location = inject(Location);

  // Datos de la asociación
  protected readonly associationId = computed(() => this.contextStore.scopeId());

  // Todos los juegos del sistema
  protected readonly allGames = signal<Game[]>([]);

  // IDs de juegos originales desde la API
  protected readonly originalGameIds = signal<Set<number>>(new Set());

  // IDs de juegos actualmente en pantalla (modificables)
  protected readonly currentGameIds = signal<Set<number>>(new Set());

  // Juego seleccionado en el desplegable
  protected readonly selectedGameId = signal<string>('');

  // Estado
  protected readonly isLoading = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showConfirmModal = signal(false);
  protected readonly showSuccessModal = signal(false);

  // Computados

  /** Juegos disponibles para añadir (no asociados actualmente en pantalla) */
  protected readonly availableGames = computed(() => {
    const currentIds = this.currentGameIds();
    return this.allGames().filter(game => !currentIds.has(game.id) && !game.disabled);
  });

  /** Juegos actuales en pantalla (objetos completos) */
  protected readonly currentGames = computed(() => {
    const currentIds = this.currentGameIds();
    return this.allGames().filter(game => currentIds.has(game.id));
  });

  /** Datos transformados para la tabla */
  protected readonly transformedCurrentGames = computed(() => {
    return this.currentGames()
      .map(game => ({
        id: game.id,
        name: game.name
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  /** ¿Hay cambios pendientes? */
  protected readonly hasChanges = computed(() => {
    const original = this.originalGameIds();
    const current = this.currentGameIds();

    if (original.size !== current.size) return true;

    for (const id of current) {
      if (!original.has(id)) return true;
    }

    return false;
  });

  /** Resumen de cambios */
  protected readonly changesSummary = computed(() => {
    const original = this.originalGameIds();
    const current = this.currentGameIds();

    const added = Array.from(current).filter(id => !original.has(id)).length;
    const removed = Array.from(original).filter(id => !current.has(id)).length;

    return { added, removed };
  });

  // Configuración de tabla
  protected readonly pageSize = 20;

  protected readonly columns: AdminTableColumn[] = [
    { key: 'name', label: 'Nombre', type: 'text', align: 'left' }
  ];

  protected readonly actions: AdminTableAction[] = [
    { action: 'remove', label: 'Eliminar' }
  ];

  constructor() {
    this.loadData();
  }

  /**
   * Carga inicial de datos: todos los juegos y la asociación actual
   */
  private loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Cargar todos los juegos
    this.gamesApi.getGames(true).subscribe({
      next: (games) => {
        this.allGames.set(games);
        this.loadAssociationGames();
      },
      error: (err) => {
        console.error('Error cargando juegos:', err);
        this.errorMessage.set('Error al cargar los juegos disponibles');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Carga los juegos asociados a la asociación actual
   */
  private loadAssociationGames(): void {
    const id = this.associationId();
    if (!id) {
      this.errorMessage.set('No se pudo identificar la asociación');
      this.isLoading.set(false);
      return;
    }

    this.associationsApi.getById(id).subscribe({
      next: (association) => {
        const gameIds = new Set(association.games?.map(g => g.id) || []);
        this.originalGameIds.set(gameIds);
        this.currentGameIds.set(new Set(gameIds)); // Copia
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando asociación:', err);
        this.errorMessage.set('Error al cargar los datos de la asociación');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Maneja el cambio en el selector de juegos
   */
  protected onGameSelected(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedGameId.set(select.value);
  }

  /**
   * Añade el juego seleccionado a la lista actual
   */
  protected onAddGame(): void {
    const gameId = this.selectedGameId();
    if (!gameId) return;

    const numericId = parseInt(gameId, 10);
    const current = new Set(this.currentGameIds());
    current.add(numericId);
    this.currentGameIds.set(current);

    // Limpiar selección
    this.selectedGameId.set('');
  }

  /**
   * Maneja acciones de la tabla
   */
  protected onAction(event: { action: string; row: any }): void {
    if (event.action === 'remove') {
      this.removeGame(event.row.id);
    }
  }

  /**
   * Elimina un juego de la lista actual
   */
  private removeGame(gameId: number): void {
    const current = new Set(this.currentGameIds());
    current.delete(gameId);
    this.currentGameIds.set(current);
  }

  /**
   * Abre el modal de confirmación de cambios
   */
  protected onConfirmChanges(): void {
    this.showConfirmModal.set(true);
  }

  /**
   * Cancela el modal de confirmación
   */
  protected onCancelConfirm(): void {
    this.showConfirmModal.set(false);
  }

  /**
   * Ejecuta el guardado de cambios
   */
  protected onExecuteSave(): void {
    this.showConfirmModal.set(false);
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const id = this.associationId();
    if (!id) {
      this.errorMessage.set('No se pudo identificar la asociación');
      this.isLoading.set(false);
      return;
    }

    const gameIds = Array.from(this.currentGameIds());

    this.associationsApi.update(id, { game_ids: gameIds }).subscribe({
      next: () => {
        // Actualizar los IDs originales con los actuales
        this.originalGameIds.set(new Set(this.currentGameIds()));
        this.isLoading.set(false);
        this.showSuccessModal.set(true);
      },
      error: (err) => {
        console.error('Error guardando cambios:', err);
        this.errorMessage.set('Error al guardar los cambios. Por favor, inténtalo de nuevo.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Cierra el modal de éxito
   */
  protected onCloseSuccessModal(): void {
    this.showSuccessModal.set(false);
  }

  /**
   * Cancela y vuelve atrás
   */
  protected onCancel(): void {
    this.location.back();
  }
}
