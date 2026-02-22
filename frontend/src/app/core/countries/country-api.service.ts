import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CountryDTO {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CountryApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/api/countries`;

  list(): Observable<CountryDTO[]> {
    return this.http.get<CountryDTO[]>(this.endpoint);
  }
}
