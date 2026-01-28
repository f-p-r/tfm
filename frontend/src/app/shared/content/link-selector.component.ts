import { ChangeDetectionStrategy, Component, output } from '@angular/core';

/**
 * Interfaz que representa un destino de enlace interno.
 * Contiene la información necesaria para crear un enlace a una página interna.
 */
export interface InternalLinkDestination {
  label: string; // Texto visible del enlace
  href: string; // URL del enlace
  pageId: string; // Identificador único de la página destino
}

/**
 * Componente modal para seleccionar destinos de enlaces internos.
 * Se utiliza en editores de texto enriquecido (Quill) para permitir al usuario
 * seleccionar páginas internas a las que enlazar desde el contenido.
 *
 * Emite eventos:
 * - select: cuando el usuario elige un destino
 * - cancel: cuando el usuario cierra el modal sin seleccionar
 */
@Component({
  selector: 'app-link-selector',
  imports: [],
  template: `
    <div class="link-selector">
      <!-- Backdrop oscuro que cubre la pantalla y cierra al hacer clic -->
      <div class="link-selector-backdrop" (click)="cancel.emit()"></div>
      <div class="link-selector-panel">
        <h3 class="link-selector-title">Seleccionar enlace interno</h3>
        <!-- Lista de destinos disponibles -->
        <div class="link-selector-options">
          @for (dest of destinations; track dest.pageId) {
            <button
              type="button"
              class="link-selector-option"
              (click)="select.emit(dest)"
            >
              <span class="font-medium">{{ dest.label }}</span>
              <span class="text-xs text-ds-gray-500">{{ dest.href }}</span>
            </button>
          }
        </div>
        <div class="link-selector-footer">
          <button type="button" class="btn btn-secondary" (click)="cancel.emit()">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .link-selector {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .link-selector-backdrop {
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
    }

    .link-selector-panel {
      position: relative;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      width: 100%;
      max-width: 28rem;
    }

    .link-selector-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .link-selector-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .link-selector-option {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      background: white;
      cursor: pointer;
      transition: all 0.15s;
      text-align: left;
    }

    .link-selector-option:hover {
      background: #f9fafb;
      border-color: #3b82f6;
    }

    .link-selector-footer {
      display: flex;
      justify-content: flex-end;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkSelectorComponent {
  // Lista de destinos disponibles para seleccionar
  // TODO: Esta lista debería cargarse dinámicamente desde un servicio
  readonly destinations: InternalLinkDestination[] = [
    {
      label: 'Google',
      href: 'https://google.com',
      pageId: '1',
    },
    {
      label: 'ChatGPT',
      href: 'https://chatgpt.com',
      pageId: '2',
    },
  ];

  // Emitido cuando el usuario selecciona un destino
  readonly select = output<InternalLinkDestination>();

  // Emitido cuando el usuario cancela la selección
  readonly cancel = output<void>();
}
