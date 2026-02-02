import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { PageOwnerType, PageOwnerScope } from '../../shared/content/page.dto';
import { isLaravelValidationError } from '../auth/laravel-validation-error';
import { environment } from '../../../environments/environment';
import { SiteParamsService } from '../site-params/site-params.service';

interface HomePageResponse {
  homePageId: number | null;
}

const GLOBAL_HOMEPAGE_PARAM_ID = 'homepage';

@Injectable({
  providedIn: 'root',
})
export class OwnerPagesSettingsService {
  private readonly http = inject(HttpClient);
  private readonly siteParamsService = inject(SiteParamsService);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  /**
   * Obtiene el ID de la página home para un owner dado
   * GET /api/admin/owners/home-page?ownerType={ownerType}&ownerId={ownerId}
   *
   * NOTA: Para ownerType GLOBAL (1), usa site-params en lugar del endpoint de owners
   *
   * @returns Observable con el ID de la página home o null si no está configurada
   */
  getHomePageId(
    ownerType: PageOwnerType,
    ownerId: number,
  ): Observable<number | null> {
    // Para páginas globales, usar site-params
    if (ownerType === PageOwnerScope.GLOBAL) {
      return this.siteParamsService.getNumber(GLOBAL_HOMEPAGE_PARAM_ID);
    }

    // Para owners específicos (asociaciones, juegos), usar endpoint owners
    const params = new HttpParams()
      .set('ownerType', ownerType)
      .set('ownerId', ownerId.toString());

    return this.http
      .get<HomePageResponse>(`${this.apiBaseUrl}/api/admin/owners/home-page`, { params })
      .pipe(
        map((response) => response.homePageId),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Establece el ID de la página home para un owner dado
   * PUT /api/admin/owners/home-page
   *
   * NOTA: Para ownerType GLOBAL (1), usa site-params en lugar del endpoint de owners
   *
   * @param pageId ID de la página home, o null para desasignar
   * @returns Observable que completa cuando la operación es exitosa
   */
  setHomePageId(
    ownerType: PageOwnerType,
    ownerId: number,
    pageId: number | null,
  ): Observable<void> {
    // Para páginas globales, usar site-params
    if (ownerType === PageOwnerScope.GLOBAL) {
      if (pageId === null) {
        // Si se desasigna, guardamos "0" o podríamos eliminar el parámetro
        return this.siteParamsService.setString(GLOBAL_HOMEPAGE_PARAM_ID, '0').pipe(
          map(() => void 0)
        );
      }
      return this.siteParamsService.setNumber(GLOBAL_HOMEPAGE_PARAM_ID, pageId);
    }

    // Para owners específicos (asociaciones, juegos), usar endpoint owners
    const body = {
      ownerType,
      ownerId,
      homePageId: pageId,
    };

    return this.http
      .put<HomePageResponse>(`${this.apiBaseUrl}/api/admin/owners/home-page`, body)
      .pipe(
        map(() => void 0),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Maneja errores HTTP con soporte para errores de validación 422
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      return throwError(() => ({
        status: 401,
        message: 'No autorizado',
      }));
    }

    if (error.status === 404) {
      return throwError(() => ({
        status: 404,
        message: 'Owner no encontrado',
      }));
    }

    if (error.status === 422 && isLaravelValidationError(error.error)) {
      return throwError(() => ({
        status: 422,
        message: error.error.message || 'Error de validación',
        errors: error.error.errors || {},
      }));
    }

    return throwError(() => ({
      status: error.status,
      message: error.message || 'Error del servidor',
    }));
  }
}
