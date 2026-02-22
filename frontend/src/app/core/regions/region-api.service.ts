import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RegionDTO {
  id: string;
  /** Código ISO Alpha-2 del país al que pertenece */
  country_id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class RegionApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/api/regions`;

  list(): Observable<RegionDTO[]> {
    return this.http.get<RegionDTO[]>(this.endpoint);
  }
}
