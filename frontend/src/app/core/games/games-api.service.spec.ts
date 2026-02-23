import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GamesApiService } from './games-api.service';
import { Game } from './games.models';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiBaseUrl}/api/games`;

const GAME_A: Game = {
  id: 1, name: 'Chess', slug: 'chess',
  team_size: 1, disabled: false,
  created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
};

const GAME_B: Game = {
  id: 2, name: 'Disabled Game', slug: 'disabled-game',
  team_size: 2, disabled: true,
  created_at: '2024-02-01T00:00:00Z', updated_at: '2024-02-01T00:00:00Z',
};

describe('GamesApiService', () => {
  let service: GamesApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GamesApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  // ------------------------------------------------------------------ getGames
  describe('getGames()', () => {
    it('calls GET /api/games without params by default', () => {
      service.getGames().subscribe();
      const req = http.expectOne(BASE);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('include_disabled')).toBe(false);
      req.flush([GAME_A]);
    });

    it('calls GET /api/games?include_disabled=true when flag is set', () => {
      service.getGames(true).subscribe();
      const req = http.expectOne(r => r.url === BASE);
      expect(req.request.params.get('include_disabled')).toBe('true');
      req.flush([GAME_A, GAME_B]);
    });

    it('returns the array of games emitted by the API', () => {
      const result: Game[][] = [];
      service.getGames().subscribe(g => result.push(g));
      http.expectOne(BASE).flush([GAME_A]);
      expect(result[0]).toEqual([GAME_A]);
    });

    it('returns both enabled and disabled games when include_disabled=true', () => {
      const result: Game[][] = [];
      service.getGames(true).subscribe(g => result.push(g));
      http.expectOne(r => r.url === BASE).flush([GAME_A, GAME_B]);
      expect(result[0]).toHaveLength(2);
    });

    it('propagates HTTP errors', () => {
      let err: any;
      service.getGames().subscribe({ error: e => (err = e) });
      http.expectOne(BASE).flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      expect(err.status).toBe(500);
    });
  });

  // ------------------------------------------------------------------ getBySlug
  describe('getBySlug()', () => {
    it('calls GET /api/games/by-slug/:slug', () => {
      service.getBySlug('chess').subscribe();
      const req = http.expectOne(`${BASE}/by-slug/chess`);
      expect(req.request.method).toBe('GET');
      req.flush(GAME_A);
    });

    it('URL-encodes slugs with special characters', () => {
      service.getBySlug('hold em').subscribe();
      const req = http.expectOne(`${BASE}/by-slug/hold%20em`);
      req.flush(GAME_A);
    });

    it('returns the game object', () => {
      const result: Game[] = [];
      service.getBySlug('chess').subscribe(g => result.push(g));
      http.expectOne(`${BASE}/by-slug/chess`).flush(GAME_A);
      expect(result[0]).toEqual(GAME_A);
    });

    it('propagates 404 errors', () => {
      let err: any;
      service.getBySlug('unknown').subscribe({ error: e => (err = e) });
      http.expectOne(`${BASE}/by-slug/unknown`).flush('Not Found', { status: 404, statusText: 'Not Found' });
      expect(err.status).toBe(404);
    });
  });

  // ------------------------------------------------------------------ createGame
  describe('createGame()', () => {
    it('calls POST /api/games with the payload', () => {
      const payload: Partial<Game> = { name: 'New Game', slug: 'new-game', team_size: 5 };
      service.createGame(payload).subscribe();
      const req = http.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ ...GAME_A, ...payload, id: 99 });
    });

    it('returns the created game', () => {
      const created: Game = { ...GAME_A, id: 99, name: 'New Game' };
      const result: Game[] = [];
      service.createGame({ name: 'New Game' }).subscribe(g => result.push(g));
      http.expectOne(BASE).flush(created);
      expect(result[0]).toEqual(created);
    });

    it('propagates 422 validation errors', () => {
      let err: any;
      service.createGame({}).subscribe({ error: e => (err = e) });
      http.expectOne(BASE).flush({ message: 'The name field is required.' }, { status: 422, statusText: 'Unprocessable Entity' });
      expect(err.status).toBe(422);
    });
  });

  // ------------------------------------------------------------------ updateGame
  describe('updateGame()', () => {
    it('calls PUT /api/games/:id with the payload', () => {
      const payload: Partial<Game> = { name: 'Updated Chess', team_size: 2 };
      service.updateGame(1, payload).subscribe();
      const req = http.expectOne(`${BASE}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ ...GAME_A, ...payload });
    });

    it('returns the updated game', () => {
      const updated: Game = { ...GAME_A, name: 'Updated Chess' };
      const result: Game[] = [];
      service.updateGame(1, { name: 'Updated Chess' }).subscribe(g => result.push(g));
      http.expectOne(`${BASE}/1`).flush(updated);
      expect(result[0]).toEqual(updated);
    });

    it('uses the correct ID in the URL', () => {
      service.updateGame(42, { disabled: true }).subscribe();
      const req = http.expectOne(`${BASE}/42`);
      expect(req.request.url).toContain('/42');
      req.flush({ ...GAME_A, id: 42 });
    });

    it('propagates 403 errors', () => {
      let err: any;
      service.updateGame(1, {}).subscribe({ error: e => (err = e) });
      http.expectOne(`${BASE}/1`).flush('Forbidden', { status: 403, statusText: 'Forbidden' });
      expect(err.status).toBe(403);
    });
  });
});
