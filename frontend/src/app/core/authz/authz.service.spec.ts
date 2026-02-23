import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthzService } from './authz.service';
import { AuthzApiService } from './authz-api.service';
import { AuthzQueryRequest, AuthzQueryBreakdownResponse } from './authz.models';

// ─── helpers ────────────────────────────────────────────────────────────────

const BREAKDOWN_RESPONSE: AuthzQueryBreakdownResponse = {
  scopeType: 2,
  all: true,
  allPermissions: ['news.edit'],
  results: [{ scopeId: 1, permissions: ['news.edit'] }],
};

function makeRequest(overrides: Partial<AuthzQueryRequest> = {}): AuthzQueryRequest {
  return {
    scopeType: 2,
    scopeIds: [1],
    permissions: ['news.edit'],
    breakdown: true,
    ...overrides,
  };
}

function make401(): HttpErrorResponse {
  return new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
}

// ─── suite ──────────────────────────────────────────────────────────────────

describe('AuthzService', () => {
  let service: AuthzService;
  let apiSpy: { query: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiSpy = { query: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AuthzService,
        { provide: AuthzApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(AuthzService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Llamada HTTP básica ──────────────────────────────────────────────────

  describe('llamada HTTP básica', () => {
    it('llama al API y devuelve la respuesta', () => {
      apiSpy.query.mockReturnValue(of(BREAKDOWN_RESPONSE));

      let result: any;
      service.query(makeRequest()).subscribe((r) => (result = r));

      expect(apiSpy.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(BREAKDOWN_RESPONSE);
    });
  });

  // ── Caché ────────────────────────────────────────────────────────────────

  describe('caché en memoria', () => {
    it('la segunda solicitud idéntica NO llama al API', () => {
      apiSpy.query.mockReturnValue(of(BREAKDOWN_RESPONSE));

      service.query(makeRequest()).subscribe();
      service.query(makeRequest()).subscribe();

      expect(apiSpy.query).toHaveBeenCalledTimes(1);
    });

    it('devuelve el mismo valor desde caché', () => {
      apiSpy.query.mockReturnValue(of(BREAKDOWN_RESPONSE));

      let r1: any, r2: any;
      service.query(makeRequest()).subscribe((r) => (r1 = r));
      service.query(makeRequest()).subscribe((r) => (r2 = r));

      expect(r1).toEqual(r2);
    });

    it('requests con parámetros distintos hacen llamadas independientes', () => {
      apiSpy.query.mockReturnValue(of(BREAKDOWN_RESPONSE));

      service.query(makeRequest({ scopeIds: [1] })).subscribe();
      service.query(makeRequest({ scopeIds: [2] })).subscribe();

      expect(apiSpy.query).toHaveBeenCalledTimes(2);
    });

    it('el orden de scopeIds NO afecta a la clave de caché', () => {
      apiSpy.query.mockReturnValue(of(BREAKDOWN_RESPONSE));

      service.query(makeRequest({ scopeIds: [3, 1, 2] })).subscribe();
      service.query(makeRequest({ scopeIds: [1, 2, 3] })).subscribe();

      expect(apiSpy.query).toHaveBeenCalledTimes(1);
    });

    it('el orden de permissions NO afecta a la clave de caché', () => {
      apiSpy.query.mockReturnValue(of(BREAKDOWN_RESPONSE));

      service.query(makeRequest({ permissions: ['b', 'a'] })).subscribe();
      service.query(makeRequest({ permissions: ['a', 'b'] })).subscribe();

      expect(apiSpy.query).toHaveBeenCalledTimes(1);
    });
  });

  // ── TTL ──────────────────────────────────────────────────────────────────

  describe('expiración de caché (TTL)', () => {
    it('tras expirar el TTL, hace una nueva llamada al API', () => {
      vi.useFakeTimers();
      apiSpy.query.mockReturnValue(of(BREAKDOWN_RESPONSE));

      service.query(makeRequest()).subscribe();
      expect(apiSpy.query).toHaveBeenCalledTimes(1);

      // Avanzar más allá del TTL (120 s)
      vi.advanceTimersByTime(121_000);

      service.query(makeRequest()).subscribe();
      expect(apiSpy.query).toHaveBeenCalledTimes(2);
    });

    it('antes de expirar el TTL, sigue usando la caché', () => {
      vi.useFakeTimers();
      apiSpy.query.mockReturnValue(of(BREAKDOWN_RESPONSE));

      service.query(makeRequest()).subscribe();
      vi.advanceTimersByTime(60_000); // 60 s — dentro del TTL
      service.query(makeRequest()).subscribe();

      expect(apiSpy.query).toHaveBeenCalledTimes(1);
    });
  });

  // ── Deduplicación de peticiones en vuelo ─────────────────────────────────

  describe('deduplicación (inFlight)', () => {
    it('dos suscriptores concurrentes comparten la misma llamada HTTP', () => {
      const subject = new Subject<AuthzQueryBreakdownResponse>();
      apiSpy.query.mockReturnValue(subject.asObservable());

      let r1: any, r2: any;
      // Primera suscripción — desencadena la llamada HTTP (aún pendiente)
      service.query(makeRequest()).subscribe((r) => (r1 = r));
      // Segunda suscripción — antes de que resuelva la primera
      service.query(makeRequest()).subscribe((r) => (r2 = r));

      // Resolver la llamada HTTP
      subject.next(BREAKDOWN_RESPONSE);
      subject.complete();

      expect(apiSpy.query).toHaveBeenCalledTimes(1);
      expect(r1).toEqual(BREAKDOWN_RESPONSE);
      expect(r2).toEqual(BREAKDOWN_RESPONSE);
    });
  });

  // ── Errores ──────────────────────────────────────────────────────────────

  describe('manejo de errores', () => {
    it('un error 401 limpia toda la caché', () => {
      apiSpy.query.mockReturnValue(of(BREAKDOWN_RESPONSE));

      // Primera llamada → entra en caché
      service.query(makeRequest()).subscribe();
      expect(apiSpy.query).toHaveBeenCalledTimes(1);

      // Segunda llamada → 401
      apiSpy.query.mockReturnValue(throwError(() => make401()));
      service.query(makeRequest({ scopeIds: [99] })).subscribe({ error: () => {} });

      // Tercera llamada con los params originales: caché debe estar vacía → nueva HTTP
      apiSpy.query.mockReturnValue(of(BREAKDOWN_RESPONSE));
      service.query(makeRequest()).subscribe();

      expect(apiSpy.query).toHaveBeenCalledTimes(3);
    });

    it('un error no-401 NO limpia la caché', () => {
      apiSpy.query.mockReturnValue(of(BREAKDOWN_RESPONSE));
      service.query(makeRequest()).subscribe();

      const err500 = new HttpErrorResponse({ status: 500 });
      apiSpy.query.mockReturnValue(throwError(() => err500));
      service.query(makeRequest({ scopeIds: [99] })).subscribe({ error: () => {} });

      // Los params originales siguen en caché → no llamará de nuevo
      apiSpy.query.mockReturnValue(of(BREAKDOWN_RESPONSE));
      service.query(makeRequest()).subscribe();

      expect(apiSpy.query).toHaveBeenCalledTimes(2); // solo la inicial y la de 500
    });

    it('propaga el error al suscriptor', () => {
      const err = new HttpErrorResponse({ status: 403 });
      apiSpy.query.mockReturnValue(throwError(() => err));

      let caught: any;
      service.query(makeRequest()).subscribe({ error: (e) => (caught = e) });

      expect(caught).toBe(err);
    });
  });

  // ── clearCache() ─────────────────────────────────────────────────────────

  describe('clearCache()', () => {
    it('fuerza una nueva llamada HTTP tras limpiar la caché', () => {
      apiSpy.query.mockReturnValue(of(BREAKDOWN_RESPONSE));

      service.query(makeRequest()).subscribe();
      service.clearCache();
      service.query(makeRequest()).subscribe();

      expect(apiSpy.query).toHaveBeenCalledTimes(2);
    });
  });
});
