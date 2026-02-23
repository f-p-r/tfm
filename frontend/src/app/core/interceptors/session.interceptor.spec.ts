import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { sessionInterceptor } from './session.interceptor';
import { AuthService } from '../auth/auth.service';
import { AuthzService } from '../authz/authz.service';
import { User } from '../auth/user.model';
import { environment } from '../../../environments/environment';

const BACKEND = environment.apiBaseUrl;
const MOCK_USER = { id: 1, username: 'tester' } as User;

describe('sessionInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let authService: AuthService;
  let authzSpy: { clearCache: ReturnType<typeof vi.fn>; query: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authzSpy = { clearCache: vi.fn(), query: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([sessionInterceptor])),
        provideHttpClientTesting(),
        AuthService,
        { provide: AuthzService, useValue: authzSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => controller.verify());

  // ── 401 en URL protegida ─────────────────────────────────────────────────

  describe('401 en URL protegida con usuario autenticado', () => {
    beforeEach(() => {
      authService.currentUser.set(MOCK_USER);
    });

    it('pone currentUser a null', () => {
      let caught = false;
      http.get(`${BACKEND}/api/pages`).subscribe({ error: () => (caught = true) });

      controller.expectOne(`${BACKEND}/api/pages`).flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(authService.currentUser()).toBeNull();
      expect(caught).toBe(true);
    });

    it('llama a authzService.clearCache()', () => {
      http.get(`${BACKEND}/api/pages`).subscribe({ error: () => {} });

      controller.expectOne(`${BACKEND}/api/pages`).flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(authzSpy.clearCache).toHaveBeenCalledOnce();
    });

    it('re-lanza el error al suscriptor', () => {
      let errorStatus: number | undefined;
      http.get(`${BACKEND}/api/pages`).subscribe({ error: (e) => (errorStatus = e.status) });

      controller.expectOne(`${BACKEND}/api/pages`).flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(errorStatus).toBe(401);
    });
  });

  // ── URLs excluidas (skip) ────────────────────────────────────────────────

  describe('401 en URLs excluidas — no limpia la sesión', () => {
    const SKIP_PATHS = ['/api/auth/me', '/api/auth/login', '/sanctum/csrf-cookie'];

    it.each(SKIP_PATHS)('%s: 401 no modifica currentUser', (path) => {
      authService.currentUser.set(MOCK_USER);

      http.get(`${BACKEND}${path}`).subscribe({ error: () => {} });

      controller.expectOne(`${BACKEND}${path}`).flush({}, { status: 401, statusText: 'Unauthorized' });

      // No debe limpiar el usuario en URLs de skip
      expect(authService.currentUser()).toBe(MOCK_USER);
      expect(authzSpy.clearCache).not.toHaveBeenCalled();
    });
  });

  // ── 401 sin usuario activo ───────────────────────────────────────────────

  it('401 sin usuario autenticado (null) NO llama a clearCache', () => {
    authService.currentUser.set(null);

    http.get(`${BACKEND}/api/pages`).subscribe({ error: () => {} });

    controller.expectOne(`${BACKEND}/api/pages`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authzSpy.clearCache).not.toHaveBeenCalled();
  });

  // ── Errores no-401 ───────────────────────────────────────────────────────

  it('error 500 no modifica currentUser', () => {
    authService.currentUser.set(MOCK_USER);

    http.get(`${BACKEND}/api/pages`).subscribe({ error: () => {} });

    controller.expectOne(`${BACKEND}/api/pages`).flush({}, { status: 500, statusText: 'Server Error' });

    expect(authService.currentUser()).toBe(MOCK_USER);
    expect(authzSpy.clearCache).not.toHaveBeenCalled();
  });

  it('error 403 no modifica currentUser', () => {
    authService.currentUser.set(MOCK_USER);

    http.get(`${BACKEND}/api/pages`).subscribe({ error: () => {} });

    controller.expectOne(`${BACKEND}/api/pages`).flush({}, { status: 403, statusText: 'Forbidden' });

    expect(authService.currentUser()).toBe(MOCK_USER);
  });
});
