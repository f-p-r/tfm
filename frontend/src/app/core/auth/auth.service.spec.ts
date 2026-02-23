import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './auth.service';
import { User } from './user.model';

// ─── Constantes ─────────────────────────────────────────────────────────────

const API = 'http://localhost:8000';

const MOCK_USER: User = {
  id: 1,
  username: 'tester',
  name: 'Tester User',
  email: 'tester@example.com',
};

// ─── Setup ───────────────────────────────────────────────────────────────────

function setup() {
  TestBed.configureTestingModule({
    providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
  });

  const service = TestBed.inject(AuthService);
  const http = TestBed.inject(HttpTestingController);
  return { service, http };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuthService', () => {

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  // ── Estado inicial ────────────────────────────────────────────────────────

  describe('estado inicial', () => {
    it('currentUser empieza siendo null', () => {
      const { service } = setup();
      expect(service.currentUser()).toBeNull();
    });

    it('isAuthenticated es false cuando no hay usuario', () => {
      const { service } = setup();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('isAuthenticated es true cuando hay usuario', () => {
      const { service } = setup();
      service.currentUser.set(MOCK_USER);
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  // ── checkSession() ────────────────────────────────────────────────────────

  describe('checkSession()', () => {
    it('sesión activa → establece currentUser y completa sin error', () => {
      const { service, http } = setup();
      let completed = false;

      service.checkSession().subscribe({ complete: () => (completed = true) });

      http.expectOne(`${API}/api/auth/me`).flush({ user: MOCK_USER });

      expect(service.currentUser()).toEqual(MOCK_USER);
      expect(completed).toBe(true);
    });

    it('sin sesión (401) → currentUser permanece null y NO propaga el error', () => {
      const { service, http } = setup();
      let errored = false;
      let completed = false;

      service.checkSession().subscribe({
        error: () => (errored = true),
        complete: () => (completed = true),
      });

      http.expectOne(`${API}/api/auth/me`).flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(service.currentUser()).toBeNull();
      expect(errored).toBe(false);
      expect(completed).toBe(true);
    });

    it('error de servidor (500) → currentUser permanece null y NO propaga el error', () => {
      const { service, http } = setup();
      let errored = false;

      service.checkSession().subscribe({ error: () => (errored = true) });

      http.expectOne(`${API}/api/auth/me`).flush(null, { status: 500, statusText: 'Server Error' });

      expect(service.currentUser()).toBeNull();
      expect(errored).toBe(false);
    });
  });

  // ── getCsrfCookie() ───────────────────────────────────────────────────────

  describe('getCsrfCookie()', () => {
    it('primera llamada → realiza petición GET a /sanctum/csrf-cookie', () => {
      const { service, http } = setup();

      service.getCsrfCookie().subscribe();

      const req = http.expectOne(`${API}/sanctum/csrf-cookie`);
      expect(req.request.method).toBe('GET');
      req.flush('');
    });

    it('segunda llamada → NO realiza segunda petición (caché csrfReady)', () => {
      const { service, http } = setup();

      service.getCsrfCookie().subscribe();
      http.expectOne(`${API}/sanctum/csrf-cookie`).flush('');

      // Segunda llamada — no debe haber ninguna petición pendiente
      service.getCsrfCookie().subscribe();
      http.expectNone(`${API}/sanctum/csrf-cookie`);
    });

    it('error HTTP → propaga el error', () => {
      const { service, http } = setup();
      let errored = false;

      service.getCsrfCookie().subscribe({ error: () => (errored = true) });

      http.expectOne(`${API}/sanctum/csrf-cookie`).flush(null, { status: 500, statusText: 'Server Error' });

      expect(errored).toBe(true);
    });
  });

  // ── login() ───────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('login correcto → establece currentUser y devuelve el usuario', () => {
      const { service, http } = setup();
      let result: User | undefined;

      service.login('tester', 'secret').subscribe((u) => (result = u));

      // 1. CSRF
      http.expectOne(`${API}/sanctum/csrf-cookie`).flush('');
      // 2. Login
      http.expectOne(`${API}/api/auth/login`).flush({ user: MOCK_USER });

      expect(result).toEqual(MOCK_USER);
      expect(service.currentUser()).toEqual(MOCK_USER);
    });

    it('login con credenciales incorrectas (401) → rechaza con status 401', () => {
      const { service, http } = setup();
      let error: any;

      service.login('tester', 'wrong').subscribe({ error: (e) => (error = e) });

      http.expectOne(`${API}/sanctum/csrf-cookie`).flush('');
      http.expectOne(`${API}/api/auth/login`).flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(error).toBeDefined();
      expect(error.status).toBe(401);
    });

    it('login con error de validación (422) → rechaza con status 422 y errors', () => {
      const { service, http } = setup();
      let error: any;

      service.login('', '').subscribe({ error: (e) => (error = e) });

      http.expectOne(`${API}/sanctum/csrf-cookie`).flush('');
      http.expectOne(`${API}/api/auth/login`).flush(
        { message: 'El campo usuario es obligatorio.', errors: { username: ['El campo usuario es obligatorio.'] } },
        { status: 422, statusText: 'Unprocessable Entity' },
      );

      expect(error).toBeDefined();
      expect(error.status).toBe(422);
      expect(error.errors).toBeDefined();
    });

    it('login enviado con el username y password correctos en el body', () => {
      const { service, http } = setup();

      service.login('tester', 'secret').subscribe();

      http.expectOne(`${API}/sanctum/csrf-cookie`).flush('');
      const req = http.expectOne(`${API}/api/auth/login`);
      expect(req.request.body).toEqual({ username: 'tester', password: 'secret' });
      req.flush({ user: MOCK_USER });
    });

    it('cuando csrfReady=true no vuelve a pedir el CSRF antes del login', () => {
      const { service, http } = setup();

      // Primera llamada de login → pedir CSRF + login
      service.login('tester', 'secret').subscribe();
      http.expectOne(`${API}/sanctum/csrf-cookie`).flush('');
      http.expectOne(`${API}/api/auth/login`).flush({ user: MOCK_USER });

      // Segunda llamada de login → solo login, sin CSRF
      service.login('tester', 'secret').subscribe();
      http.expectNone(`${API}/sanctum/csrf-cookie`);
      http.expectOne(`${API}/api/auth/login`).flush({ user: MOCK_USER });
    });
  });

  // ── me() ──────────────────────────────────────────────────────────────────

  describe('me()', () => {
    it('devuelve el usuario mapeado desde response.user', () => {
      const { service, http } = setup();
      let result: User | undefined;

      service.me().subscribe((u) => (result = u));

      http.expectOne(`${API}/api/auth/me`).flush({ user: MOCK_USER });

      expect(result).toEqual(MOCK_USER);
    });

    it('error 401 → propagado con status 401', () => {
      const { service, http } = setup();
      let error: any;

      service.me().subscribe({ error: (e) => (error = e) });

      http.expectOne(`${API}/api/auth/me`).flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(error?.status).toBe(401);
    });
  });

  // ── logout() ─────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('logout correcto → limpia currentUser', () => {
      const { service, http } = setup();
      service.currentUser.set(MOCK_USER);

      service.logout().subscribe();

      http.expectOne(`${API}/api/auth/logout`).flush(null);

      expect(service.currentUser()).toBeNull();
    });

    it('logout correcto → completa sin error', () => {
      const { service, http } = setup();
      let completed = false;

      service.logout().subscribe({ complete: () => (completed = true) });

      http.expectOne(`${API}/api/auth/logout`).flush(null);

      expect(completed).toBe(true);
    });

    it('error en logout → propaga el error', () => {
      const { service, http } = setup();
      let errored = false;

      service.logout().subscribe({ error: () => (errored = true) });

      http.expectOne(`${API}/api/auth/logout`).flush(null, { status: 500, statusText: 'Server Error' });

      expect(errored).toBe(true);
    });

    it('error en logout → currentUser NO se limpia (no llegó al tap)', () => {
      const { service, http } = setup();
      service.currentUser.set(MOCK_USER);

      service.logout().subscribe({ error: () => {} });

      http.expectOne(`${API}/api/auth/logout`).flush(null, { status: 500, statusText: 'Server Error' });

      // tap() solo se ejecuta si la petición tiene éxito
      expect(service.currentUser()).toEqual(MOCK_USER);
    });
  });

  // ── handleError (comportamiento observable desde métodos públicos) ─────────

  describe('manejo de errores HTTP', () => {
    it('error genérico (500) → rechaza con status y message', () => {
      const { service, http } = setup();
      let error: any;

      service.me().subscribe({ error: (e) => (error = e) });

      http.expectOne(`${API}/api/auth/me`).flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(error?.status).toBe(500);
      expect(error?.message).toBeDefined();
    });

    it('error 422 sin estructura Laravel → rechaza con status 422', () => {
      const { service, http } = setup();
      let error: any;

      service.me().subscribe({ error: (e) => (error = e) });

      // Body que NO es LaravelValidationError
      http.expectOne(`${API}/api/auth/me`).flush('texto plano', { status: 422, statusText: 'Unprocessable Entity' });

      expect(error?.status).toBe(422);
    });

    it('error 422 con estructura Laravel → rechaza con errors poblado', () => {
      const { service, http } = setup();
      let error: any;

      // Usamos login para poder enviar un 422 con cuerpo de validación
      service.login('', '').subscribe({ error: (e) => (error = e) });

      http.expectOne(`${API}/sanctum/csrf-cookie`).flush('');
      http.expectOne(`${API}/api/auth/login`).flush(
        { message: 'Error de validación', errors: { username: ['Requerido'] } },
        { status: 422, statusText: 'Unprocessable Entity' },
      );

      expect(error?.status).toBe(422);
      expect(error?.errors?.username).toEqual(['Requerido']);
    });
  });
});
