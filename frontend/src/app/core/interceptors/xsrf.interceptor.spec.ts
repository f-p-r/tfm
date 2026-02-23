import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { xsrfInterceptor } from './xsrf.interceptor';

const HEADER = 'X-XSRF-TOKEN';

/** Limpia document.cookie para el dominio de jsdom (sin atributo path/domain extra) */
function clearXsrfCookie() {
  document.cookie = 'XSRF-TOKEN=; Max-Age=0';
}

function setXsrfCookie(value: string) {
  document.cookie = `XSRF-TOKEN=${value}`;
}

describe('xsrfInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    clearXsrfCookie();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([xsrfInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    clearXsrfCookie();
  });

  describe('métodos seguros (GET, HEAD) — sin header', () => {
    it('GET no añade el header aunque exista cookie', () => {
      setXsrfCookie('mytoken');
      http.get('/api/test').subscribe();

      const req = controller.expectOne('/api/test');
      expect(req.request.headers.has(HEADER)).toBe(false);
      req.flush({});
    });

    it('HEAD no añade el header aunque exista cookie', () => {
      setXsrfCookie('mytoken');
      http.head('/api/test').subscribe();

      const req = controller.expectOne('/api/test');
      expect(req.request.headers.has(HEADER)).toBe(false);
      req.flush({});
    });
  });

  describe('métodos mutantes (POST, PUT, PATCH, DELETE)', () => {
    it('POST añade el header X-XSRF-TOKEN con el valor de la cookie', () => {
      setXsrfCookie('csrf-value-123');

      http.post('/api/data', {}).subscribe();

      const req = controller.expectOne('/api/data');
      expect(req.request.headers.get(HEADER)).toBe('csrf-value-123');
      req.flush({});
    });

    it('PUT añade el header X-XSRF-TOKEN', () => {
      setXsrfCookie('token-put');

      http.put('/api/resource/1', {}).subscribe();

      const req = controller.expectOne('/api/resource/1');
      expect(req.request.headers.get(HEADER)).toBe('token-put');
      req.flush({});
    });

    it('DELETE añade el header X-XSRF-TOKEN', () => {
      setXsrfCookie('token-delete');

      http.delete('/api/resource/1').subscribe();

      const req = controller.expectOne('/api/resource/1');
      expect(req.request.headers.get(HEADER)).toBe('token-delete');
      req.flush({});
    });

    it('POST sin cookie NO añade el header', () => {
      // Cookie no establecida
      http.post('/api/data', {}).subscribe();

      const req = controller.expectOne('/api/data');
      expect(req.request.headers.has(HEADER)).toBe(false);
      req.flush({});
    });

    it('decodifica el token URL-encoded al añadirlo como header', () => {
      setXsrfCookie(encodeURIComponent('token+with=special&chars'));

      http.post('/api/data', {}).subscribe();

      const req = controller.expectOne('/api/data');
      expect(req.request.headers.get(HEADER)).toBe('token+with=special&chars');
      req.flush({});
    });
  });
});
