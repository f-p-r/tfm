/**
 * Servicio API para consultar juegos desde el backend.
 * Endpoint: GET /api/games
 *
 * Ejemplo de uso:
 * ```
 * constructor(private gamesApi = inject(GamesApiService)) {}
 *
 * cargarJuegos() {
 *   this.gamesApi.getGames().subscribe(games => console.log(games));
 * }
 * ```
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Game } from './games.models';

@Injectable({ providedIn: 'root' })
export class GamesApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/api/games`;

  /**
   * Obtiene la lista de juegos del backend.
   *
   * @param includeDisabled Si true, incluye juegos deshabilitados. Por defecto false.
   * @returns Observable con el array de juegos.
   */
  getGames(includeDisabled = false): Observable<Game[]> {
    let params = new HttpParams();
    if (includeDisabled) {
      params = params.set('include_disabled', 'true');
    }
    return this.http.get<Game[]>(this.endpoint, { params });
  }

  /**
   * Obtiene un juego por su slug.
   *
   * @param slug Slug del juego (será URL-encoded automáticamente).
   * @returns Observable con los datos del juego.
   * @throws 404 si no existe o está deshabilitado.
   */
  getBySlug(slug: string): Observable<Game> {
    return this.http.get<Game>(`${this.endpoint}/by-slug/${encodeURIComponent(slug)}`);
  }

  /**
   * Crea un nuevo juego.
   *
   * @param data Datos del juego a crear.
   * @returns Observable con el juego creado.
   */
  createGame(data: Partial<Game>): Observable<Game> {
    return this.http.post<Game>(this.endpoint, data);
  }

  /**
   * Actualiza un juego existente.
   *
   * @param id ID del juego a actualizar.
   * @param data Datos parciales del juego a actualizar.
   * @returns Observable con el juego actualizado.
   */
  updateGame(id: number, data: Partial<Game>): Observable<Game> {
    return this.http.put<Game>(`${this.endpoint}/${id}`, data);
  }
}
