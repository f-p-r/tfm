/**
 * Directiva para mostrar ayuda contextual en hover (solo en desktop).
 *
 * Comportamiento:
 * - Solo se activa en dispositivos con hover (pointer: fine)
 * - mouseenter: abre popover SIN botón cerrar (solo si el campo NO tiene focus)
 * - mouseleave: cierra popover (excepto si tiene foco)
 * - focusin: cierra popover (para que no interfiera con dropdowns)
 * - focusout: permite mostrar el popover de nuevo en hover
 *
 * Uso con helpKey (recomendado):
 * ```html
 * <input helpHover helpKey="email" />
 * ```
 *
 * Uso con helpTitle/helpText hardcodeado (compatible con código existente):
 * ```html
 * <input
 *   helpHover
 *   helpTitle="Email"
 *   helpText="Introduce un email válido"
 * />
 * ```
 */
import { Directive, ElementRef, HostListener, inject, input, computed } from '@angular/core';
import { HelpOverlayService } from './help-overlay.service';
import { HelpContentService } from './help-content.service';

@Directive({
  selector: '[helpHover]',
  standalone: true,
})
export class HelpHoverDirective {
  // Opción 1: Usar helpKey para resolver desde el pack activo
  readonly helpKey = input<string>();

  // Opción 2: Usar helpTitle/helpText directamente (compatibilidad)
  readonly helpTitle = input<string>();
  readonly helpText = input<string>();

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly helpOverlay = inject(HelpOverlayService);
  private readonly helpContent = inject(HelpContentService);

  private readonly supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  private isFocused = false;

  // Resuelve el título desde helpKey o usa el helpTitle directo
  private readonly resolvedTitle = computed(() => {
    const key = this.helpKey();
    if (key) {
      const item = this.helpContent.getItem(key);
      return item?.title ?? null;
    }
    return this.helpTitle() ?? null;
  });

  // Resuelve el texto desde helpKey o usa el helpText directo
  private readonly resolvedText = computed(() => {
    const key = this.helpKey();
    if (key) {
      const item = this.helpContent.getItem(key);
      return item?.text ?? null;
    }
    return this.helpText() ?? null;
  });

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!this.supportsHover) return;
    if (this.isFocused) return; // No mostrar popup si el campo tiene focus
    const title = this.resolvedTitle();
    const text = this.resolvedText();
    if (!title || !text) return;

    this.helpOverlay.open(this.elementRef.nativeElement, title, text, false);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (!this.supportsHover) return;
    if (this.isFocused) return;

    this.helpOverlay.close();
  }

  @HostListener('focusin')
  onFocusIn(): void {
    this.isFocused = true;
    this.helpOverlay.close(); // Cerrar popup cuando el campo recibe focus
  }

  @HostListener('focusout')
  onFocusOut(): void {
    this.isFocused = false;
    this.helpOverlay.close();
  }
}
