import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { PermissionsStore } from './permissions.store';
import { AuthzService } from './authz.service';
import { AuthService } from '../auth/auth.service';
import { ContextStore } from '../context/context.store';
import { WebScope } from '../web-scope.constants';
import { AuthzQueryBreakdownResponse } from './authz.models';
import { User } from '../auth/user.model';
import { HttpErrorResponse } from '@angular/common/http';

// ─── helpers ────────────────────────────────────────────────────────────────

const MOCK_USER: User = { id: 1, username: 'tester', email: 'tester@example.com' } as User;

function makeBreakdownResponse(
  allPermissions: string[],
  scopePerms: { scopeId: number; permissions: string[] }[] = [],
): AuthzQueryBreakdownResponse {
  return {
    scopeType: 2,
    all: true,
    allPermissions,
    results: scopePerms,
  };
}

// ─── suite ──────────────────────────────────────────────────────────────────

describe('PermissionsStore', () => {
  let store: PermissionsStore;
  let authzSpy: { query: ReturnType<typeof vi.fn>; clearCache: ReturnType<typeof vi.fn> };
  let authService: AuthService;
  let contextStore: ContextStore;

  function setupWithUser(user: User | null = MOCK_USER) {
    authzSpy.query.mockReturnValue(
      of(makeBreakdownResponse(['pages.edit'], [{ scopeId: 0, permissions: [] }]))
    );
    authService.currentUser.set(user);
    TestBed.flushEffects();
  }

  beforeEach(() => {
    authzSpy = {
      query: vi.fn().mockReturnValue(of(makeBreakdownResponse([]))),
      clearCache: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PermissionsStore,
        ContextStore,
        { provide: AuthzService, useValue: authzSpy },
        // AuthService real para poder manipular currentUser.signal
        AuthService,
      ],
    });

    store = TestBed.inject(PermissionsStore);
    authService = TestBed.inject(AuthService);
    contextStore = TestBed.inject(ContextStore);

    // Mock HTTP para que checkSession no falle
    vi.spyOn(authService as any, 'me').mockReturnValue(of(null));
  });

  // ── hasPermission() ──────────────────────────────────────────────────────

  describe('hasPermission()', () => {
    it('devuelve false cuando no hay permisos cargados', () => {
      expect(store.hasPermission('pages.edit')).toBe(false);
    });

    it('devuelve true si el permiso está en la lista', () => {
      (store as any).permissions.set(['pages.edit', 'news.create']);
      expect(store.hasPermission('pages.edit')).toBe(true);
    });

    it('devuelve false si el permiso no está en la lista', () => {
      (store as any).permissions.set(['news.create']);
      expect(store.hasPermission('admin')).toBe(false);
    });

    it('devuelve true para cualquier permiso si tiene wildcard "*"', () => {
      (store as any).permissions.set(['*']);
      expect(store.hasPermission('anything.at.all')).toBe(true);
    });
  });

  // ── hasAnyPermission() ───────────────────────────────────────────────────

  describe('hasAnyPermission()', () => {
    it('devuelve true si tiene al menos uno', () => {
      (store as any).permissions.set(['news.create']);
      expect(store.hasAnyPermission(['admin', 'news.create'])).toBe(true);
    });

    it('devuelve false si no tiene ninguno', () => {
      (store as any).permissions.set(['pages.edit']);
      expect(store.hasAnyPermission(['admin', 'news.create'])).toBe(false);
    });

    it('devuelve false con array vacío', () => {
      (store as any).permissions.set(['pages.edit']);
      expect(store.hasAnyPermission([])).toBe(false);
    });
  });

  // ── hasAllPermissions() ──────────────────────────────────────────────────

  describe('hasAllPermissions()', () => {
    it('devuelve true si tiene todos los permisos', () => {
      (store as any).permissions.set(['a', 'b', 'c']);
      expect(store.hasAllPermissions(['a', 'b'])).toBe(true);
    });

    it('devuelve false si falta alguno', () => {
      (store as any).permissions.set(['a', 'b']);
      expect(store.hasAllPermissions(['a', 'b', 'c'])).toBe(false);
    });

    it('devuelve true con array vacío (vacuamente verdadero)', () => {
      (store as any).permissions.set([]);
      expect(store.hasAllPermissions([])).toBe(true);
    });
  });

  // ── loadForCurrentScope() ────────────────────────────────────────────────

  describe('loadForCurrentScope()', () => {
    it('combina permisos wildcard y específicos del scope', () => {
      authzSpy.query.mockReturnValue(
        of(makeBreakdownResponse(
          ['global.perm'],
          [{ scopeId: 42, permissions: ['local.perm'] }]
        ))
      );
      contextStore.setScope(WebScope.ASSOCIATION, 42);

      store.loadForCurrentScope();

      expect(store.hasPermission('global.perm')).toBe(true);
      expect(store.hasPermission('local.perm')).toBe(true);
    });

    it('no duplica permisos si wildcard y scope tienen el mismo permiso', () => {
      authzSpy.query.mockReturnValue(
        of(makeBreakdownResponse(
          ['shared.perm'],
          [{ scopeId: 0, permissions: ['shared.perm'] }]
        ))
      );

      store.loadForCurrentScope();
      const perms = store.allPermissions();

      expect(perms.filter(p => p === 'shared.perm').length).toBe(1);
    });

    it('establece permisos vacíos y loading=false si hay error', () => {
      authzSpy.query.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      store.loadForCurrentScope();

      expect(store.allPermissions()).toEqual([]);
      expect(store.isLoading()).toBe(false);
    });

    it('llama a clearCache si el error es 401', () => {
      authzSpy.query.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 401 }))
      );

      store.loadForCurrentScope();

      expect(authzSpy.clearCache).toHaveBeenCalled();
    });
  });

  // ── waitForLoad() ────────────────────────────────────────────────────────

  describe('waitForLoad()', () => {
    it('se completa inmediatamente si loading=false', () => {
      (store as any).loading.set(false);
      let completed = false;
      store.waitForLoad().subscribe({ complete: () => (completed = true) });
      expect(completed).toBe(true);
    });

    it('espera hasta que la carga termina si loading=true', () => {
      const subject = new Subject<void>();
      authzSpy.query.mockReturnValue(subject.asObservable());

      store.loadForCurrentScope(); // loading pasa a true, no resuelve aún

      let completed = false;
      store.waitForLoad().subscribe({ complete: () => (completed = true) });
      expect(completed).toBe(false); // aún esperando

      // Resolver la carga
      store.loadForCurrentScope();
      // waitForLoad usa loadComplete$, no el observable directamente
      // Forzar resolución directa:
      (store as any).loadComplete$.next();
      expect(completed).toBe(true);
    });
  });

  // ── clear() ──────────────────────────────────────────────────────────────

  describe('clear()', () => {
    it('vacía los permisos y pone loading=false', () => {
      (store as any).permissions.set(['admin', 'pages.edit']);
      store.clear();
      expect(store.allPermissions()).toEqual([]);
      expect(store.isLoading()).toBe(false);
      expect(store.hasPermissions()).toBe(false);
    });
  });

  // ── Effects: reactividad a cambios de usuario y scope ────────────────────

  describe('effects (reactividad)', () => {
    it('limpia permisos al desloguear (currentUser → null)', () => {
      (store as any).permissions.set(['admin']);
      authService.currentUser.set(null);
      TestBed.flushEffects();

      expect(store.allPermissions()).toEqual([]);
    });

    it('recarga al cambiar el scope si hay usuario autenticado', () => {
      // Establecer usuario y dejar que el effect inicial se ejecute
      authzSpy.query.mockReturnValue(of(makeBreakdownResponse([])));
      authService.currentUser.set(MOCK_USER);
      TestBed.flushEffects();

      const callsAfterLogin = authzSpy.query.mock.calls.length;

      // Cambiar scope → debería disparar recarga
      contextStore.setScope(WebScope.GAME, 7);
      TestBed.flushEffects();

      expect(authzSpy.query.mock.calls.length).toBeGreaterThan(callsAfterLogin);
    });

    it('NO recarga al cambiar scope si no hay usuario', () => {
      authService.currentUser.set(null);
      TestBed.flushEffects();
      authzSpy.query.mockClear();

      contextStore.setScope(WebScope.GAME, 7);
      TestBed.flushEffects();

      expect(authzSpy.query).not.toHaveBeenCalled();
    });
  });
});
