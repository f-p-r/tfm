import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { ContextStore } from '../../core/context/context.store';
import { WebScope } from '../../core/web-scope.constants';
import { AssociationsApiService } from '../../core/associations/associations-api.service';
import { Association } from '../../core/associations/associations.models';
import { GamesStore } from '../../core/games/games.store';

/**
 * Página de listado de asociaciones.
 *
 * Scope: GLOBAL o GAME
 * - Si scopeType es GLOBAL (1): muestra todas las asociaciones
 * - Si scopeType es GAME (3): muestra asociaciones del juego scopeId
 */
@Component({
  selector: 'app-associations-page',
  imports: [],
  template: `
    <div class="ds-container">
        <header class="border-b border-neutral-medium pb-4">
          <h1 class="h1">Asociaciones</h1>
          @if (contextStore.scopeType() === WebScope.GAME) {
            <p class="text-sm text-neutral-dark mt-1">{{ gameStore.getById(contextStore.scopeId()!)?.name }}</p>
          }
        </header>

        <section class="mt-6">
          @if (loading()) {
            <p class="text-neutral-dark">Cargando...</p>
          } @else if (error()) {
            <p class="text-red-600">Error al cargar asociaciones: {{ error() }}</p>
          } @else if (associations().length === 0) {
            <p class="text-neutral-dark">No hay asociaciones disponibles.</p>
          } @else {
            <div class="overflow-x-auto">
              <table class="min-w-full bg-white border border-neutral-medium">
                <thead class="bg-neutral-light">
                  <tr>
                    <th class="px-4 py-2 text-left text-sm font-semibold text-neutral-dark border-b">Nombre</th>
                    <th class="px-4 py-2 text-left text-sm font-semibold text-neutral-dark border-b">Nombre corto</th>
                    <th class="px-4 py-2 text-left text-sm font-semibold text-neutral-dark border-b">Slug</th>
                    <th class="px-4 py-2 text-left text-sm font-semibold text-neutral-dark border-b">País</th>
                    <th class="px-4 py-2 text-left text-sm font-semibold text-neutral-dark border-b">Región</th>
                    <th class="px-4 py-2 text-left text-sm font-semibold text-neutral-dark border-b">Web</th>
                    <th class="px-4 py-2 text-left text-sm font-semibold text-neutral-dark border-b">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (association of associations(); track association.id) {
                    <tr
                      class="border-b hover:bg-neutral-light cursor-pointer transition-colors"
                      (click)="navigateToAssociation(association.slug)"
                    >
                      <td class="px-4 py-3 text-sm text-neutral-dark">{{ association.name }}</td>
                      <td class="px-4 py-3 text-sm text-neutral-dark">{{ association.shortname || '—' }}</td>
                      <td class="px-4 py-3 text-sm text-neutral-dark font-mono text-xs">{{ association.slug }}</td>
                      <td class="px-4 py-3 text-sm text-neutral-dark">{{ association.country?.name || association.country_id || '—' }}</td>
                      <td class="px-4 py-3 text-sm text-neutral-dark">{{ association.region?.name || association.region_id || '—' }}</td>
                      <td class="px-4 py-3 text-sm text-neutral-dark">
                        @if (association.web) {
                          <a [href]="association.web" target="_blank" rel="noopener" class="text-blue-600 hover:underline" (click)="$event.stopPropagation()">
                            Web
                          </a>
                        } @else {
                          —
                        }
                      </td>
                      <td class="px-4 py-3 text-sm">
                        @if (association.disabled) {
                          <span class="text-red-600">Deshabilitado</span>
                        } @else {
                          <span class="text-green-600">Activo</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationsPage {
  private readonly router = inject(Router);
  private readonly associationsApi = inject(AssociationsApiService);
  readonly contextStore = inject(ContextStore);
  readonly gameStore = inject(GamesStore);

  // Exponer WebScope para el template
  readonly WebScope = WebScope;

  readonly associations = signal<Association[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    // Effect que carga asociaciones cuando cambia el contexto
    // El scope ya está establecido por resolveScopeGuard antes de llegar aquí
    effect(() => {
      const scopeType = this.contextStore.scopeType();
      const scopeId = this.contextStore.scopeId();

      this.loading.set(true);
      this.error.set(null);

      if (scopeType === WebScope.GLOBAL) {
        // Cargar todas las asociaciones
        this.associationsApi.getAll().subscribe({
          next: (data: Association[]) => {
            this.associations.set(data);
            this.loading.set(false);
          },
          error: (err: any) => {
            this.error.set(err.message || 'Error desconocido');
            this.loading.set(false);
          },
        });
      } else if (scopeType === WebScope.GAME && scopeId) {
        // Cargar asociaciones del juego
        const game = this.gameStore.getById(scopeId);
        if (game) {
          // Filtrar asociaciones que tienen este juego en su lista
          this.associationsApi.getAll().subscribe({
            next: (data: Association[]) => {
              const gameAssociations = data.filter((a: Association) =>
                a.games?.some((g) => g.id === scopeId)
              );
              this.associations.set(gameAssociations);
              this.loading.set(false);
            },
            error: (err: any) => {
              this.error.set(err.message || 'Error desconocido');
              this.loading.set(false);
            },
          });
        } else {
          this.error.set('Juego no encontrado');
          this.loading.set(false);
        }
      } else {
        this.loading.set(false);
      }
    });
  }

  navigateToAssociation(slug: string): void {
    this.router.navigate(['/asociaciones', slug]);
  }
}
