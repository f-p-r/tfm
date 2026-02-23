import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal, computed } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { NavigationEnd, Router, provideRouter } from '@angular/router';
import { UserMenuComponent } from './user-menu.component';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/auth/user.model';

// ─── Datos de prueba ──────────────────────────────────────────────────────────

const MOCK_USER: User = { id: 1, username: 'tester', name: 'Tester User' };

// ─── Setup ────────────────────────────────────────────────────────────────────

function setup(options: {
  variant?: 'desktop' | 'mobile';
  user?: User | null;
  logoutResult?: 'ok' | 'error';
} = {}) {
  const { variant = 'desktop', user = null, logoutResult = 'ok' } = options;

  const currentUser = signal<User | null>(user);
  const mockAuthService = {
    currentUser,
    isAuthenticated: computed(() => !!currentUser()),
    logout: vi.fn().mockReturnValue(
      logoutResult === 'ok' ? of(void 0) : throwError(() => ({ status: 500 }))
    ),
  };

  TestBed.configureTestingModule({
    imports: [UserMenuComponent],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: mockAuthService },
    ],
  });

  const fixture: ComponentFixture<UserMenuComponent> = TestBed.createComponent(UserMenuComponent);
  if (variant !== 'desktop') {
    fixture.componentRef.setInput('variant', variant);
  }
  fixture.detectChanges();

  const router = TestBed.inject(Router);

  return { fixture, component: fixture.componentInstance, mockAuthService, router, currentUser };
}

/** Devuelve el texto visible del elemento identificado por el selector */
function text(fixture: ComponentFixture<any>, selector: string): string {
  return fixture.debugElement.query(By.css(selector))?.nativeElement.textContent.trim() ?? '';
}

/** Comprueba si el elemento existe en el DOM */
function exists(fixture: ComponentFixture<any>, selector: string): boolean {
  return !!fixture.debugElement.query(By.css(selector));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UserMenuComponent', () => {

  // ── Estado inicial ─────────────────────────────────────────────────────────

  describe('estado inicial', () => {
    it('isOpen empieza en false', () => {
      const { component } = setup();
      expect(component.isOpen()).toBe(false);
    });

    it('variant por defecto es "desktop"', () => {
      const { component } = setup();
      expect(component.variant()).toBe('desktop');
    });
  });

  // ── displayName (computed) ─────────────────────────────────────────────────

  describe('displayName', () => {
    it('sin usuario → "Usuario"', () => {
      const { component } = setup({ user: null });
      expect(component.displayName()).toBe('Usuario');
    });

    it('usuario con username → muestra username', () => {
      const { component } = setup({ user: MOCK_USER });
      expect(component.displayName()).toBe('tester');
    });

    it('usuario sin username pero con name → muestra name', () => {
      const { component } = setup({ user: { id: 2, username: '', name: 'Sin Username' } });
      expect(component.displayName()).toBe('Sin Username');
    });

    it('usuario sin username ni name → "Usuario"', () => {
      const { component } = setup({ user: { id: 3, username: '', name: '' } });
      expect(component.displayName()).toBe('Usuario');
    });
  });

  // ── toggle() / close() ────────────────────────────────────────────────────

  describe('toggle() y close()', () => {
    it('toggle() abre el menú cuando está cerrado', () => {
      const { component } = setup();
      component.toggle();
      expect(component.isOpen()).toBe(true);
    });

    it('toggle() cierra el menú cuando está abierto', () => {
      const { component } = setup();
      component.toggle();
      component.toggle();
      expect(component.isOpen()).toBe(false);
    });

    it('close() cierra el menú', () => {
      const { component } = setup();
      component.toggle();
      component.close();
      expect(component.isOpen()).toBe(false);
    });

    it('close() no falla si el menú ya estaba cerrado', () => {
      const { component } = setup();
      expect(() => component.close()).not.toThrow();
    });
  });

  // ── logout() ─────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('llama a authService.logout()', () => {
      const { component, mockAuthService, router } = setup({ user: MOCK_USER });
      vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      component.logout();
      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
    });

    it('logout correcto → cierra el menú y navega a "/"', async () => {
      const { component, router } = setup({ user: MOCK_USER, logoutResult: 'ok' });
      vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      component.toggle();

      component.logout();
      await Promise.resolve();

      expect(component.isOpen()).toBe(false);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('logout con error → cierra el menú y navega a "/" igualmente', async () => {
      const { component, router } = setup({ user: MOCK_USER, logoutResult: 'error' });
      vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      component.toggle();

      component.logout();
      await Promise.resolve();

      expect(component.isOpen()).toBe(false);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });
  });

  // ── Variante desktop — template ──────────────────────────────────────────

  describe('variant="desktop" — no autenticado', () => {
    it('muestra el enlace de login', () => {
      const { fixture } = setup({ variant: 'desktop', user: null });
      expect(exists(fixture, 'a[routerLink="/login"]')).toBe(true);
    });

    it('NO muestra el botón de usuario', () => {
      const { fixture } = setup({ variant: 'desktop', user: null });
      expect(exists(fixture, 'button[aria-expanded]')).toBe(false);
    });
  });

  describe('variant="desktop" — autenticado', () => {
    it('muestra el displayName en el botón', () => {
      const { fixture } = setup({ variant: 'desktop', user: MOCK_USER });
      expect(text(fixture, 'button[aria-expanded]')).toContain('tester');
    });

    it('NO muestra el enlace de login', () => {
      const { fixture } = setup({ variant: 'desktop', user: MOCK_USER });
      expect(exists(fixture, 'a[routerLink="/login"]')).toBe(false);
    });

    it('el dropdown está oculto inicialmente', () => {
      const { fixture } = setup({ variant: 'desktop', user: MOCK_USER });
      // El div del dropdown solo se renderiza cuando isOpen()=true
      expect(exists(fixture, 'a[routerLink="/perfil"]')).toBe(false);
    });

    it('al hacer click en el botón se abre el dropdown', () => {
      const { fixture } = setup({ variant: 'desktop', user: MOCK_USER });
      const btn = fixture.debugElement.query(By.css('button[aria-expanded]'));
      btn.nativeElement.click();
      fixture.detectChanges();
      expect(exists(fixture, 'a[routerLink="/perfil"]')).toBe(true);
    });

    it('el botón refleja aria-expanded="true" cuando el menú está abierto', () => {
      const { fixture, component } = setup({ variant: 'desktop', user: MOCK_USER });
      component.toggle();
      fixture.detectChanges();
      const btn = fixture.debugElement.query(By.css('button[aria-expanded]'));
      expect(btn.nativeElement.getAttribute('aria-expanded')).toBe('true');
    });

    it('el botón refleja aria-expanded="false" cuando el menú está cerrado', () => {
      const { fixture } = setup({ variant: 'desktop', user: MOCK_USER });
      const btn = fixture.debugElement.query(By.css('button'));
      expect(btn.nativeElement.getAttribute('aria-expanded')).toBe('false');
    });
  });

  // ── Variante mobile — template ───────────────────────────────────────────

  describe('variant="mobile" — no autenticado', () => {
    it('muestra el enlace de login mobile', () => {
      const { fixture } = setup({ variant: 'mobile', user: null });
      expect(exists(fixture, 'a[routerLink="/login"]')).toBe(true);
    });
  });

  describe('variant="mobile" — autenticado', () => {
    it('muestra el displayName en el botón', () => {
      const { fixture } = setup({ variant: 'mobile', user: MOCK_USER });
      expect(text(fixture, 'button[aria-expanded]')).toContain('tester');
    });

    it('al abrir se muestran los enlaces de perfil y cierre de sesión', () => {
      const { fixture, component } = setup({ variant: 'mobile', user: MOCK_USER });
      component.toggle();
      fixture.detectChanges();
      expect(exists(fixture, 'a[routerLink="/perfil"]')).toBe(true);
    });
  });

  // ── Reactividad — cambio de usuario en tiempo real ────────────────────────

  describe('reactividad al cambio de usuario', () => {
    it('al autenticarse se muestra el nombre de usuario en el template', () => {
      const { fixture, currentUser } = setup({ variant: 'desktop', user: null });

      currentUser.set(MOCK_USER);
      fixture.detectChanges();

      expect(exists(fixture, 'button[aria-expanded]')).toBe(true);
    });

    it('al desloguear vuelve a mostrar el enlace de login', () => {
      const { fixture, currentUser } = setup({ variant: 'desktop', user: MOCK_USER });

      currentUser.set(null);
      fixture.detectChanges();

      expect(exists(fixture, 'a[routerLink="/login"]')).toBe(true);
    });
  });

  // ── Cerrar al navegar ────────────────────────────────────────────────────

  describe('cerrar dropdown al navegar', () => {
    it('NavigationEnd → cierra el menú', async () => {
      // No mockeamos navigateByUrl para que el router real emita NavigationEnd
      const { component, router } = setup({ variant: 'desktop', user: MOCK_USER });

      component.toggle();
      expect(component.isOpen()).toBe(true);

      await router.navigateByUrl('/');

      expect(component.isOpen()).toBe(false);
    });
  });

  // ── Cerrar al hacer clic fuera ────────────────────────────────────────────

  describe('cerrar dropdown al hacer clic fuera', () => {
    it('click fuera del componente → cierra el menú', () => {
      const { component } = setup({ variant: 'desktop', user: MOCK_USER });

      component.toggle();
      expect(component.isOpen()).toBe(true);

      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(component.isOpen()).toBe(false);
    });

    it('click dentro del componente → no cierra el menú', () => {
      const { fixture, component } = setup({ variant: 'desktop', user: MOCK_USER });

      component.toggle();
      fixture.detectChanges();

      // Hacer clic dentro del elemento nativo del componente
      const nativeEl = fixture.debugElement.nativeElement;
      nativeEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(component.isOpen()).toBe(true);
    });
  });
});
