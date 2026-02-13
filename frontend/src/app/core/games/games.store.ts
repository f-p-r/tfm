import { inject, Injectable, signal, computed, effect } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, shareReplay, catchError } from 'rxjs/operators';
import { GamesApiService } from './games-api.service';
import { Game } from './games.models';
import { slugify } from '../../shared/utils/slugify';
import { ContextStore } from '../context/context.store';
import { WebScope } from '../web-scope.constants';

/** Tiempo de vida de la caché de juegos en milisegundos (5 minutos) */
const GAMES_TTL_MS = 5 * 60 * 1000; // 5 min

@Injectable({ providedIn: 'root' })
export class GamesStore {
  private readonly gamesApi = inject(GamesApiService);
  private readonly contextStore = inject(ContextStore);

  /** Lista de juegos cargados (solo activos: disabled=false) */
  readonly games = signal<Game[]>([]);

  /** Indica si se han cargado los juegos al menos una vez */
  readonly loaded = signal(false);

  /** Indica si hay una carga en progreso */
  readonly loading = signal(false);

  /** Mensaje de error si la última carga falló */
  readonly error = signal<string | null>(null);

  /** Timestamp (ms epoch) de la última carga exitosa */
  readonly lastFetchedAt = signal<number | null>(null);

  /** ID del juego seleccionado actualmente */
  readonly selectedGameId = signal<number | null>(null);

  /** Observable in-flight para deduplicar peticiones simultáneas */
  private inFlight$?: Observable<Game[]>;

  constructor() {
    // Sincronizar selectedGameId con el contexto actual
    effect(() => {
      const scopeType = this.contextStore.scopeType();
      const scopeId = this.contextStore.scopeId();

      if (scopeType === WebScope.GAME && scopeId !== null) {
        this.selectedGameId.set(scopeId);
      } else if (scopeType === WebScope.GLOBAL) {
        this.selectedGameId.set(null);
      }
    });
  }

  /** Lista de juegos ordenada alfabéticamente por nombre */
  readonly sortedGames = computed(() => {
    const list = this.games();
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  });

  /** Juego seleccionado actualmente (computed desde el ID) */
  readonly selectedGame = computed(() => {
    const id = this.selectedGameId();
    if (id === null) return null;
    return this.getById(id) ?? null;
  });

  /**
   * Carga los juegos desde el backend aplicando TTL y deduplicación.
   *
   * Si los datos están en caché y son recientes (< 5 min), devuelve la caché.
   * Si hay una petición en curso, reutiliza esa petición.
   *
   * @returns Observable con el array de juegos (solo activos).
   */
  loadOnce(): Observable<Game[]> {
    // Si tenemos caché válida, devolver datos inmediatamente
    if (this.loaded() && this.isCacheValid()) {
      return of(this.games());
    }

    // Si hay una petición en curso, reutilizarla
    if (this.inFlight$) {
      return this.inFlight$;
    }

    // Iniciar nueva petición
    this.loading.set(true);
    this.error.set(null);

    this.inFlight$ = this.gamesApi.getGames(false).pipe(
      tap((games) => {
        // Filtrar solo activos y ordenar por nombre
        const activeGames = games
          .filter((g) => !g.disabled)
          .sort((a, b) => a.name.localeCompare(b.name));

        this.games.set(activeGames);
        this.loaded.set(true);
        this.lastFetchedAt.set(Date.now());
        this.loading.set(false);
        this.error.set(null);
        this.inFlight$ = undefined;
      }),
      catchError((err) => {
        this.loading.set(false);
        this.error.set('No se pudieron cargar los juegos');
        this.inFlight$ = undefined;
        console.error('Error al cargar juegos:', err);
        return of([]);
      }),
      shareReplay(1)
    );

    return this.inFlight$;
  }

  /**
   * Busca un juego por su ID.
   *
   * @param id ID del juego a buscar.
   * @returns El juego si existe, undefined en caso contrario.
   */
  getById(id: number): Game | undefined {
    return this.games().find((g) => g.id === id);
  }

  /**
   * Busca un juego por su slug.
   *
   * @param slug Slug del juego a buscar.
   * @returns El juego si existe, undefined en caso contrario.
   */
  getBySlug(slug: string): Game | undefined {
    return this.games().find((g) => g.slug === slug);
  }

  /**
   * Establece el juego seleccionado por su ID.
   *
   * @param id ID del juego a seleccionar, o null para deseleccionar.
   */
  setSelected(id: number | null): void {
    this.selectedGameId.set(id);
  }

  /**
   * Establece el juego seleccionado por su slug.
   *
   * @param slug Slug del juego a seleccionar, o null para deseleccionar.
   */
  setSelectedBySlug(slug: string | null): void {
    if (slug === null) {
      this.selectedGameId.set(null);
      return;
    }
    const game = this.getBySlug(slug);
    this.selectedGameId.set(game?.id ?? null);
  }

  /**
   * Verifica si la caché es válida según el TTL.
   *
   * @returns true si la caché es reciente (< 5 min), false en caso contrario.
   */
  private isCacheValid(): boolean {
    const lastFetch = this.lastFetchedAt();
    if (lastFetch === null) return false;
    return (Date.now() - lastFetch) < GAMES_TTL_MS;
  }

  /**
   * Fuerza la recarga de juegos desde el backend, ignorando la caché.
   * Útil después de modificar, crear o eliminar juegos.
   */
  reload(): void {
    this.lastFetchedAt.set(null);
    this.loaded.set(false);
    this.loadOnce().subscribe();
  }
}
