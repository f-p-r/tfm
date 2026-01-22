import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MediaItem {
  id: number;
  url: string;
  createdAt: string;
  scopeType: string;
  scopeId: number | null;
}

export interface MediaListResponse {
  items: MediaItem[];
  page: number;
  pageSize: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class MediaApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/media`;

  listAssociationMedia(scopeId: number = 1, includeGlobal: boolean = true): Observable<MediaItem[]> {
    const params = new HttpParams()
      .set('scopeType', 'association')
      .set('scopeId', scopeId)
      .set('includeGlobal', includeGlobal)
      .set('page', 1)
      .set('pageSize', 60);

    return this.http
      .get<MediaListResponse>(this.baseUrl, { params })
      .pipe(
        map((res) =>
          (res.items ?? []).map((item) => ({
            ...item,
            url: this.toAbsoluteUrl(item.url),
          })),
        ),
      );
  }

  private toAbsoluteUrl(url: string): string {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${environment.apiBaseUrl}${url}`;
    return `${environment.apiBaseUrl}/${url}`;
  }
}
