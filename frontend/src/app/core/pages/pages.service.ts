import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PageDTO, PageSummaryDTO, PageCreateDTO, PageUpdateDTO, PageOwnerType } from '../../shared/content/page.dto';
import { isLaravelValidationError } from '../auth/laravel-validation-error';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PagesService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  /**
   * Lista todas las páginas para un owner dado
   * GET /api/admin/pages?ownerType={ownerType}&ownerId={ownerId}
   */
  listByOwner(
    ownerType: PageOwnerType,
    ownerId: number,
  ): Observable<PageSummaryDTO[]> {
    const params = new HttpParams()
      .set('ownerType', ownerType)
      .set('ownerId', ownerId.toString());

    return this.http
      .get<PageSummaryDTO[]>(`${this.apiBaseUrl}/api/admin/pages`, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Obtiene una página por su ID (admin - incluye borradores)
   * GET /api/admin/pages/{id}
   */
  getById(id: number): Observable<PageDTO | null> {
    return this.http
      .get<PageDTO>(`${this.apiBaseUrl}/api/admin/pages/${id}`)
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            return throwError(() => ({
              status: 404,
              message: 'Página no encontrada',
            }));
          }
          return this.handleError(error);
        })
      );
  }

  /**
   * Obtiene una página publicada por su ID (público - solo páginas publicadas)
   * GET /api/pages/{id}
   */
  getPublicById(id: number): Observable<PageDTO | null> {
    return this.http
      .get<PageDTO>(`${this.apiBaseUrl}/api/pages/${id}`)
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            return throwError(() => ({
              status: 404,
              message: 'Página no encontrada o no publicada',
            }));
          }
          return this.handleError(error);
        })
      );
  }

  /**
   * Obtiene una página por owner y slug
   * (No hay endpoint específico para esto en la API admin, usar getById)
   * Nota: Este método se mantiene por compatibilidad pero no tiene endpoint directo
   */
  getBySlug(
    ownerType: PageOwnerType,
    ownerId: number,
    slug: string,
  ): Observable<PageDTO | null> {
    // Este método necesitaría primero listar y buscar, o un endpoint específico
    // Por ahora lo dejamos como no implementado
    return throwError(() => ({
      status: 501,
      message: 'getBySlug no implementado - usar listByOwner + búsqueda local',
    }));
  }

  /**
   * Crea una nueva página
   * POST /api/admin/pages
   */
  create(input: PageCreateDTO): Observable<PageDTO> {
    return this.http
      .post<PageDTO>(`${this.apiBaseUrl}/api/admin/pages`, input)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Actualiza una página existente
   * PATCH /api/admin/pages/{id}
   */
  update(id: number, patch: PageUpdateDTO): Observable<PageDTO> {
    return this.http
      .patch<PageDTO>(`${this.apiBaseUrl}/api/admin/pages/${id}`, patch)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Elimina una página
   * DELETE /api/admin/pages/{id}
   */
  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiBaseUrl}/api/admin/pages/${id}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Obtiene una página publicada por owner y pageSlug (endpoint público)
   * GET /api/pages/by-owner-slug?ownerType={ownerType}&ownerSlug={ownerSlug}&pageSlug={pageSlug}
   */
  getPublicPageByOwnerSlug(
    ownerType: PageOwnerType,
    ownerSlug: string,
    pageSlug: string,
  ): Observable<PageDTO | null> {
    const params = new HttpParams()
      .set('ownerType', ownerType)
      .set('ownerSlug', ownerSlug)
      .set('pageSlug', pageSlug);

    return this.http
      .get<PageDTO>(`${this.apiBaseUrl}/api/pages/by-owner-slug`, { params })
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            return throwError(() => ({
              status: 404,
              message: 'Página no encontrada',
            }));
          }
          return this.handleError(error);
        })
      );
  }

  /**
   * Obtiene la home page publicada de un owner (endpoint público)
   * GET /api/pages/home?ownerType={ownerType}&ownerSlug={ownerSlug}
   */
  getPublicHomePage(
    ownerType: PageOwnerType,
    ownerSlug: string,
  ): Observable<PageDTO | null> {
    const params = new HttpParams()
      .set('ownerType', ownerType)
      .set('ownerSlug', ownerSlug);

    return this.http
      .get<PageDTO>(`${this.apiBaseUrl}/api/pages/home`, { params })
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            return throwError(() => ({
              status: 404,
              message: 'Página de inicio no encontrada',
            }));
          }
          return this.handleError(error);
        })
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
        message: 'Recurso no encontrado',
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
