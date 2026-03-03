import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { ContextStore } from '../../core/context/context.store';
import { getDefaultPageHelp } from './page-content/default.help';

/**
 * Servicio para la ayuda contextual a nivel de página.
 *
 * Cada página activa registra su propio HTML de ayuda al crearse.
 * El modal de ayuda (HelpPanelComponent) lo lee y lo muestra con [innerHTML].
 *
 * Flujo por navegación:
 * 1. NavigationStart → se marca que no hay ayuda personalizada aún.
 * 2. El guard resuelve el scope (ContextStore se actualiza).
 * 3. El constructor del componente puede llamar a set() con ayuda propia.
 * 4. NavigationEnd → si nadie llamó set(), se aplica el texto por defecto
 *    usando el scope ya correcto.
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
  private readonly _context = inject(ContextStore);
  private readonly _html = signal<string>(getDefaultPageHelp(this._context.scopeType()));
  private _customSet = false;

  /** HTML de ayuda de la página actualmente activa. */
  readonly html = this._html.asReadonly();

  constructor() {
    inject(Router).events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this._customSet = false;
      } else if (event instanceof NavigationEnd) {
        if (!this._customSet) {
          this._html.set(getDefaultPageHelp(this._context.scopeType()));
        }
      }
    });
  }

  /** Establece el HTML de ayuda para la página activa. Llamar en el constructor de la página. */
  set(html: string): void {
    this._customSet = true;
    this._html.set(html);
  }
}