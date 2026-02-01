import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Respuesta del endpoint de resolución de enlaces internos.
 */
export interface InternalLinkResolution {
  type: string | number; // "news" | "event" | "page" | 2 (ASSOCIATION) | 3 (GAME)
  id: number;
  slug: string;
  title: string;
}

/**
 * Servicio para resolver enlaces internos llamando al backend.
 * Convierte combinaciones de {type, slug} en {type, id, title}.
 */
@Injectable({ providedIn: 'root' })
export class InternalLinksApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/api/internal-links/resolve`;

  /**
   * Resuelve un enlace interno desde type y slug.
   *
   * @param type Tipo de contenido: "news" | "event" | "page" | 2 (ASSOCIATION) | 3 (GAME)
   * @param slug Slug del contenido
   * @returns Observable con la resolución del enlace
   */
  resolve(type: string | number, slug: string): Observable<InternalLinkResolution> {
    const params = { type: String(type), slug };
    return this.http.get<InternalLinkResolution>(this.apiUrl, { params });
  }
}
