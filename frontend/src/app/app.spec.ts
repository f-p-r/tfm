import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter, RouterOutlet } from '@angular/router';
import { signal, Component } from '@angular/core';
import { of } from 'rxjs';
import { App } from './app';
import { AuthService } from './core/auth/auth.service';

// Stub page so all routes resolve → NavigationEnd fires for every URL
@Component({ template: '', standalone: true })
class StubPage {}

function makeMockAuth(loggedIn = false) {
  return {
    currentUser: signal<any>(loggedIn ? { id: 1, name: 'Test' } : null),
    checkSession: vi.fn().mockReturnValue(of(null)),
  };
}

async function setup(loggedIn = false) {
  const mockAuth = makeMockAuth(loggedIn);

  TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter([{ path: '**', component: StubPage }]),
      { provide: AuthService, useValue: mockAuth },
    ],
  });

  // Override template & imports to remove NavbarComponent dependency chain
  TestBed.overrideComponent(App, {
    set: {
      imports: [RouterOutlet],
      template: '<router-outlet></router-outlet>',
    },
  });

  const fixture = TestBed.createComponent(App);
  const component = fixture.componentInstance as any; // acceso a miembros protegidos/privados
  const router = TestBed.inject(Router);

  fixture.detectChanges();
  return { fixture, component, router, mockAuth };
}

describe('App (root component)', () => {
  it('should create', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should render router-outlet', async () => {
    const { fixture } = await setup();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  // ------------------------------------------------------------------ noNavbar (via private hasNoNavbar method)
  describe('hasNoNavbar private logic', () => {
    it('returns false for root route "/"', async () => {
      const { component } = await setup();
      expect(component.hasNoNavbar('/')).toBe(false);
    });

    it('returns true for /login', async () => {
      const { component } = await setup();
      expect(component.hasNoNavbar('/login')).toBe(true);
    });

    it('returns true for /auth/callback', async () => {
      const { component } = await setup();
      expect(component.hasNoNavbar('/auth/callback')).toBe(true);
    });

    it('returns true for /styleguide', async () => {
      const { component } = await setup();
      expect(component.hasNoNavbar('/styleguide')).toBe(true);
    });

    it('returns true for /prototypes', async () => {
      const { component } = await setup();
      expect(component.hasNoNavbar('/prototypes')).toBe(true);
    });

    it('returns true for URL ending with /pages/preview', async () => {
      const { component } = await setup();
      expect(component.hasNoNavbar('/some/pages/preview')).toBe(true);
    });

    it('returns false for /admin', async () => {
      const { component } = await setup();
      expect(component.hasNoNavbar('/admin')).toBe(false);
    });

    it('returns false for /profile', async () => {
      const { component } = await setup();
      expect(component.hasNoNavbar('/profile')).toBe(false);
    });
  });

  // ------------------------------------------------------------------ freeLayout (via private hasFreeLayout method)
  describe('hasFreeLayout private logic', () => {
    it('returns true for root route "/" (non-admin)', async () => {
      const { component } = await setup();
      expect(component.hasFreeLayout('/')).toBe(true);
    });

    it('returns false for /admin', async () => {
      const { component } = await setup();
      expect(component.hasFreeLayout('/admin')).toBe(false);
    });

    it('returns false for /admin/users', async () => {
      const { component } = await setup();
      expect(component.hasFreeLayout('/admin/users')).toBe(false);
    });

    it('returns true for /admin/pages/preview (exception)', async () => {
      const { component } = await setup();
      expect(component.hasFreeLayout('/admin/pages/preview')).toBe(true);
    });
  });

  // ------------------------------------------------------------------ isAdminMode signal (via router navigation)
  describe('isAdminMode signal', () => {
    it('is false on root route', async () => {
      const { component } = await setup();
      expect(component.isAdminMode()).toBe(false);
    });

    it('is true after navigating to /admin', async () => {
      const { component, router, fixture } = await setup();
      await router.navigateByUrl('/admin');
      fixture.detectChanges();
      expect(component.isAdminMode()).toBe(true);
    });

    it('is false after navigating to /profile', async () => {
      const { component, router, fixture } = await setup();
      await router.navigateByUrl('/profile');
      fixture.detectChanges();
      expect(component.isAdminMode()).toBe(false);
    });
  });

  // ------------------------------------------------------------------ ngOnInit (visibilitychange)
  describe('ngOnInit — visibilitychange handler', () => {
    it('calls checkSession when tab becomes visible and user is logged in', async () => {
      const { mockAuth } = await setup(true /* loggedIn */);
      // ngOnInit already ran via detectChanges() during setup

      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockAuth.checkSession).toHaveBeenCalled();
    });

    it('does NOT call checkSession when tab becomes visible but user is NOT logged in', async () => {
      const { mockAuth } = await setup(false /* not logged in */);

      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockAuth.checkSession).not.toHaveBeenCalled();
    });

    it('does NOT call checkSession when tab becomes hidden', async () => {
      const { mockAuth } = await setup(true);

      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockAuth.checkSession).not.toHaveBeenCalled();
    });
  });
});
