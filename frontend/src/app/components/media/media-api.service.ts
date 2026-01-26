import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MediaItem, MediaListParams, MediaListResponse } from './media.models';

@Injectable({ providedIn: 'root' })
export class MediaApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/media`;

  listMedia(params: MediaListParams): Observable<MediaListResponse> {
    const includeGlobal = params.includeGlobal ?? true;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 60;

    let httpParams = new HttpParams()
      .set('scopeType', params.scopeType)
      .set('includeGlobal', String(includeGlobal))
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    if (params.scopeId !== undefined && params.scopeId !== null) {
      httpParams = httpParams.set('scopeId', String(params.scopeId));
    }

    return this.http
      .get<MediaListResponse>(this.baseUrl, { params: httpParams })
      .pipe(map((res) => ({ ...res, items: (res.items ?? []).map((item) => this.normalizeItem(item)) })));
  }

  uploadMedia(file: File, scopeType: MediaListParams['scopeType'], scopeId?: number | null): Observable<MediaItem> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('scopeType', scopeType);
    if (scopeId !== undefined && scopeId !== null) {
      formData.append('scopeId', String(scopeId));
    }

    return this.http
      .post<{ item: MediaItem }>(`${this.baseUrl}/upload`, formData)
      .pipe(map((res) => this.normalizeItem(res.item)));
  }

  private normalizeItem(item: MediaItem): MediaItem {
    return {
      ...item,
      url: this.toAbsoluteUrl(item.url),
    };
  }

  private toAbsoluteUrl(url: string): string {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${environment.apiBaseUrl}${url}`;
    return `${environment.apiBaseUrl}/${url}`;
  }
}
