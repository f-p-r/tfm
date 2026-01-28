import { Component, input, ViewChild, ElementRef, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpPrefsService } from '../help-prefs.service';
import { HelpOverlayService } from '../help-overlay.service';
import { HelpContentService } from '../help-content.service';

/**
 * Componente que muestra un botón de ayuda circular con "i".
 * Solo visible si los iconos de ayuda están habilitados en las preferencias.
 *
 * Uso con helpKey (recomendado):
 * ```html
 * <app-help-i helpKey="email" />
 * ```
 *
 * Uso con title/text hardcodeado (compatible con código existente):
 * ```html
 * <app-help-i
 *   title="Título de la ayuda"
 *   text="Texto explicativo que aparecerá en el popover"
 * />
 * ```
 */
@Component({
  selector: 'app-help-i',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (resolvedTitle() && resolvedText() && (helpPrefs.helpIconsOn$ | async)) {
      <button
        #btn
        type="button"
        class="ds-help-i"
        [attr.aria-label]="'Ayuda: ' + resolvedTitle()"
        (click)="onClick()"
      >
        i
      </button>
    }
  `,
})
export class HelpIComponent {
  // Opción 1: Usar helpKey para resolver desde el pack activo
  readonly helpKey = input<string>();

  // Opción 2: Usar title/text directamente (compatibilidad)
  readonly title = input<string>();
  readonly text = input<string>();

  @ViewChild('btn', { read: ElementRef }) buttonRef?: ElementRef<HTMLButtonElement>;

  readonly helpPrefs = inject(HelpPrefsService);
  private readonly helpOverlay = inject(HelpOverlayService);
  private readonly helpContent = inject(HelpContentService);

  // Resuelve el título desde helpKey o usa el title directo
  readonly resolvedTitle = computed(() => {
    const key = this.helpKey();
    if (key) {
      const item = this.helpContent.getItem(key);
      return item?.title ?? null;
    }
    return this.title() ?? null;
  });

  // Resuelve el texto desde helpKey o usa el text directo
  readonly resolvedText = computed(() => {
    const key = this.helpKey();
    if (key) {
      const item = this.helpContent.getItem(key);
      return item?.text ?? null;
    }
    return this.text() ?? null;
  });

  onClick(): void {
    if (!this.buttonRef) return;
    const anchor = this.buttonRef.nativeElement;
    const title = this.resolvedTitle();
    const text = this.resolvedText();
    if (title && text) {
      this.helpOverlay.open(anchor, title, text, true);
    }
  }
}
