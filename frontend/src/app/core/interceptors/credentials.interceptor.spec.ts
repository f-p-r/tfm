import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { credentialsInterceptor } from './credentials.interceptor';
import { environment } from '../../../environments/environment';

const BACKEND = environment.apiBaseUrl; // ej: http://localhost:8000
const EXTERNAL = 'https://external.example.com';

describe('credentialsInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('añade withCredentials=true a peticiones al backend', () => {
    http.get(`${BACKEND}/api/test`).subscribe();

    const req = controller.expectOne(`${BACKEND}/api/test`);
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('NO añade withCredentials a peticiones externas', () => {
    http.get(`${EXTERNAL}/api/test`).subscribe();

    const req = controller.expectOne(`${EXTERNAL}/api/test`);
    expect(req.request.withCredentials).toBe(false);
    req.flush({});
  });

  it('aplica withCredentials también en POST al backend', () => {
    http.post(`${BACKEND}/api/data`, {}).subscribe();

    const req = controller.expectOne(`${BACKEND}/api/data`);
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });
});
