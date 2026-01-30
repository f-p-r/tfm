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
}
