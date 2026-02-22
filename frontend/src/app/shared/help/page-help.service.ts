import { Injectable, inject, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { DEFAULT_PAGE_HELP } from './page-content/default.help';

/**
 * Servicio para la ayuda contextual a nivel de página.
 *
 * Cada página activa registra su propio HTML de ayuda al crearse.
 * El modal de ayuda (HelpPanelComponent) lo lee y lo muestra con [innerHTML].
 *
 * En cada navegación el servicio resetea automáticamente al contenido
 * por defecto (DEFAULT_PAGE_HELP). Las páginas con ayuda propia lo
 * sobreescriben llamando a set() en su constructor.
 *
 * Uso en la página:
 * ```typescript
 * constructor() {
 *   inject(PageHelpService).set(MY_PAGE_HELP);
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class PageHelpService {
  private readonly _html = signal<string>(DEFAULT_PAGE_HELP);

  /** HTML de ayuda de la página actualmente activa. */
  readonly html = this._html.asReadonly();

  constructor() {
    inject(Router).events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this._html.set(DEFAULT_PAGE_HELP);
      }
    });
  }

  /** Establece el HTML de ayuda para la página activa. Llamar en el constructor de la página. */
  set(html: string): void {
    this._html.set(html);
  }
}
