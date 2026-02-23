import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { NavigationEnd, Router, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { signal, computed } from '@angular/core';
import { ContextService } from './context.service';
import { ContextStore } from './context.store';
import { AuthService } from '../auth/auth.service';
import { PermissionsStore } from '../authz/permissions.store';
import { WebScope } from '../web-scope.constants';
import { User } from '../auth/user.model';
import { AdminAction } from './context.models';

// ─── helpers ────────────────────────────────────────────────────────────────

const MOCK_USER: User = { id: 1, username: 'tester', email: 'tester@example.com' } as User;

/** Crea un snapshot de ruta mínimo con data y params opcionales */
function makeSnapshot(data: Record<string, any> = {}, params: Record<string, any> = {}): ActivatedRouteSnapshot {
  return { data, params } as unknown as ActivatedRouteSnapshot;
}

// ─── Mocks ───────────────────────────────────────────────────────────────────

/** Mock de AuthService con signal mutable sin dependencia de HttpClient */
class MockAuthService {
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());
}

/** Mock de PermissionsStore que expone signals mutables para los tests */
class MockPermissionsStore {
  private readonly _permissions = signal<string[]>([]);
  private readonly _loading = signal(false);

  readonly allPermissions = computed(() => this._permissions());
  readonly isLoading = computed(() => this._loading());

  hasPermission(perm: string): boolean {
    const perms = this._permissions();
    return perms.includes('*') || perms.includes(perm);
  }

  hasAnyPermission(perms: string[]): boolean {
    return perms.some((p) => this.hasPermission(p));
  }

  hasAllPermissions(perms: string[]): boolean {
    return perms.every((p) => this.hasPermission(p));
  }

  waitForLoad() {
    return of(void 0);
  }

  // Helpers para tests
  setPermissions(perms: string[]) { this._permissions.set(perms); }
  setLoading(v: boolean) { this._loading.set(v); }
}

/** Mock de Router que permite emitir eventos de navegación manualmente */
class MockRouter {
  readonly events = new Subject<any>();
  readonly url = '/';
}

/** Mock de ActivatedRoute con firstChild nulo (ruta hoja) */
function makeRoute(data: Record<string, any> = {}, params: Record<string, any> = {}): ActivatedRoute {
  return {
    firstChild: null,
    snapshot: makeSnapshot(data, params),
  } as unknown as ActivatedRoute;
}

// ─── Setup ───────────────────────────────────────────────────────────────────

function setup(routeData: Record<string, any> = {}, routeParams: Record<string, any> = {}) {
  const routerMock = new MockRouter();
  const routeMock = makeRoute(routeData, routeParams);

  TestBed.configureTestingModule({
    providers: [
      ContextService,
      ContextStore,
      { provide: AuthService, useClass: MockAuthService },
      { provide: PermissionsStore, useClass: MockPermissionsStore },
      { provide: Router, useValue: routerMock },
      { provide: ActivatedRoute, useValue: routeMock },
    ],
  });

  const service = TestBed.inject(ContextService);
  const authService = TestBed.inject(AuthService) as unknown as MockAuthService;
  const store = TestBed.inject(PermissionsStore) as unknown as MockPermissionsStore;
  const contextStore = TestBed.inject(ContextStore);

  return { service, authService, store, contextStore, router: routerMock };
}

/** Emite un NavigationEnd en el router mock */
function navigate(router: MockRouter, url = '/') {
  router.events.next(new NavigationEnd(1, url, url));
}

/** Lee el valor actual de adminActions$ */
function actions(service: ContextService): AdminAction[] {
  let result: AdminAction[] = [];
  service.adminActions$.subscribe((a) => (result = a)).unsubscribe();
  return result;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ContextService', () => {

  // ── Estado inicial ────────────────────────────────────────────────────────

  describe('estado inicial', () => {
    it('adminActions$ emite [] antes de cualquier navegación o cambio', () => {
      const { service } = setup();
      expect(actions(service)).toEqual([]);
    });
  });

  // ── Effect: reacción a cambios de usuario ─────────────────────────────────

  describe('effect — cambios de usuario', () => {
    it('usuario null → emite []', () => {
      const { service, authService } = setup();

      authService.currentUser.set(null);
      TestBed.flushEffects();

      expect(actions(service)).toEqual([]);
    });

    it('usuario autenticado sin permisos → no genera acciones', () => {
      const { service, authService, store } = setup();

      store.setPermissions([]);
      authService.currentUser.set(MOCK_USER);
      TestBed.flushEffects();

      expect(actions(service)).toEqual([]);
    });

    it('usuario autenticado con permisos → genera acción de administración', () => {
      const { service, authService, store } = setup();

      store.setPermissions(['pages.edit']);
      authService.currentUser.set(MOCK_USER);
      TestBed.flushEffects();

      const result = actions(service);
      expect(result.length).toBeGreaterThan(0);
    });

    it('al desloguear con permisos previos → limpia las acciones', () => {
      const { service, authService, store } = setup();

      store.setPermissions(['pages.edit']);
      authService.currentUser.set(MOCK_USER);
      TestBed.flushEffects();
      expect(actions(service).length).toBeGreaterThan(0);

      authService.currentUser.set(null);
      TestBed.flushEffects();
      expect(actions(service)).toEqual([]);
    });

    it('si los permisos están cargando → no emite nuevas acciones', () => {
      const { service, authService, store } = setup();

      // Primero establecer acciones con permisos
      store.setPermissions(['pages.edit']);
      authService.currentUser.set(MOCK_USER);
      TestBed.flushEffects();
      const previousActionCount = actions(service).length;

      // Ahora marcar como loading — el effect debe salir sin emitir
      store.setLoading(true);
      store.setPermissions([]); // vaciar pero loading=true
      TestBed.flushEffects();

      // No debe haber cambiado (el effect sale antes de calcular)
      expect(actions(service).length).toBe(previousActionCount);
    });
  });

  // ── Effect: etiquetas según scope ─────────────────────────────────────────

  describe('effect — etiqueta de acción según scope', () => {
    it('scope GLOBAL → label "Administración"', () => {
      const { service, authService, store, contextStore } = setup();

      store.setPermissions(['pages.edit']);
      contextStore.setScope(WebScope.GLOBAL, null);
      authService.currentUser.set(MOCK_USER);
      TestBed.flushEffects();

      const adminAction = actions(service).find((a) => a.label === 'Administración');
      expect(adminAction).toBeDefined();
    });

    it('scope ASSOCIATION → label "Administrar Asociación"', () => {
      const { service, authService, store, contextStore } = setup();

      store.setPermissions(['pages.edit']);
      contextStore.setScope(WebScope.ASSOCIATION, 42);
      authService.currentUser.set(MOCK_USER);
      TestBed.flushEffects();

      const adminAction = actions(service).find((a) => a.label === 'Administrar Asociación');
      expect(adminAction).toBeDefined();
    });

    it('scope GAME → label "Administrar Juego"', () => {
      const { service, authService, store, contextStore } = setup();

      store.setPermissions(['pages.edit']);
      contextStore.setScope(WebScope.GAME, 7);
      authService.currentUser.set(MOCK_USER);
      TestBed.flushEffects();

      const adminAction = actions(service).find((a) => a.label === 'Administrar Juego');
      expect(adminAction).toBeDefined();
    });

    it('ruta de la acción siempre apunta a ["/admin"]', () => {
      const { service, authService, store } = setup();

      store.setPermissions(['pages.edit']);
      authService.currentUser.set(MOCK_USER);
      TestBed.flushEffects();

      const adminAction = actions(service).find((a) => a.label === 'Administración');
      expect(adminAction?.route).toEqual(['/admin']);
    });
  });

  // ── Effect: acción de edición de entidad ──────────────────────────────────

  describe('effect — acción "Editar Página" (entity en route.data)', () => {
    it('con pages.edit + data.entity → genera acción "Editar Página"', () => {
      const entity = { id: 5, ownerType: 2, ownerId: 42 };
      const { service, authService, store } = setup({ entity });

      store.setPermissions(['pages.edit']);
      authService.currentUser.set(MOCK_USER);
      TestBed.flushEffects();

      const editAction = actions(service).find((a) => a.label === 'Editar Página');
      expect(editAction).toBeDefined();
    });

    it('la ruta de edición contiene ownerType, ownerId e id de la entidad', () => {
      const entity = { id: 5, ownerType: 2, ownerId: 42 };
      const { service, authService, store } = setup({ entity });

      store.setPermissions(['pages.edit']);
      authService.currentUser.set(MOCK_USER);
      TestBed.flushEffects();

      const editAction = actions(service).find((a) => a.label === 'Editar Página');
      expect(editAction?.route).toContain(2);   // ownerType
      expect(editAction?.route).toContain(42);  // ownerId
      expect(editAction?.route).toContain(5);   // id
      expect(editAction?.route).toContain('edit');
    });

    it('sin pages.edit pero con data.entity → NO genera acción de edición', () => {
      const entity = { id: 5, ownerType: 2, ownerId: 42 };
      const { service, authService, store } = setup({ entity });

      store.setPermissions(['news.create']); // otro permiso, no pages.edit
      authService.currentUser.set(MOCK_USER);
      TestBed.flushEffects();

      const editAction = actions(service).find((a) => a.label === 'Editar Página');
      expect(editAction).toBeUndefined();
    });

    it('sin data.entity → NO genera acción de edición aunque tenga pages.edit', () => {
      const { service, authService, store } = setup({}); // sin entity

      store.setPermissions(['pages.edit']);
      authService.currentUser.set(MOCK_USER);
      TestBed.flushEffects();

      const editAction = actions(service).find((a) => a.label === 'Editar Página');
      expect(editAction).toBeUndefined();
    });

    it('con data.entity + pages.edit → genera TANTO edición COMO administración', () => {
      const entity = { id: 5, ownerType: 1, ownerId: 0 };
      const { service, authService, store } = setup({ entity });

      store.setPermissions(['pages.edit']);
      authService.currentUser.set(MOCK_USER);
      TestBed.flushEffects();

      const result = actions(service);
      expect(result.find((a) => a.label === 'Editar Página')).toBeDefined();
      expect(result.find((a) => a.label === 'Administración')).toBeDefined();
      expect(result.length).toBe(2);
    });
  });

  // ── Router events: NavigationEnd ──────────────────────────────────────────

  describe('NavigationEnd — suscripción al router', () => {
    it('usuario no autenticado: NavigationEnd emite []', () => {
      const { service, authService, router } = setup();

      authService.currentUser.set(null);
      navigate(router);

      expect(actions(service)).toEqual([]);
    });

    it('usuario autenticado: NavigationEnd con permisos → genera acciones', () => {
      const { service, authService, store, router } = setup();

      store.setPermissions(['pages.edit']);
      authService.currentUser.set(MOCK_USER);
      TestBed.flushEffects();

      navigate(router);

      const result = actions(service);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
