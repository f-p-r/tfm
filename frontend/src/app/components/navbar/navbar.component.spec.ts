import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal, computed } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { NavbarComponent } from './navbar.component';
import { GamesStore } from '../../core/games/games.store';
import { ContextStore } from '../../core/context/context.store';
import { AssociationsResolveService } from '../../core/associations/associations-resolve.service';
import { ContextService } from '../../core/context/context.service';
import { AuthService } from '../../core/auth/auth.service';
import { WebScope } from '../../core/web-scope.constants';
import { Game } from '../../core/games/games.models';
import { AdminAction } from '../../core/context/context.models';
import { of } from 'rxjs';

// ─── Datos de prueba ──────────────────────────────────────────────────────────

const GAME_A: Game = { id: 1, name: 'Apex Legends', slug: 'apex-legends', team_size: 5, disabled: false, created_at: '', updated_at: '' };
const GAME_B: Game = { id: 2, name: 'Valorant', slug: 'valorant', team_size: 5, disabled: false, created_at: '', updated_at: '' };

// ─── Mocks ────────────────────────────────────────────────────────────────────

function makeGamesStoreMock(games: Game[] = []) {
  const _selectedId = signal<number | null>(null);
  const _games = signal<Game[]>(games);
  return {
    loadOnce: vi.fn().mockReturnValue(of(games)),
    games: _games,
    sortedGames: computed(() => [..._games()].sort((a, b) => a.name.localeCompare(b.name))),
    selectedGameId: _selectedId,
    setSelected: vi.fn((id: number | null) => _selectedId.set(id)),
    getById: vi.fn((id: number) => _games().find((g) => g.id === id)),
    // helper de test
    _setGames: (g: Game[]) => _games.set(g),
  };
}

function makeContextServiceMock(initial: AdminAction[] = []) {
  const subject = new BehaviorSubject<AdminAction[]>(initial);
  return { adminActions$: subject.asObservable(), _subject: subject };
}

function makeAuthServiceMock(user: any = null) {
  const currentUser = signal(user);
  return {
    currentUser,
    isAuthenticated: computed(() => !!currentUser()),
    logout: vi.fn().mockReturnValue(of(void 0)),
  };
}

// ─── Setup ────────────────────────────────────────────────────────────────────

interface SetupOptions {
  isAdmin?: boolean;
  games?: Game[];
  adminActions?: AdminAction[];
  scopeType?: WebScope;
  scopeId?: number | null;
  assocById?: any;
}

function setup(opts: SetupOptions = {}) {
  const {
    isAdmin = false,
    games = [],
    adminActions = [],
    scopeType = WebScope.GLOBAL,
    scopeId = null,
    assocById = undefined,
  } = opts;

  const gamesStoreMock = makeGamesStoreMock(games);
  const contextServiceMock = makeContextServiceMock(adminActions);
  const authServiceMock = makeAuthServiceMock();
  const associationsResolveMock = { getById: vi.fn().mockReturnValue(assocById) };

  TestBed.configureTestingModule({
    imports: [NavbarComponent],
    providers: [
      provideRouter([]),
      ContextStore,
      { provide: GamesStore, useValue: gamesStoreMock },
      { provide: ContextService, useValue: contextServiceMock },
      { provide: AuthService, useValue: authServiceMock },
      { provide: AssociationsResolveService, useValue: associationsResolveMock },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  });

  // Establecer scope en el store real
  const contextStore = TestBed.inject(ContextStore);
  contextStore.setScope(scopeType, scopeId);

  const fixture: ComponentFixture<NavbarComponent> = TestBed.createComponent(NavbarComponent);
  if (isAdmin) fixture.componentRef.setInput('isAdmin', true);
  fixture.detectChanges();

  const router = TestBed.inject(Router);

  return {
    fixture,
    component: fixture.componentInstance,
    router,
    contextStore,
    gamesStoreMock,
    contextServiceMock,
  };
}

function exists(fixture: ComponentFixture<any>, selector: string): boolean {
  return !!fixture.debugElement.query(By.css(selector));
}

function text(fixture: ComponentFixture<any>, selector: string): string {
  return fixture.debugElement.query(By.css(selector))?.nativeElement.textContent.trim() ?? '';
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NavbarComponent', () => {

  // ── Estado inicial ─────────────────────────────────────────────────────────

  describe('estado inicial', () => {
    it('mobileMenuOpen empieza en false', () => {
      const { component } = setup();
      expect(component.mobileMenuOpen()).toBe(false);
    });

    it('adminMenuOpen empieza en false', () => {
      const { component } = setup();
      expect(component.adminMenuOpen()).toBe(false);
    });

    it('associationMenuOpen empieza en false', () => {
      const { component } = setup();
      expect(component.associationMenuOpen()).toBe(false);
    });

    it('helpOpen empieza en false', () => {
      const { component } = setup();
      expect(component.helpOpen()).toBe(false);
    });
  });

  // ── navItems (computed) ────────────────────────────────────────────────────

  describe('navItems', () => {
    it('modo portal, scope GLOBAL → incluye Asociaciones, Eventos, Noticias, Contacto', () => {
      const { component } = setup({ scopeType: WebScope.GLOBAL });
      const labels = component.navItems().map((i) => i.label);
      expect(labels).toContain('Asociaciones');
      expect(labels).toContain('Eventos');
      expect(labels).toContain('Noticias');
      expect(labels).toContain('Contacto');
    });

    it('scope ASSOCIATION → excluye Asociaciones y Contacto', () => {
      const { component } = setup({ scopeType: WebScope.ASSOCIATION, scopeId: 1 });
      const labels = component.navItems().map((i) => i.label);
      expect(labels).not.toContain('Asociaciones');
      expect(labels).not.toContain('Contacto');
      expect(labels).toContain('Eventos');
      expect(labels).toContain('Noticias');
    });

    it('isAdmin=true → solo "Salir Admin." y "?"', () => {
      const { component } = setup({ isAdmin: true });
      const labels = component.navItems().map((i) => i.label);
      expect(labels).toEqual(['Salir Admin.', '?']);
    });
  });

  // ── filteredGames (computed) ───────────────────────────────────────────────

  describe('filteredGames', () => {
    it('sin query → devuelve todos los juegos', () => {
      const { component } = setup({ games: [GAME_A, GAME_B] });
      expect(component.filteredGames()).toHaveLength(2);
    });

    it('query coincidente → filtra por nombre (case-insensitive)', () => {
      const { component } = setup({ games: [GAME_A, GAME_B] });
      component.gamesQuery.set('apex');
      expect(component.filteredGames()).toHaveLength(1);
      expect(component.filteredGames()[0].name).toBe('Apex Legends');
    });

    it('query sin coincidencias → devuelve array vacío', () => {
      const { component } = setup({ games: [GAME_A, GAME_B] });
      component.gamesQuery.set('zzz');
      expect(component.filteredGames()).toHaveLength(0);
    });
  });

  // ── associationShortname / associationSlug ─────────────────────────────────

  describe('associationShortname y associationSlug', () => {
    it('scope GLOBAL → shortname ""', () => {
      const { component } = setup({ scopeType: WebScope.GLOBAL });
      expect(component.associationShortname()).toBe('');
    });

    it('scope ASSOCIATION con asociación → devuelve shortname', () => {
      const { component } = setup({
        scopeType: WebScope.ASSOCIATION,
        scopeId: 1,
        assocById: { id: 1, name: 'Asociación Alpha', shortname: 'Alpha', slug: 'alpha' },
      });
      expect(component.associationShortname()).toBe('Alpha');
    });

    it('scope ASSOCIATION sin shortname → usa name como fallback', () => {
      const { component } = setup({
        scopeType: WebScope.ASSOCIATION,
        scopeId: 1,
        assocById: { id: 1, name: 'Asociación Alpha', shortname: undefined, slug: 'alpha' },
      });
      expect(component.associationShortname()).toBe('Asociación Alpha');
    });

    it('scope ASSOCIATION → devuelve slug de la asociación', () => {
      const { component } = setup({
        scopeType: WebScope.ASSOCIATION,
        scopeId: 1,
        assocById: { id: 1, name: 'Asociación Alpha', shortname: 'Alpha', slug: 'alpha' },
      });
      expect(component.associationSlug()).toBe('alpha');
    });
  });

  // ── homeRoute (computed) ───────────────────────────────────────────────────

  describe('homeRoute', () => {
    it('scope GLOBAL → ["/"]', () => {
      const { component } = setup({ scopeType: WebScope.GLOBAL });
      expect(component.homeRoute()).toEqual(['/']);
    });

    it('scope GAME con juego en store → ["/juegos", slug]', () => {
      const { component } = setup({
        scopeType: WebScope.GAME,
        scopeId: GAME_A.id,
        games: [GAME_A],
      });
      expect(component.homeRoute()).toEqual(['/juegos', 'apex-legends']);
    });

    it('scope GAME sin juego en store → ["/"]', () => {
      const { component } = setup({ scopeType: WebScope.GAME, scopeId: 999, games: [] });
      expect(component.homeRoute()).toEqual(['/']);
    });

    it('scope ASSOCIATION con slug → ["/asociaciones", slug]', () => {
      const { component } = setup({
        scopeType: WebScope.ASSOCIATION,
        scopeId: 1,
        assocById: { id: 1, name: 'Alpha', slug: 'alpha' },
      });
      expect(component.homeRoute()).toEqual(['/asociaciones', 'alpha']);
    });
  });

  // ── displayName ────────────────────────────────────────────────────────────

  describe('displayName', () => {
    it('isAdmin=true, scope GLOBAL → "Administración de la web"', () => {
      const { component } = setup({ isAdmin: true, scopeType: WebScope.GLOBAL });
      expect(component.displayName).toBe('Administración de la web');
    });

    it('isAdmin=true, scope GAME con juego → nombre del juego', () => {
      const { component } = setup({
        isAdmin: true,
        scopeType: WebScope.GAME,
        scopeId: GAME_A.id,
        games: [GAME_A],
      });
      expect(component.displayName).toBe('Apex Legends');
    });

    it('isAdmin=true, scope GAME sin juego en store → "Administración"', () => {
      const { component } = setup({ isAdmin: true, scopeType: WebScope.GAME, scopeId: 999, games: [] });
      expect(component.displayName).toBe('Administración');
    });

    it('isAdmin=true, scope ASSOCIATION con asociación → nombre de la asociación', () => {
      const { component } = setup({
        isAdmin: true,
        scopeType: WebScope.ASSOCIATION,
        scopeId: 1,
        assocById: { id: 1, name: 'Alpha', slug: 'alpha' },
      });
      expect(component.displayName).toBe('Alpha');
    });

    it('isAdmin=false, mode "portal" → "Portal"', () => {
      const { component } = setup();
      expect(component.displayName).toBe('Portal');
    });
  });

  // ── Métodos de menú ────────────────────────────────────────────────────────

  describe('toggleMobileMenu() y closeMobileMenu()', () => {
    it('toggleMobileMenu() abre el menú', () => {
      const { component } = setup();
      component.toggleMobileMenu();
      expect(component.mobileMenuOpen()).toBe(true);
    });

    it('toggleMobileMenu() dos veces lo cierra', () => {
      const { component } = setup();
      component.toggleMobileMenu();
      component.toggleMobileMenu();
      expect(component.mobileMenuOpen()).toBe(false);
    });

    it('closeMobileMenu() cierra el menú', () => {
      const { component } = setup();
      component.toggleMobileMenu();
      component.closeMobileMenu();
      expect(component.mobileMenuOpen()).toBe(false);
    });
  });

  describe('toggleAdminMenu() y closeAdminMenu()', () => {
    it('toggleAdminMenu() abre el menú admin', () => {
      const { component } = setup();
      component.toggleAdminMenu();
      expect(component.adminMenuOpen()).toBe(true);
    });

    it('closeAdminMenu() cierra el menú admin', () => {
      const { component } = setup();
      component.toggleAdminMenu();
      component.closeAdminMenu();
      expect(component.adminMenuOpen()).toBe(false);
    });
  });

  describe('toggleAssociationMenu() y closeAssociationMenu()', () => {
    it('toggleAssociationMenu() abre el menú de asociación', () => {
      const { component } = setup();
      component.toggleAssociationMenu();
      expect(component.associationMenuOpen()).toBe(true);
    });

    it('closeAssociationMenu() cierra el menú de asociación', () => {
      const { component } = setup();
      component.toggleAssociationMenu();
      component.closeAssociationMenu();
      expect(component.associationMenuOpen()).toBe(false);
    });
  });

  // ── openHelp() / closeHelp() ───────────────────────────────────────────────

  describe('openHelp() y closeHelp()', () => {
    it('openHelp() → helpOpen=true', () => {
      const { component } = setup();
      component.openHelp();
      expect(component.helpOpen()).toBe(true);
    });

    it('openHelp() cierra el menú mobile', () => {
      const { component } = setup();
      component.toggleMobileMenu();
      component.openHelp();
      expect(component.mobileMenuOpen()).toBe(false);
    });

    it('closeHelp() → helpOpen=false', () => {
      const { component } = setup();
      component.openHelp();
      component.closeHelp();
      expect(component.helpOpen()).toBe(false);
    });
  });

  // ── exitAdmin() ────────────────────────────────────────────────────────────

  describe('exitAdmin()', () => {
    it('navega a "/"', () => {
      const { component, router } = setup({ isAdmin: true });
      vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      component.exitAdmin();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('cierra el menú mobile', () => {
      const { component } = setup({ isAdmin: true });
      component.toggleMobileMenu();
      component.exitAdmin();
      expect(component.mobileMenuOpen()).toBe(false);
    });
  });

  // ── onDesktopGameChange() / onMobileGameChange() ──────────────────────────

  describe('onDesktopGameChange()', () => {
    it('valor vacío → limpia selección y navega a "/"', () => {
      const { component, router, gamesStoreMock } = setup({ games: [GAME_A] });
      vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      const event = { target: { value: '' } } as unknown as Event;
      component.onDesktopGameChange(event);
      expect(gamesStoreMock.setSelected).toHaveBeenCalledWith(null);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('valor numérico → selecciona el juego y navega a su slug', () => {
      const { component, router, gamesStoreMock } = setup({ games: [GAME_A, GAME_B] });
      vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      const event = { target: { value: '1' } } as unknown as Event;
      component.onDesktopGameChange(event);
      expect(gamesStoreMock.setSelected).toHaveBeenCalledWith(1);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/juegos/apex-legends');
    });
  });

  describe('onMobileGameChange()', () => {
    it('cierra el menú mobile tras cambiar el juego', () => {
      const { component } = setup({ games: [GAME_A] });
      component.toggleMobileMenu();
      const event = { target: { value: '' } } as unknown as Event;
      component.onMobileGameChange(event);
      expect(component.mobileMenuOpen()).toBe(false);
    });
  });

  // ── NavigationEnd — cierra todos los menús ─────────────────────────────────

  describe('NavigationEnd → cierra todos los menús', () => {
    it('NavigationEnd cierra el menú mobile', async () => {
      const { component, router } = setup();
      component.toggleMobileMenu();
      expect(component.mobileMenuOpen()).toBe(true);
      await router.navigateByUrl('/');
      expect(component.mobileMenuOpen()).toBe(false);
    });

    it('NavigationEnd cierra el menú admin', async () => {
      const { component, router } = setup();
      component.toggleAdminMenu();
      expect(component.adminMenuOpen()).toBe(true);
      await router.navigateByUrl('/');
      expect(component.adminMenuOpen()).toBe(false);
    });

    it('NavigationEnd cierra el menú de asociación', async () => {
      const { component, router } = setup();
      component.toggleAssociationMenu();
      expect(component.associationMenuOpen()).toBe(true);
      await router.navigateByUrl('/');
      expect(component.associationMenuOpen()).toBe(false);
    });
  });

  // ── Click fuera cierra los dropdowns admin y asociación ───────────────────

  describe('click fuera del componente', () => {
    it('cierra el menú admin al hacer click fuera', () => {
      const { component } = setup();
      component.toggleAdminMenu();
      expect(component.adminMenuOpen()).toBe(true);
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(component.adminMenuOpen()).toBe(false);
    });

    it('cierra el menú de asociación al hacer click fuera', () => {
      const { component } = setup();
      component.toggleAssociationMenu();
      expect(component.associationMenuOpen()).toBe(true);
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(component.associationMenuOpen()).toBe(false);
    });
  });

  // ── Template: menú mobile ─────────────────────────────────────────────────

  describe('template — menú mobile', () => {
    it('ds-nav-mobile NO existe cuando mobileMenuOpen=false', () => {
      const { fixture } = setup();
      expect(exists(fixture, '.ds-nav-mobile')).toBe(false);
    });

    it('ds-nav-mobile aparece cuando mobileMenuOpen=true', () => {
      const { fixture, component } = setup();
      component.toggleMobileMenu();
      fixture.detectChanges();
      expect(exists(fixture, '.ds-nav-mobile')).toBe(true);
    });

    it('botón de menú tiene aria-expanded="false" por defecto', () => {
      const { fixture } = setup();
      const btn = fixture.debugElement.query(By.css('[aria-label="Menú"]'));
      expect(btn.nativeElement.getAttribute('aria-expanded')).toBe('false');
    });

    it('botón de menú tiene aria-expanded="true" al abrir', () => {
      const { fixture, component } = setup();
      component.toggleMobileMenu();
      fixture.detectChanges();
      const btn = fixture.debugElement.query(By.css('[aria-label="Menú"]'));
      expect(btn.nativeElement.getAttribute('aria-expanded')).toBe('true');
    });
  });

  // ── Template: adminActions en desktop ─────────────────────────────────────

  describe('template — adminActions desktop', () => {
    it('0 acciones → no se renderiza dropdown ni enlace admin', () => {
      const { fixture } = setup({ adminActions: [] });
      expect(exists(fixture, '[aria-expanded][class*="brand-primary"]')).toBe(false);
    });

    it('1 acción visible → enlace directo (sin dropdown)', () => {
      const actions: AdminAction[] = [{ label: 'Administración', route: ['/admin'], isVisible: true }];
      const { fixture } = setup({ adminActions: actions });
      fixture.detectChanges();
      // Debe renderizar el single-link (a.ds-nav-link.text-brand-primary)
      const link = fixture.debugElement.queryAll(By.css('a.ds-nav-link')).find(
        (el) => el.nativeElement.textContent.trim() === 'Administración'
      );
      expect(link).toBeDefined();
    });

    it('2+ acciones visibles → botón de dropdown', () => {
      const actions: AdminAction[] = [
        { label: 'Acción 1', route: ['/admin'], isVisible: true },
        { label: 'Acción 2', route: ['/admin/x'], isVisible: true },
      ];
      const { fixture, component } = setup({ adminActions: actions });
      fixture.detectChanges();
      // El botón del dropdown de admin
      const btn = fixture.debugElement.queryAll(By.css('button.ds-nav-link')).find(
        (el) => el.nativeElement.textContent.trim().startsWith('Administración')
      );
      expect(btn).toBeDefined();
    });
  });

  // ── noop() ────────────────────────────────────────────────────────────────

  describe('noop()', () => {
    it('no lanza error', () => {
      const { component } = setup();
      expect(() => component.noop()).not.toThrow();
    });
  });
});
