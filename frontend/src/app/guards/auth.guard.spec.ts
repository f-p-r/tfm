import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { of } from 'rxjs';
import { requireAuth } from './auth.guard';
import { AuthService } from '../core/auth/auth.service';
import { User } from '../core/auth/user.model';

const MOCK_USER = { id: 1, username: 'tester' } as User;

/** Ejecuta un guard funcional en el contexto de inyección de Angular */
function runGuard(
  guard: ReturnType<typeof requireAuth> extends (...args: any[]) => any
    ? ReturnType<typeof requireAuth>
    : any,
  state: Partial<RouterStateSnapshot> = { url: '/perfil' }
): boolean | UrlTree | Promise<boolean | UrlTree> {
  return TestBed.runInInjectionContext(() =>
    (guard as any)(new ActivatedRouteSnapshot(), state as RouterStateSnapshot)
  );
}

describe('requireAuth', () => {
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        AuthService,
      ],
    });

    authService = TestBed.inject(AuthService);
    vi.spyOn(authService as any, 'me').mockReturnValue(of(null));
  });

  it('permite la navegación cuando hay usuario autenticado', () => {
    authService.currentUser.set(MOCK_USER);

    const result = runGuard(requireAuth);

    expect(result).toBe(true);
  });

  it('redirige a /login cuando no hay usuario', () => {
    authService.currentUser.set(null);

    const result = runGuard(requireAuth) as UrlTree;

    expect(result).toBeInstanceOf(UrlTree);
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result)).toContain('/login');
  });

  it('incluye returnUrl en la redirección', () => {
    authService.currentUser.set(null);

    const result = runGuard(requireAuth, { url: '/admin/pages' }) as UrlTree;

    const router = TestBed.inject(Router);
    const serialized = router.serializeUrl(result);
    expect(serialized).toContain('returnUrl=%2Fadmin%2Fpages');
  });

  it('redirige a /login con la URL correcta para rutas con parámetros', () => {
    authService.currentUser.set(null);

    const result = runGuard(requireAuth, { url: '/perfil/editar' }) as UrlTree;

    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result)).toContain('returnUrl=');
  });
});
