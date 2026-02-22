import { ChangeDetectionStrategy, Component, inject, signal, effect, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ContextStore } from '../../core/context/context.store';
import { WebScope } from '../../core/web-scope.constants';
import { AssociationsApiService } from '../../core/associations/associations-api.service';
import { Association } from '../../core/associations/associations.models';
import { GamesStore } from '../../core/games/games.store';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { UserAssociationApiService } from '../../core/users/user-association-api.service';
import { forkJoin, of } from 'rxjs';
import { PageHelpService } from '../../shared/help/page-help.service';
import { getAssociationsHelp } from '../../shared/help/page-content/associations.help';

/**
 * Página de listado de asociaciones.
 *
 * Scope: GLOBAL o GAME
 * - Si scopeType es GLOBAL (1): muestra todas las asociaciones
 * - Si scopeType es GAME (3): muestra asociaciones del juego scopeId
 */
@Component({
  selector: 'app-associations-page',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="ds-container">
      <header class="border-b border-neutral-medium pb-4 pt-6">
        <h1 class="h1">{{ pageTitle() }}</h1>
        <p class="text-neutral-dark mt-3 leading-relaxed">
          Explora la lista de asociaciones vinculadas a nuestra plataforma.
          Clica en el nombre de cualquier asociación para conocer más detalles, eventos y noticias.
        </p>
      </header>

      <section class="mt-6">
        @if (loading()) {
          <p class="text-neutral-dark">Cargando...</p>
        } @else if (error()) {
          <p class="text-red-600">Error al cargar asociaciones: {{ error() }}</p>
        } @else if (myAssociations().length === 0 && otherAssociations().length === 0) {
          <p class="text-neutral-dark">No hay asociaciones disponibles.</p>
        } @else {
          <!-- Mis asociaciones -->
          @if (myAssociations().length > 0) {
            <section class="mb-8">
              <h3 class="h3 mb-4">Mis asociaciones</h3>
              <div class="ds-cards-container">
                @for (assoc of myAssociations(); track assoc.id) {
                  <article class="ds-card">
                    <div class="ds-card-assoc-header" [routerLink]="['/asociaciones', assoc.slug]">
                      <span class="ds-card-assoc-title">
                        {{ getDisplayName(assoc) }}
                      </span>
                    </div>
                    <div class="ds-card-body">
                      <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span class="ds-card-label">Ámbito:</span>
                        <span class="ds-card-text">
                          @if (assoc.region?.name) {
                            {{ assoc.region?.name }}, {{ assoc.country?.name || assoc.country_id }}
                          } @else {
                            {{ assoc.country?.name || assoc.country_id || '—' }}
                          }
                        </span>
                        @if (assoc.web) {
                          <span class="ds-card-text text-neutral-medium">•</span>
                          <a [href]="assoc.web" target="_blank" rel="noopener" class="ds-card-link">
                            Web externa ↗
                          </a>
                        }
                      </div>
                      @if (assoc.description) {
                        <div class="ds-card-section">
                          <p class="ds-card-text">{{ assoc.description }}</p>
                        </div>
                      }
                    </div>
                  </article>
                }
              </div>
            </section>

            <div class="ds-section-separator"></div>
          }

          <!-- Otras asociaciones -->
          <section>
            @if (myAssociations().length > 0) {
              <h3 class="h3 mb-4">Otras asociaciones</h3>
            }
            <div class="ds-cards-container">
              @for (assoc of otherAssociations(); track assoc.id) {
                <article class="ds-card">
                  <div class="ds-card-assoc-header" [routerLink]="['/asociaciones', assoc.slug]">
                    <span class="ds-card-assoc-title">
                      {{ getDisplayName(assoc) }}
                    </span>
                  </div>
                  <div class="ds-card-body">
                    <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span class="ds-card-label">Ámbito:</span>
                      <span class="ds-card-text">
                        @if (assoc.region?.name) {
                          {{ assoc.region?.name }}, {{ assoc.country?.name || assoc.country_id }}
                        } @else {
                          {{ assoc.country?.name || assoc.country_id || '—' }}
                        }
                      </span>
                      @if (assoc.web) {
                        <span class="ds-card-text text-neutral-medium">•</span>
                        <a [href]="assoc.web" target="_blank" rel="noopener" class="ds-card-link">
                          Web externa ↗
                        </a>
                      }
                    </div>
                    @if (assoc.description) {
                      <div class="ds-card-section">
                        <p class="ds-card-text">{{ assoc.description }}</p>
                      </div>
                    }
                  </div>
                </article>
              }
            </div>
          </section>
        }
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationsPage {
  private readonly router = inject(Router);
  private readonly associationsApi = inject(AssociationsApiService);
  private readonly userAssociationApi = inject(UserAssociationApiService);
  private readonly authService = inject(AuthService);
  readonly contextStore = inject(ContextStore);
  readonly gameStore = inject(GamesStore);

  // Exponer WebScope para el template
  readonly WebScope = WebScope;

  readonly associations = signal<Association[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Set de association_ids en las que el usuario es miembro
  private readonly userAssociationIds = signal<Set<number>>(new Set());

  // Separar asociaciones del usuario de las demás, ordenadas alfabéticamente
  readonly myAssociations = computed(() => {
    const userAssocIds = this.userAssociationIds();
    return this.associations()
      .filter(a => userAssocIds.has(a.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly otherAssociations = computed(() => {
    const userAssocIds = this.userAssociationIds();
    return this.associations()
      .filter(a => !userAssocIds.has(a.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly pageTitle = computed(() => {
    const scopeType = this.contextStore.scopeType();
    const scopeId = this.contextStore.scopeId();

    if (scopeType === WebScope.GAME && scopeId) {
      const game = this.gameStore.getById(scopeId);
      return game ? `Asociaciones de ${game.name}` : 'Asociaciones';
    }

    return 'Asociaciones';
  });

  constructor() {
    inject(PageHelpService).set(getAssociationsHelp(inject(ContextStore).scopeType()));
    // Effect que carga asociaciones cuando cambia el contexto
    // El scope ya está establecido por resolveScopeGuard antes de llegar aquí
    effect(() => {
      const scopeType = this.contextStore.scopeType();
      const scopeId = this.contextStore.scopeId();
      const currentUser = this.authService.currentUser();

      this.loading.set(true);
      this.error.set(null);

      // Preparar observables para cargar asociaciones y membresías del usuario
      let associations$;

      if (scopeType === WebScope.GLOBAL) {
        associations$ = this.associationsApi.getAll();
      } else if (scopeType === WebScope.GAME && scopeId) {
        const game = this.gameStore.getById(scopeId);
        if (!game) {
          this.error.set('Juego no encontrado');
          this.loading.set(false);
          return;
        }
        associations$ = this.associationsApi.getAll();
      } else {
        this.loading.set(false);
        return;
      }

      // Cargar membresías del usuario si está autenticado
      const userAssociations$ = currentUser?.id
        ? this.userAssociationApi.getAll({ user_id: currentUser.id })
        : of([]);

      // Ejecutar ambas peticiones en paralelo
      forkJoin({
        associations: associations$,
        userAssociations: userAssociations$
      }).subscribe({
        next: ({ associations, userAssociations }) => {
          // Filtrar por juego si es necesario
          let filteredAssociations = associations;
          if (scopeType === WebScope.GAME && scopeId) {
            filteredAssociations = associations.filter((a: Association) =>
              a.games?.some((g) => g.id === scopeId)
            );
          }

          this.associations.set(filteredAssociations);

          // Crear Set de association_ids del usuario
          const userAssocIds = new Set(
            userAssociations.map(ua => ua.association_id)
          );
          this.userAssociationIds.set(userAssocIds);

          this.loading.set(false);
        },
        error: (err: any) => {
          this.error.set(err.message || 'Error desconocido');
          this.loading.set(false);
        },
      });
    });
  }

  navigateToAssociation(slug: string): void {
    this.router.navigate(['/asociaciones', slug]);
  }

  getDisplayName(assoc: Association): string {
    if (assoc.shortname) {
      return `${assoc.name} - ${assoc.shortname}`;
    }
    return assoc.name;
  }
}
