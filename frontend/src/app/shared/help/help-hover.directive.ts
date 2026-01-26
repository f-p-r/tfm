/**
 * Directiva para mostrar ayuda contextual en hover/focus (solo en desktop).
 *
 * Comportamiento:
 * - Solo se activa en dispositivos con hover (pointer: fine)
 * - mouseenter: abre popover SIN botón cerrar
 * - mouseleave: cierra popover (excepto si tiene foco)
 * - focusin: abre popover CON botón cerrar
 * - focusout: cierra popover
 *
 * Uso:
 * ```html
 * <input
 *   helpHover
 *   helpTitle="Email"
 *   helpText="Introduce un email válido"
 * />
 * ```
 */
import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';
import { HelpOverlayService } from './help-overlay.service';

@Directive({
  selector: '[helpHover]',
  standalone: true,
})
export class HelpHoverDirective {
  readonly helpTitle = input.required<string>();
  readonly helpText = input.required<string>();

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly helpOverlay = inject(HelpOverlayService);

  private readonly supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  private isFocused = false;

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!this.supportsHover) return;
    if (!this.helpTitle() || !this.helpText()) return;

    this.helpOverlay.open(this.elementRef.nativeElement, this.helpTitle(), this.helpText(), false);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (!this.supportsHover) return;
    if (this.isFocused) return;

    this.helpOverlay.close();
  }

  @HostListener('focusin')
  onFocusIn(): void {
    if (!this.helpTitle() || !this.helpText()) return;

    this.isFocused = true;
    this.helpOverlay.open(this.elementRef.nativeElement, this.helpTitle(), this.helpText(), true);
  }

  @HostListener('focusout')
  onFocusOut(): void {
    this.isFocused = false;
    this.helpOverlay.close();
  }
}
