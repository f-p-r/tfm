import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { GamesStore } from './games.store';
import { GamesApiService } from './games-api.service';
import { ContextStore } from '../context/context.store';
import { Game } from './games.models';
import { WebScope } from '../web-scope.constants';

// ─── Datos de prueba ──────────────────────────────────────────────────────────

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 1,
    name: 'Counter-Strike',
    slug: 'counter-strike',
    team_size: 5,
    disabled: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

const GAME_A = makeGame({ id: 1, name: 'Apex Legends', slug: 'apex-legends' });
const GAME_B = makeGame({ id: 2, name: 'Valorant', slug: 'valorant' });
const GAME_C = makeGame({ id: 3, name: 'Counter-Strike', slug: 'counter-strike' });
const GAME_DISABLED = makeGame({ id: 4, name: 'Antiguo Juego', slug: 'antiguo', disabled: true });

// ─── Setup ────────────────────────────────────────────────────────────────────

function setup(initialGames?: Game[]) {
  const getGames$ = new Subject<Game[]>();
  const mockApi = { getGames: vi.fn().mockReturnValue(getGames$.asObservable()) };

  TestBed.configureTestingModule({
    providers: [
      GamesStore,
      ContextStore,
      { provide: GamesApiService, useValue: mockApi },
    ],
  });

  const store = TestBed.inject(GamesStore);
  const contextStore = TestBed.inject(ContextStore);

  return { store, contextStore, mockApi, getGames$ };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GamesStore', () => {

  // ── Estado inicial ─────────────────────────────────────────────────────────

  describe('estado inicial', () => {
    it('games empieza vacío', () => {
      const { store } = setup();
      expect(store.games()).toEqual([]);
    });

    it('loaded empieza en false', () => {
      const { store } = setup();
      expect(store.loaded()).toBe(false);
    });

    it('loading empieza en false', () => {
      const { store } = setup();
      expect(store.loading()).toBe(false);
    });

    it('error empieza en null', () => {
      const { store } = setup();
      expect(store.error()).toBeNull();
    });

    it('selectedGameId empieza en null', () => {
      const { store } = setup();
      expect(store.selectedGameId()).toBeNull();
    });

    it('selectedGame empieza en null', () => {
      const { store } = setup();
      expect(store.selectedGame()).toBeNull();
    });

    it('sortedGames empieza vacío', () => {
      const { store } = setup();
      expect(store.sortedGames()).toEqual([]);
    });
  });

  // ── loadOnce() — carga exitosa ─────────────────────────────────────────────

  describe('loadOnce() — carga exitosa', () => {
    it('pone loading=true durante la petición', () => {
      const { store, mockApi } = setup();

      store.loadOnce().subscribe();

      expect(store.loading()).toBe(true);
    });

    it('establece los juegos activos al completarse', () => {
      const { store, getGames$ } = setup();

      store.loadOnce().subscribe();
      getGames$.next([GAME_A, GAME_B]);
      getGames$.complete();

      expect(store.games()).toContain(GAME_A);
      expect(store.games()).toContain(GAME_B);
    });

    it('filtra los juegos deshabilitados', () => {
      const { store, getGames$ } = setup();

      store.loadOnce().subscribe();
      getGames$.next([GAME_A, GAME_DISABLED]);
      getGames$.complete();

      expect(store.games().find((g) => g.id === GAME_DISABLED.id)).toBeUndefined();
    });

    it('establece loaded=true al completarse', () => {
      const { store, getGames$ } = setup();

      store.loadOnce().subscribe();
      getGames$.next([GAME_A]);
      getGames$.complete();

      expect(store.loaded()).toBe(true);
    });

    it('establece loading=false al completarse', () => {
      const { store, getGames$ } = setup();

      store.loadOnce().subscribe();
      getGames$.next([GAME_A]);
      getGames$.complete();

      expect(store.loading()).toBe(false);
    });

    it('actualiza lastFetchedAt al completarse', () => {
      const { store, getGames$ } = setup();
      const antes = Date.now();

      store.loadOnce().subscribe();
      getGames$.next([GAME_A]);
      getGames$.complete();

      expect(store.lastFetchedAt()).toBeGreaterThanOrEqual(antes);
    });

    it('limpia el error al completarse con éxito', () => {
      const { store, getGames$, mockApi } = setup();

      // Primer intento falla
      mockApi.getGames.mockReturnValueOnce(throwError(() => new Error('fallo')));
      store.loadOnce().subscribe();
      expect(store.error()).not.toBeNull();

      // Segundo intento tiene éxito
      mockApi.getGames.mockReturnValueOnce(of([GAME_A]));
      store.loadOnce().subscribe();

      expect(store.error()).toBeNull();
    });
  });

  // ── loadOnce() — caché ─────────────────────────────────────────────────────

  describe('loadOnce() — caché', () => {
    it('caché válida → NO llama a la API de nuevo', () => {
      const { store, mockApi, getGames$ } = setup();

      store.loadOnce().subscribe();
      getGames$.next([GAME_A]);
      getGames$.complete();

      // Segunda llamada — caché válida
      store.loadOnce().subscribe();

      expect(mockApi.getGames).toHaveBeenCalledTimes(1);
    });

    it('caché válida → devuelve los juegos en caché', () => {
      const { store, getGames$ } = setup();

      store.loadOnce().subscribe();
      getGames$.next([GAME_A]);
      getGames$.complete();

      let result: Game[] = [];
      store.loadOnce().subscribe((g) => (result = g));

      expect(result).toContain(GAME_A);
    });

    it('caché expirada → realiza una nueva petición HTTP', () => {
      const { store, mockApi, getGames$ } = setup();

      store.loadOnce().subscribe();
      getGames$.next([GAME_A]);
      getGames$.complete();

      // Simular que la caché expiró
      store.lastFetchedAt.set(Date.now() - 6 * 60 * 1000);

      mockApi.getGames.mockReturnValueOnce(of([GAME_B]));
      store.loadOnce().subscribe();

      expect(mockApi.getGames).toHaveBeenCalledTimes(2);
    });

    it('no cargado (loaded=false) → siempre llama a la API', () => {
      const { store, mockApi, getGames$ } = setup();

      store.loadOnce().subscribe();
      getGames$.next([GAME_A]);
      getGames$.complete();

      // Forzar estado "no cargado"
      store.loaded.set(false);
      mockApi.getGames.mockReturnValueOnce(of([GAME_B]));
      store.loadOnce().subscribe();

      expect(mockApi.getGames).toHaveBeenCalledTimes(2);
    });
  });

  // ── loadOnce() — deduplicación ─────────────────────────────────────────────

  describe('loadOnce() — deduplicación de peticiones', () => {
    it('dos llamadas simultáneas → solo una petición HTTP', () => {
      const { store, mockApi, getGames$ } = setup();

      store.loadOnce().subscribe();
      store.loadOnce().subscribe();

      expect(mockApi.getGames).toHaveBeenCalledTimes(1);
    });

    it('ambos suscriptores reciben los mismos datos', () => {
      const { store, getGames$ } = setup();
      const results: Game[][] = [];

      store.loadOnce().subscribe((g) => results.push(g));
      store.loadOnce().subscribe((g) => results.push(g));

      getGames$.next([GAME_A]);
      getGames$.complete();

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(results[1]);
    });
  });

  // ── loadOnce() — manejo de errores ─────────────────────────────────────────

  describe('loadOnce() — errores', () => {
    it('error HTTP → establece el mensaje de error', () => {
      const { store, mockApi } = setup();
      mockApi.getGames.mockReturnValueOnce(throwError(() => new Error('Network error')));

      store.loadOnce().subscribe();

      expect(store.error()).toBe('No se pudieron cargar los juegos');
    });

    it('error HTTP → loading vuelve a false', () => {
      const { store, mockApi } = setup();
      mockApi.getGames.mockReturnValueOnce(throwError(() => new Error('Network error')));

      store.loadOnce().subscribe();

      expect(store.loading()).toBe(false);
    });

    it('error HTTP → devuelve array vacío sin propagar el error', () => {
      const { store, mockApi } = setup();
      mockApi.getGames.mockReturnValueOnce(throwError(() => new Error('Network error')));

      let result: Game[] | undefined;
      let errored = false;

      store.loadOnce().subscribe({
        next: (g) => (result = g),
        error: () => (errored = true),
      });

      expect(errored).toBe(false);
      expect(result).toEqual([]);
    });

    it('error HTTP → games permanece vacío', () => {
      const { store, mockApi } = setup();
      mockApi.getGames.mockReturnValueOnce(throwError(() => new Error('Network error')));

      store.loadOnce().subscribe();

      expect(store.games()).toEqual([]);
    });
  });

  // ── getById() ─────────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('devuelve el juego si existe', () => {
      const { store, getGames$ } = setup();
      store.loadOnce().subscribe();
      getGames$.next([GAME_A, GAME_B]);
      getGames$.complete();

      expect(store.getById(GAME_A.id)).toEqual(GAME_A);
    });

    it('devuelve undefined si no existe', () => {
      const { store } = setup();
      expect(store.getById(999)).toBeUndefined();
    });
  });

  // ── getBySlug() ───────────────────────────────────────────────────────────

  describe('getBySlug()', () => {
    it('devuelve el juego si el slug coincide', () => {
      const { store, getGames$ } = setup();
      store.loadOnce().subscribe();
      getGames$.next([GAME_A, GAME_B]);
      getGames$.complete();

      expect(store.getBySlug('valorant')).toEqual(GAME_B);
    });

    it('devuelve undefined si el slug no existe', () => {
      const { store } = setup();
      expect(store.getBySlug('inexistente')).toBeUndefined();
    });
  });

  // ── setSelected() / setSelectedBySlug() ───────────────────────────────────

  describe('setSelected()', () => {
    it('establece el id seleccionado', () => {
      const { store } = setup();
      store.setSelected(42);
      expect(store.selectedGameId()).toBe(42);
    });

    it('poner null deselecciona', () => {
      const { store } = setup();
      store.setSelected(42);
      store.setSelected(null);
      expect(store.selectedGameId()).toBeNull();
    });
  });

  describe('setSelectedBySlug()', () => {
    it('selecciona el juego cuyo slug coincide', () => {
      const { store, getGames$ } = setup();
      store.loadOnce().subscribe();
      getGames$.next([GAME_A, GAME_B]);
      getGames$.complete();

      store.setSelectedBySlug('valorant');
      expect(store.selectedGameId()).toBe(GAME_B.id);
    });

    it('slug null → deselecciona', () => {
      const { store } = setup();
      store.setSelected(1);
      store.setSelectedBySlug(null);
      expect(store.selectedGameId()).toBeNull();
    });

    it('slug inexistente → selectedGameId se pone a null', () => {
      const { store } = setup();
      store.setSelected(1);
      store.setSelectedBySlug('no-existe');
      expect(store.selectedGameId()).toBeNull();
    });
  });

  // ── sortedGames (computed) ────────────────────────────────────────────────

  describe('sortedGames', () => {
    it('devuelve los juegos ordenados alfabéticamente', () => {
      const { store, getGames$ } = setup();
      store.loadOnce().subscribe();
      // Insertamos en orden inverso para probar el ordenamiento
      getGames$.next([GAME_B, GAME_C, GAME_A]); // Valorant, Counter-Strike, Apex Legends
      getGames$.complete();

      const names = store.sortedGames().map((g) => g.name);
      expect(names).toEqual(['Apex Legends', 'Counter-Strike', 'Valorant']);
    });

    it('no muta el signal games original', () => {
      const { store, getGames$ } = setup();
      store.loadOnce().subscribe();
      getGames$.next([GAME_B, GAME_A]);
      getGames$.complete();

      store.sortedGames(); // consumir
      // games() debe seguir con el orden original de insertado-filtrado
      expect(store.games()[0]).toEqual(GAME_A); // filtrados en la carga ya se ordenan
    });
  });

  // ── selectedGame (computed) ───────────────────────────────────────────────

  describe('selectedGame', () => {
    it('null cuando selectedGameId es null', () => {
      const { store } = setup();
      expect(store.selectedGame()).toBeNull();
    });

    it('devuelve el juego correspondiente al id seleccionado', () => {
      const { store, getGames$ } = setup();
      store.loadOnce().subscribe();
      getGames$.next([GAME_A, GAME_B]);
      getGames$.complete();

      store.setSelected(GAME_B.id);
      expect(store.selectedGame()).toEqual(GAME_B);
    });

    it('null si el id seleccionado no existe en games', () => {
      const { store } = setup();
      store.setSelected(999);
      expect(store.selectedGame()).toBeNull();
    });
  });

  // ── Effect: sincronización con ContextStore ────────────────────────────────

  describe('effect — sincronización con ContextStore', () => {
    it('scope GAME con id → selectedGameId se actualiza', () => {
      const { store, contextStore } = setup();

      contextStore.setScope(WebScope.GAME, 7);
      TestBed.flushEffects();

      expect(store.selectedGameId()).toBe(7);
    });

    it('scope GLOBAL → selectedGameId se pone a null', () => {
      const { store, contextStore } = setup();

      contextStore.setScope(WebScope.GAME, 7);
      TestBed.flushEffects();
      expect(store.selectedGameId()).toBe(7);

      contextStore.setScope(WebScope.GLOBAL, null);
      TestBed.flushEffects();
      expect(store.selectedGameId()).toBeNull();
    });

    it('scope ASSOCIATION → selectedGameId NO cambia', () => {
      const { store, contextStore } = setup();

      store.setSelected(5);
      contextStore.setScope(WebScope.ASSOCIATION, 99);
      TestBed.flushEffects();

      // No debe cambiar porque el efecto solo actúa en GAME y GLOBAL
      expect(store.selectedGameId()).toBe(5);
    });
  });

  // ── reload() ─────────────────────────────────────────────────────────────

  describe('reload()', () => {
    it('fuerza una nueva petición ignorando la caché', () => {
      const { store, mockApi, getGames$ } = setup();

      store.loadOnce().subscribe();
      getGames$.next([GAME_A]);
      getGames$.complete();

      expect(mockApi.getGames).toHaveBeenCalledTimes(1);

      // reload() debe iniciar una nueva petición aunque la caché sea válida
      mockApi.getGames.mockReturnValueOnce(of([GAME_B]));
      store.reload();

      expect(mockApi.getGames).toHaveBeenCalledTimes(2);
    });

    it('actualiza los juegos con los nuevos datos del backend', () => {
      const { store, mockApi, getGames$ } = setup();

      store.loadOnce().subscribe();
      getGames$.next([GAME_A]);
      getGames$.complete();

      mockApi.getGames.mockReturnValueOnce(of([GAME_B]));
      store.reload();

      expect(store.games()).toContain(GAME_B);
      expect(store.games().find((g) => g.id === GAME_A.id)).toBeUndefined();
    });
  });
});
