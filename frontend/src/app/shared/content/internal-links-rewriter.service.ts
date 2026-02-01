import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Función que construye URLs para enlaces internos basándose en tipo e ID.
 * Puede devolver un Observable si necesita resolver datos asincrónicamente.
 */
export type BuildUrlFn = (type: string | number, id: number) => Observable<string> | string;

/**
 * Servicio para reescribir enlaces internos en HTML antes de renderizar.
 *
 * Busca elementos <a> con atributos data-internal-type y data-internal-id,
 * y actualiza su href usando una función de construcción de URL proporcionada.
 *
 * Utiliza DOMParser para manipular el HTML de forma segura.
 */
@Injectable({ providedIn: 'root' })
export class InternalLinksRewriterService {
  /**
   * Reescribe enlaces internos en HTML de forma asíncrona.
   *
   * @param html HTML original con enlaces que tienen data-internal-type y data-internal-id
   * @param buildUrl Función que construye la URL final basándose en type e id (puede ser asíncrona)
   * @returns Observable con el HTML con los hrefs actualizados
   */
  rewrite(html: string, buildUrl: BuildUrlFn): Observable<string> {
    // Parsear el HTML usando DOMParser
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Buscar todos los enlaces con data-internal-type y data-internal-id
    const links = Array.from(
      doc.body.querySelectorAll<HTMLAnchorElement>('a[data-internal-type][data-internal-id]')
    );

    if (links.length === 0) {
      return of(doc.body.innerHTML);
    }

    // Crear array de observables para resolver todas las URLs
    const urlResolvers = links.map((anchor) => {
      const typeAttr = anchor.getAttribute('data-internal-type');
      const idAttr = anchor.getAttribute('data-internal-id');

      if (!typeAttr || !idAttr) {
        return of({ anchor, url: anchor.getAttribute('href') || '#' });
      }

      // Convertir type a número si es numérico
      const type = /^\d+$/.test(typeAttr) ? Number(typeAttr) : typeAttr;
      const id = Number(idAttr);

      try {
        const result = buildUrl(type, id);
        const url$ = result instanceof Observable ? result : of(result);

        return url$.pipe(
          map((url) => ({ anchor, url }))
        );
      } catch (error) {
        console.warn(`No se pudo resolver enlace interno: type=${type}, id=${id}`, error);
        anchor.classList.add('is-broken-link');
        return of({ anchor, url: anchor.getAttribute('href') || '#' });
      }
    });

    // Esperar a que todas las URLs se resuelvan
    return forkJoin(urlResolvers).pipe(
      map((results) => {
        // Actualizar todos los hrefs
        results.forEach(({ anchor, url }) => {
          anchor.setAttribute('href', url);
        });
        return doc.body.innerHTML;
      })
    );
  }
}
