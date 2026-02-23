import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { AssociationsResolveService } from './associations-resolve.service';
import { AssociationsApiService } from './associations-api.service';
import { Association } from './associations.models';

// ─── Datos de prueba ──────────────────────────────────────────────────────────

function makeAssociation(overrides: Partial<Association> = {}): Association {
  return {
    id: 1,
    name: 'Asociación Ejemplo',
    slug: 'asociacion-ejemplo',
    disabled: false,
    ...overrides,
  };
}

const ASSOC = makeAssociation({ id: 1, slug: 'asociacion-alpha' });

// ─── Setup ────────────────────────────────────────────────────────────────────

function setup() {
  const mockApi = {
    getBySlug: vi.fn(),
    getById: vi.fn(),
  };

  TestBed.configureTestingModule({
    providers: [
      AssociationsResolveService,
      { provide: AssociationsApiService, useValue: mockApi },
    ],
  });

  return {
    service: TestBed.inject(AssociationsResolveService),
    mockApi,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AssociationsResolveService', () => {

  // ── resolveBySlug() — carga básica ────────────────────────────────────────

  describe('resolveBySlug() — carga desde API', () => {
    it('sin caché → llama a la API con el slug normalizado', () => {
      const { service, mockApi } = setup();
      mockApi.getBySlug.mockReturnValueOnce(of(ASSOC));

      service.resolveBySlug('asociacion-alpha').subscribe();

      expect(mockApi.getBySlug).toHaveBeenCalledWith('asociacion-alpha');
    });

    it('normaliza el slug antes de consultar (slugify)', () => {
      const { service, mockApi } = setup();
      mockApi.getBySlug.mockReturnValueOnce(of(ASSOC));

      // Slug con mayúsculas y acentos → debe normalizarse
      service.resolveBySlug('Asociación Alpha').subscribe();

      expect(mockApi.getBySlug).toHaveBeenCalledWith('asociacion-alpha');
    });

    it('devuelve la asociación obtenida de la API', () => {
      const { service, mockApi } = setup();
      mockApi.getBySlug.mockReturnValueOnce(of(ASSOC));

      let result: Association | undefined;
      service.resolveBySlug('asociacion-alpha').subscribe((a) => (result = a));

      expect(result).toEqual(ASSOC);
    });
  });

  // ── resolveBySlug() — caché ───────────────────────────────────────────────

  describe('resolveBySlug() — caché', () => {
    it('segunda llamada con el mismo slug → no llama de nuevo a la API', () => {
      const { service, mockApi } = setup();
      mockApi.getBySlug.mockReturnValue(of(ASSOC));

      service.resolveBySlug('asociacion-alpha').subscribe();
      service.resolveBySlug('asociacion-alpha').subscribe();

      expect(mockApi.getBySlug).toHaveBeenCalledTimes(1);
    });

    it('caché devuelve la misma asociación', () => {
      const { service, mockApi } = setup();
      mockApi.getBySlug.mockReturnValue(of(ASSOC));

      service.resolveBySlug('asociacion-alpha').subscribe();

      let result: Association | undefined;
      service.resolveBySlug('asociacion-alpha').subscribe((a) => (result = a));

      expect(result).toEqual(ASSOC);
    });

    it('caché expirada → vuelve a llamar a la API', () => {
      const { service, mockApi } = setup();
      mockApi.getBySlug.mockReturnValue(of(ASSOC));

      service.resolveBySlug('asociacion-alpha').subscribe();

      // Simular expiración del TTL manipulando el mapa de caché directamente
      const cache = (service as any).cache as Map<string, { value: Association; fetchedAt: number }>;
      const entry = cache.get('asociacion-alpha')!;
      cache.set('asociacion-alpha', { ...entry, fetchedAt: Date.now() - 11 * 60 * 1000 });

      service.resolveBySlug('asociacion-alpha').subscribe();

      expect(mockApi.getBySlug).toHaveBeenCalledTimes(2);
    });
  });

  // ── resolveBySlug() — deduplicación ──────────────────────────────────────

  describe('resolveBySlug() — deduplicación', () => {
    it('dos llamadas simultáneas → solo una petición HTTP', () => {
      const { service, mockApi } = setup();
      const subject$ = new Subject<Association>();
      mockApi.getBySlug.mockReturnValue(subject$.asObservable());

      service.resolveBySlug('asociacion-alpha').subscribe();
      service.resolveBySlug('asociacion-alpha').subscribe();

      expect(mockApi.getBySlug).toHaveBeenCalledTimes(1);
      subject$.next(ASSOC);
      subject$.complete();
    });

    it('ambos suscriptores reciben la misma asociación', () => {
      const { service, mockApi } = setup();
      const subject$ = new Subject<Association>();
      mockApi.getBySlug.mockReturnValue(subject$.asObservable());

      const results: Association[] = [];
      service.resolveBySlug('asociacion-alpha').subscribe((a) => results.push(a));
      service.resolveBySlug('asociacion-alpha').subscribe((a) => results.push(a));

      subject$.next(ASSOC);
      subject$.complete();

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(results[1]);
    });
  });

  // ── resolveBySlug() — errores ─────────────────────────────────────────────

  describe('resolveBySlug() — errores', () => {
    it('error de API → propaga el error al suscriptor', () => {
      const { service, mockApi } = setup();
      const err = { status: 404, message: 'Not Found' };
      mockApi.getBySlug.mockReturnValueOnce(throwError(() => err));

      let received: any;
      service.resolveBySlug('no-existe').subscribe({ error: (e) => (received = e) });

      expect(received).toEqual(err);
    });

    it('error de API → limpia el in-flight para permitir reintento', () => {
      const { service, mockApi } = setup();
      mockApi.getBySlug
        .mockReturnValueOnce(throwError(() => new Error('fallo')))
        .mockReturnValueOnce(of(ASSOC));

      service.resolveBySlug('asociacion-alpha').subscribe({ error: () => {} });
      service.resolveBySlug('asociacion-alpha').subscribe();

      expect(mockApi.getBySlug).toHaveBeenCalledTimes(2);
    });
  });

  // ── resolveById() ─────────────────────────────────────────────────────────

  describe('resolveById()', () => {
    it('sin caché → llama a la API con el id', () => {
      const { service, mockApi } = setup();
      mockApi.getById.mockReturnValueOnce(of(ASSOC));

      service.resolveById(1).subscribe();

      expect(mockApi.getById).toHaveBeenCalledWith(1);
    });

    it('devuelve la asociación obtenida por id', () => {
      const { service, mockApi } = setup();
      mockApi.getById.mockReturnValueOnce(of(ASSOC));

      let result: Association | undefined;
      service.resolveById(1).subscribe((a) => (result = a));

      expect(result).toEqual(ASSOC);
    });

    it('caché caliente (previamente cargada por slug) → no llama a la API', () => {
      const { service, mockApi } = setup();
      mockApi.getBySlug.mockReturnValue(of(ASSOC));

      // Cargar por slug primero para poblar la caché
      service.resolveBySlug('asociacion-alpha').subscribe();

      // Ahora por id → debe usar la caché
      service.resolveById(ASSOC.id).subscribe();

      expect(mockApi.getById).not.toHaveBeenCalled();
    });

    it('deduplicación: dos llamadas simultáneas por id → una sola petición', () => {
      const { service, mockApi } = setup();
      const subject$ = new Subject<Association>();
      mockApi.getById.mockReturnValue(subject$.asObservable());

      service.resolveById(99).subscribe();
      service.resolveById(99).subscribe();

      expect(mockApi.getById).toHaveBeenCalledTimes(1);
      subject$.next(makeAssociation({ id: 99 }));
      subject$.complete();
    });

    it('error de API → propaga el error', () => {
      const { service, mockApi } = setup();
      mockApi.getById.mockReturnValueOnce(throwError(() => ({ status: 404 })));

      let received: any;
      service.resolveById(999).subscribe({ error: (e) => (received = e) });

      expect(received?.status).toBe(404);
    });
  });

  // ── getById() — solo caché síncrono ──────────────────────────────────────

  describe('getById() — consulta síncrona de caché', () => {
    it('sin caché → devuelve undefined', () => {
      const { service } = setup();
      expect(service.getById(1)).toBeUndefined();
    });

    it('con caché caliente → devuelve la asociación', () => {
      const { service, mockApi } = setup();
      mockApi.getBySlug.mockReturnValue(of(ASSOC));

      service.resolveBySlug('asociacion-alpha').subscribe();

      expect(service.getById(ASSOC.id)).toEqual(ASSOC);
    });

    it('entrada expirada → devuelve undefined y limpia el índice', () => {
      const { service, mockApi } = setup();
      mockApi.getBySlug.mockReturnValue(of(ASSOC));

      service.resolveBySlug('asociacion-alpha').subscribe();

      // Expirar la entrada
      const cache = (service as any).cache as Map<string, { value: Association; fetchedAt: number }>;
      const entry = cache.get('asociacion-alpha')!;
      cache.set('asociacion-alpha', { ...entry, fetchedAt: Date.now() - 11 * 60 * 1000 });

      expect(service.getById(ASSOC.id)).toBeUndefined();

      // El índice debe haberse limpiado
      const idIndex = (service as any).idIndex as Map<number, string>;
      expect(idIndex.has(ASSOC.id)).toBe(false);
    });
  });

  // ── clearCache() ──────────────────────────────────────────────────────────

  describe('clearCache()', () => {
    it('vacía la caché y el índice de ids', () => {
      const { service, mockApi } = setup();
      mockApi.getBySlug.mockReturnValue(of(ASSOC));

      service.resolveBySlug('asociacion-alpha').subscribe();

      service.clearCache();

      const cache = (service as any).cache as Map<string, unknown>;
      const idIndex = (service as any).idIndex as Map<number, string>;

      expect(cache.size).toBe(0);
      expect(idIndex.size).toBe(0);
    });

    it('tras clearCache() → siguiente resolveBySlug() vuelve a llamar a la API', () => {
      const { service, mockApi } = setup();
      mockApi.getBySlug.mockReturnValue(of(ASSOC));

      service.resolveBySlug('asociacion-alpha').subscribe();
      service.clearCache();
      service.resolveBySlug('asociacion-alpha').subscribe();

      expect(mockApi.getBySlug).toHaveBeenCalledTimes(2);
    });
  });
});
