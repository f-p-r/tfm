/**
 * Panel modal centrado para configurar las preferencias de ayuda.
 *
 * Permite al usuario activar/desactivar la visibilidad de los iconos ⓘ
 * en toda la aplicación mediante un toggle.
 *
 * El panel se puede cerrar mediante:
 * - Click en el backdrop
 * - Botón "Cerrar"
 * - Tecla Escape
 *
 * Uso:
 * ```html
 * <app-help-panel
 *   [isOpen]="panelAbierto"
 *   (close)="panelAbierto = false"
 * />
 * ```
 */
import { Component, input, output, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpPrefsService } from '../help-prefs.service';

@Component({
  selector: 'app-help-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="onBackdropClick()">
        <div
          class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4"
          (click)="$event.stopPropagation()"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-panel-title"
        >
          <h2 id="help-panel-title" class="text-xl font-semibold text-neutral-dark">Ayuda</h2>

          <p class="text-sm text-neutral-dark">
            Personaliza tu experiencia de ayuda. Activa los iconos de ayuda para ver información contextual en toda la aplicación.
          </p>

          <div class="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              id="help-icons-toggle"
              class="w-5 h-5 rounded border-neutral-medium text-primary-base focus:ring-2 focus:ring-primary-base"
              [checked]="helpPrefs.helpIconsOn$ | async"
              (change)="onToggleChange($event)"
            />
            <label for="help-icons-toggle" class="text-sm font-medium text-neutral-dark cursor-pointer">
              Mostrar iconos ⓘ
            </label>
          </div>

          <div class="flex justify-end pt-2">
            <button
              type="button"
              class="ds-btn ds-btn-secondary"
              (click)="onClose()"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class HelpPanelComponent {
  readonly isOpen = input<boolean>(false);
  readonly close = output<void>();

  readonly helpPrefs = inject(HelpPrefsService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.onClose();
    }
  }

  onBackdropClick(): void {
    this.onClose();
  }

  onClose(): void {
    this.close.emit();
  }

  onToggleChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.helpPrefs.setHelpIconsOn(checked);
  }
}
