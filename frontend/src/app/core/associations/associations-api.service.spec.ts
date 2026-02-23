import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AssociationsApiService } from './associations-api.service';
import { Association } from './associations.models';

// ─── Datos de prueba ──────────────────────────────────────────────────────────

const API = 'http://localhost:8000/api/associations';

function makeAssociation(overrides: Partial<Association> = {}): Association {
  return {
    id: 1,
    name: 'Asociación Ejemplo',
    slug: 'asociacion-ejemplo',
    disabled: false,
    ...overrides,
  };
}

const ASSOC_A = makeAssociation({ id: 1, name: 'Asociación Alpha', slug: 'asociacion-alpha' });
const ASSOC_B = makeAssociation({ id: 2, name: 'Asociación Beta', slug: 'asociacion-beta' });

// ─── Setup ────────────────────────────────────────────────────────────────────

function setup() {
  TestBed.configureTestingModule({
    providers: [AssociationsApiService, provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    service: TestBed.inject(AssociationsApiService),
    http: TestBed.inject(HttpTestingController),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AssociationsApiService', () => {

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  // ── getAll() ──────────────────────────────────────────────────────────────

  describe('getAll()', () => {
    it('sin parámetros → GET /api/associations sin query params', () => {
      const { service, http } = setup();

      service.getAll().subscribe();

      const req = http.expectOne(API);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('include_disabled')).toBe(false);
      req.flush([]);
    });

    it('includeDisabled=true → añade include_disabled=true', () => {
      const { service, http } = setup();

      service.getAll(true).subscribe();

      const req = http.expectOne(`${API}?include_disabled=true`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('devuelve el array de asociaciones recibido', () => {
      const { service, http } = setup();
      let result: Association[] = [];

      service.getAll().subscribe((a) => (result = a));

      http.expectOne(API).flush([ASSOC_A, ASSOC_B]);

      expect(result).toEqual([ASSOC_A, ASSOC_B]);
    });
  });

  // ── getById() ─────────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('GET /api/associations/:id con el id correcto', () => {
      const { service, http } = setup();

      service.getById(42).subscribe();

      const req = http.expectOne(`${API}/42`);
      expect(req.request.method).toBe('GET');
      req.flush(ASSOC_A);
    });

    it('devuelve la asociación recibida', () => {
      const { service, http } = setup();
      let result: Association | undefined;

      service.getById(1).subscribe((a) => (result = a));
      http.expectOne(`${API}/1`).flush(ASSOC_A);

      expect(result).toEqual(ASSOC_A);
    });
  });

  // ── getBySlug() ───────────────────────────────────────────────────────────

  describe('getBySlug()', () => {
    it('GET /api/associations/by-slug/:slug con el slug correcto', () => {
      const { service, http } = setup();

      service.getBySlug('asociacion-alpha').subscribe();

      const req = http.expectOne(`${API}/by-slug/asociacion-alpha`);
      expect(req.request.method).toBe('GET');
      req.flush(ASSOC_A);
    });

    it('codifica en URL los caracteres especiales del slug', () => {
      const { service, http } = setup();

      service.getBySlug('asociación alpha').subscribe();

      // encodeURIComponent convierte espacios en %20 y ó en %C3%B3
      const req = http.expectOne((r) => r.url.includes('/by-slug/'));
      expect(req.request.url).not.toContain(' ');
      req.flush(ASSOC_A);
    });

    it('devuelve la asociación recibida', () => {
      const { service, http } = setup();
      let result: Association | undefined;

      service.getBySlug('asociacion-alpha').subscribe((a) => (result = a));
      http.expectOne(`${API}/by-slug/asociacion-alpha`).flush(ASSOC_A);

      expect(result).toEqual(ASSOC_A);
    });
  });

  // ── create() ─────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('POST /api/associations con los datos enviados', () => {
      const { service, http } = setup();
      const datos: Partial<Association> = { name: 'Nueva', slug: 'nueva' };

      service.create(datos).subscribe();

      const req = http.expectOne(API);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(datos);
      req.flush({ ...ASSOC_A, ...datos });
    });

    it('devuelve la asociación creada', () => {
      const { service, http } = setup();
      let result: Association | undefined;

      service.create({ name: 'Nueva', slug: 'nueva' }).subscribe((a) => (result = a));
      http.expectOne(API).flush(ASSOC_A);

      expect(result).toEqual(ASSOC_A);
    });
  });

  // ── update() ─────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('PUT /api/associations/:id con los datos enviados', () => {
      const { service, http } = setup();
      const datos: Partial<Association> = { name: 'Actualizada' };

      service.update(5, datos).subscribe();

      const req = http.expectOne(`${API}/5`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(datos);
      req.flush({ ...ASSOC_A, ...datos });
    });

    it('devuelve la asociación actualizada', () => {
      const { service, http } = setup();
      let result: Association | undefined;

      service.update(1, { name: 'Nuevo nombre' }).subscribe((a) => (result = a));
      http.expectOne(`${API}/1`).flush({ ...ASSOC_A, name: 'Nuevo nombre' });

      expect(result?.name).toBe('Nuevo nombre');
    });
  });
});
