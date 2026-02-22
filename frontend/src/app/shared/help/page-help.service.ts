import { Injectable, signal } from '@angular/core';

/**
 * Servicio para la ayuda contextual a nivel de página.
 *
 * Cada página activa registra su propio HTML de ayuda al crearse.
 * El modal de ayuda (HelpPanelComponent) lo lee y lo muestra con [innerHTML].
 *
 * Uso en la página:
 * ```typescript
 * constructor() {
 *   inject(PageHelpService).set(MY_PAGE_HELP);
 * }
 * ```
 *
 * Nota: no es necesario limpiar en ngOnDestroy porque la siguiente
 * página sobrescribe el valor al crearse.
 */
@Injectable({ providedIn: 'root' })
export class PageHelpService {
  private readonly _html = signal<string | null>(null);

  /** HTML de ayuda de la página actualmente activa. Null si no hay ayuda registrada. */
  readonly html = this._html.asReadonly();

  /** Establece el HTML de ayuda para la página activa. Llamar en el constructor de la página. */
  set(html: string | null): void {
    this._html.set(html);
  }
}
