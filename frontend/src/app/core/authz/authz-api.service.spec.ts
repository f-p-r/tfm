import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthzApiService } from './authz-api.service';
import { AuthzQueryRequest, AuthzQueryResponse } from './authz.models';
import { environment } from '../../../environments/environment';

const ENDPOINT = `${environment.apiBaseUrl}/api/authz/query`;

const SUMMARY_RESPONSE = { scopeType: 1, all: true, scopeIds: [1, 2] };
const BREAKDOWN_RESPONSE = {
  scopeType: 2,
  all: false,
  allPermissions: ['news.create'],
  results: [
    { scopeId: 1, permissions: ['news.create'] },
    { scopeId: 2, permissions: [] },
  ],
};

describe('AuthzApiService', () => {
  let service: AuthzApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthzApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  // ------------------------------------------------------------------ query()
  describe('query()', () => {
    it('calls POST /api/authz/query', () => {
      const req: AuthzQueryRequest = { scopeType: 1, scopeIds: [], permissions: [], breakdown: false };
      service.query(req).subscribe();
      const r = http.expectOne(ENDPOINT);
      expect(r.request.method).toBe('POST');
      r.flush(SUMMARY_RESPONSE);
    });

    it('returns the response from the API', () => {
      const result: AuthzQueryResponse[] = [];
      service.query({ scopeType: 1, scopeIds: [1], permissions: ['news.create'], breakdown: false })
        .subscribe(v => result.push(v));
      http.expectOne(ENDPOINT).flush(SUMMARY_RESPONSE);
      expect(result[0]).toEqual(SUMMARY_RESPONSE);
    });

    it('returns breakdown response when breakdown=true', () => {
      const result: AuthzQueryResponse[] = [];
      service.query({ scopeType: 2, scopeIds: [1, 2], permissions: ['news.create'], breakdown: true })
        .subscribe(v => result.push(v));
      http.expectOne(ENDPOINT).flush(BREAKDOWN_RESPONSE);
      expect(result[0]).toEqual(BREAKDOWN_RESPONSE);
    });

    it('propagates HTTP 403 errors', () => {
      let err: any;
      service.query({ scopeType: 1, scopeIds: [], permissions: [], breakdown: false })
        .subscribe({ error: e => (err = e) });
      http.expectOne(ENDPOINT).flush('Forbidden', { status: 403, statusText: 'Forbidden' });
      expect(err.status).toBe(403);
    });

    it('propagates HTTP 500 errors', () => {
      let err: any;
      service.query({ scopeType: 1, scopeIds: [], permissions: [], breakdown: false })
        .subscribe({ error: e => (err = e) });
      http.expectOne(ENDPOINT).flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      expect(err.status).toBe(500);
    });
  });

  // ------------------------------------------------------------------ normalizeRequest (via body inspection)
  describe('request normalization', () => {
    it('sorts scopeIds numerically ascending', () => {
      service.query({ scopeType: 2, scopeIds: [30, 5, 100, 1], permissions: [], breakdown: false }).subscribe();
      const req = http.expectOne(ENDPOINT);
      expect(req.request.body.scopeIds).toEqual([1, 5, 30, 100]);
      req.flush(SUMMARY_RESPONSE);
    });

    it('sorts permissions alphabetically ascending', () => {
      service.query({ scopeType: 1, scopeIds: [], permissions: ['news.edit', 'assoc.view', 'news.create'], breakdown: false }).subscribe();
      const req = http.expectOne(ENDPOINT);
      expect(req.request.body.permissions).toEqual(['assoc.view', 'news.create', 'news.edit']);
      req.flush(SUMMARY_RESPONSE);
    });

    it('defaults scopeIds to [] when not provided (undefined)', () => {
      const reqNoIds = { scopeType: 1, permissions: ['p'], breakdown: false } as any;
      service.query(reqNoIds).subscribe();
      const req = http.expectOne(ENDPOINT);
      expect(req.request.body.scopeIds).toEqual([]);
      req.flush(SUMMARY_RESPONSE);
    });

    it('defaults permissions to [] when not provided (undefined)', () => {
      const reqNoPerms = { scopeType: 1, scopeIds: [1], breakdown: false } as any;
      service.query(reqNoPerms).subscribe();
      const req = http.expectOne(ENDPOINT);
      expect(req.request.body.permissions).toEqual([]);
      req.flush(SUMMARY_RESPONSE);
    });

    it('preserves scopeType and breakdown in normalized body', () => {
      service.query({ scopeType: 3, scopeIds: [7], permissions: ['g.edit'], breakdown: true }).subscribe();
      const req = http.expectOne(ENDPOINT);
      expect(req.request.body.scopeType).toBe(3);
      expect(req.request.body.breakdown).toBe(true);
      req.flush(BREAKDOWN_RESPONSE);
    });

    it('does not mutate the original request object', () => {
      const original: AuthzQueryRequest = { scopeType: 2, scopeIds: [3, 1], permissions: ['z', 'a'], breakdown: false };
      service.query(original).subscribe();
      http.expectOne(ENDPOINT).flush(SUMMARY_RESPONSE);
      // Los arrays originales no deben mutarse
      expect(original.scopeIds).toEqual([3, 1]);
      expect(original.permissions).toEqual(['z', 'a']);
    });
  });
});
