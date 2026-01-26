import { Component, input, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpPrefsService } from '../help-prefs.service';
import { HelpOverlayService } from '../help-overlay.service';

/**
 * Componente que muestra un botón de ayuda circular con "i".
 * Solo visible si los iconos de ayuda están habilitados en las preferencias.
 *
 * Ejemplo de uso:
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
    @if (title() && text() && (helpPrefs.helpIconsOn$ | async)) {
      <button
        #btn
        type="button"
        class="ds-help-i"
        [attr.aria-label]="'Ayuda: ' + title()"
        (click)="onClick()"
      >
        i
      </button>
    }
  `,
})
export class HelpIComponent {
  readonly title = input.required<string>();
  readonly text = input.required<string>();

  @ViewChild('btn', { read: ElementRef }) buttonRef?: ElementRef<HTMLButtonElement>;

  readonly helpPrefs = inject(HelpPrefsService);
  private readonly helpOverlay = inject(HelpOverlayService);

  onClick(): void {
    if (!this.buttonRef) return;
    const anchor = this.buttonRef.nativeElement;
    this.helpOverlay.open(anchor, this.title(), this.text(), true);
  }
}
