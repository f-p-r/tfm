/**
 * Servicio para gestionar popovers de ayuda contextual usando DOM nativo.
 *
 * Funcionalidades:
 * - Crea y posiciona popovers dinámicamente cerca del elemento ancla
 * - Solo permite un popover abierto a la vez
 * - Ajusta la posición para evitar salirse del viewport
 * - Maneja cierre por: click fuera, tecla Escape, o botón cerrar
 * - Usa textContent para prevenir XSS
 *
 * El popover se renderiza con clases del Design System (ds-popover, etc.).
 */
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HelpOverlayService {
  private popoverElement: HTMLDivElement | null = null;
  private onDocumentClick: ((e: MouseEvent) => void) | null = null;
  private onDocumentKeydown: ((e: KeyboardEvent) => void) | null = null;

  open(anchor: HTMLElement, title: string, text: string, withCloseButton = true): void {
    this.close();

    // Crear contenedor del popover
    const popover = document.createElement('div');
    popover.className = 'ds-popover';
    popover.style.position = 'fixed';
    popover.style.zIndex = '10000';

    // Título
    const titleEl = document.createElement('div');
    titleEl.className = 'ds-popover-title';
    titleEl.textContent = title;
    popover.appendChild(titleEl);

    // Texto
    const textEl = document.createElement('div');
    textEl.className = 'ds-popover-text';
    textEl.textContent = text;
    popover.appendChild(textEl);

    // Acciones (botón cerrar)
    if (withCloseButton) {
      const actionsEl = document.createElement('div');
      actionsEl.className = 'ds-popover-actions';

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'ds-btn ds-btn-secondary ds-btn-sm';
      closeBtn.textContent = 'Cerrar';
      closeBtn.addEventListener('click', () => this.close());

      actionsEl.appendChild(closeBtn);
      popover.appendChild(actionsEl);
    }

    document.body.appendChild(popover);
    this.popoverElement = popover;

    // Posicionamiento
    this.positionPopover(anchor, popover);

    // Listeners para cerrar
    this.onDocumentClick = (e: MouseEvent) => {
      if (!popover.contains(e.target as Node) && !anchor.contains(e.target as Node)) {
        this.close();
      }
    };

    this.onDocumentKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };

    // Delay para evitar que el click que abrió el popover lo cierre inmediatamente
    setTimeout(() => {
      document.addEventListener('click', this.onDocumentClick!, true);
      document.addEventListener('keydown', this.onDocumentKeydown!);
    }, 0);
  }

  close(): void {
    if (this.popoverElement) {
      this.popoverElement.remove();
      this.popoverElement = null;
    }

    if (this.onDocumentClick) {
      document.removeEventListener('click', this.onDocumentClick, true);
      this.onDocumentClick = null;
    }

    if (this.onDocumentKeydown) {
      document.removeEventListener('keydown', this.onDocumentKeydown);
      this.onDocumentKeydown = null;
    }
  }

  private positionPopover(anchor: HTMLElement, popover: HTMLDivElement): void {
    const anchorRect = anchor.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 10;

    // Posición inicial: debajo del anchor con margen 8px (coordenadas de viewport — fixed)
    let top = anchorRect.bottom + 8;
    let left = anchorRect.left;

    // Clamp horizontal: no salirse del viewport
    const maxLeft = viewportWidth - popoverRect.width - margin;
    if (left < margin) left = margin;
    else if (left > maxLeft) left = maxLeft;

    // Clamp vertical: si no cabe abajo, abrir hacia arriba
    if (top + popoverRect.height + margin > viewportHeight) {
      top = anchorRect.top - popoverRect.height - 8;
    }
    // Si tampoco cabe arriba, anclar al margen superior
    if (top < margin) top = margin;

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }
}
