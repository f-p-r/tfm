import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InternalLinksApiService } from './internal-links-api.service';
import { WebScope } from '../../core/web-scope.constants';

/**
 * Interfaz actualizada que representa un destino de enlace interno.
 * Ahora soporta type e id en lugar de solo pageId.
 */
export interface InternalLinkDestination {
  label: string; // Texto visible del enlace
  href: string; // URL del enlace
  type: string | number; // "news" | "event" | "page" | 2 (ASSOCIATION) | 3 (GAME)
  id: number; // ID numérico del contenido
}

type SelectorMode = 'pages' | 'paste-url';

/**
 * Componente modal para seleccionar destinos de enlaces internos.
 * Soporta dos modos:
 * - 'pages': Lista de páginas predefinidas (modo original)
 * - 'paste-url': Pegar URL interna (noticias, eventos, juegos, asociaciones)
 *
 * Emite eventos:
 * - select: cuando el usuario elige un destino
 * - cancel: cuando el usuario cierra el modal sin seleccionar
 */
@Component({
  selector: 'app-link-selector',
  imports: [FormsModule],
  template: `
    <div class="link-selector">
      <!-- Backdrop oscuro que cubre la pantalla -->
      <div class="link-selector-backdrop"></div>
      <div class="link-selector-panel">
        <h3 class="link-selector-title">Insertar enlace interno</h3>

        <!-- Selector de modo -->
        <div class="mode-selector">
          <button
            type="button"
            [class.active]="mode() === 'pages'"
            (click)="mode.set('pages')"
          >
            Página
          </button>
          <button
            type="button"
            [class.active]="mode() === 'paste-url'"
            (click)="mode.set('paste-url')"
          >
            Pegar URL interna
          </button>
        </div>

        <!-- Modo: Lista de páginas -->
        @if (mode() === 'pages') {
          <div class="link-selector-options">
            @for (dest of pageDestinations; track dest.id) {
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
        }

        <!-- Modo: Pegar URL -->
        @if (mode() === 'paste-url') {
          <div class="paste-url-section">
            <label class="input-label">URL interna</label>
            <input
              type="text"
              class="input-text"
              [(ngModel)]="pastedUrl"
              placeholder="/eventos/torneo-primavera"
            />
            @if (error()) {
              <p class="error-message">{{ error() }}</p>
            }
            @if (resolving()) {
              <p class="info-message">Resolviendo...</p>
            }
            <button
              type="button"
              class="btn btn-primary mt-3"
              (click)="resolveUrl()"
              [disabled]="!pastedUrl() || resolving()"
            >
              Insertar enlace
            </button>
          </div>
        }

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
      pointer-events: none;
    }

    .link-selector-panel {
      position: relative;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      width: 100%;
      max-width: 32rem;
      max-height: 90vh;
      overflow-y: auto;
    }

    .link-selector-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .mode-selector {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .mode-selector button {
      flex: 1;
      padding: 0.75rem;
      border: none;
      background: transparent;
      cursor: pointer;
      font-weight: 500;
      color: #6b7280;
      border-bottom: 2px solid transparent;
      transition: all 0.15s;
    }

    .mode-selector button.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
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

    .paste-url-section {
      margin-bottom: 1rem;
    }

    .input-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .input-text {
      width: 100%;
      padding: 0.625rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .input-text:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .error-message {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #dc2626;
    }

    .info-message {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #3b82f6;
    }

    .link-selector-footer {
      display: flex;
      justify-content: flex-end;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border: none;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #f9fafb;
    }

    .mt-3 {
      margin-top: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkSelectorComponent {
  private readonly apiService = inject(InternalLinksApiService);

  // Modo actual del selector
  readonly mode = signal<SelectorMode>('pages');

  // URL pegada por el usuario
  readonly pastedUrl = signal('');

  // Error de validación o resolución
  readonly error = signal<string | null>(null);

  // Indica si está resolviendo la URL
  readonly resolving = signal(false);

  // Lista de páginas predefinidas (modo original)
  readonly pageDestinations: InternalLinkDestination[] = [
    {
      label: 'Inicio',
      href: '/',
      type: 'page',
      id: 1,
    },
    {
      label: 'Acerca de',
      href: '/acerca-de',
      type: 'page',
      id: 2,
    },
  ];

  // Emitido cuando el usuario selecciona un destino
  readonly select = output<InternalLinkDestination>();

  // Emitido cuando el usuario cancela la selección
  readonly cancel = output<void>();

  /**
   * Resuelve la URL pegada: valida, detecta tipo/slug, llama al API.
   */
  resolveUrl(): void {
    this.error.set(null);
    const url = this.pastedUrl().trim();

    if (!url) {
      this.error.set('Ingrese una URL');
      return;
    }

    // Validar y extraer pathname
    let pathname: string;
    try {
      // Si es URL absoluta, validar dominio
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const urlObj = new URL(url);
        if (urlObj.origin !== window.location.origin) {
          this.error.set('La URL debe pertenecer a esta web');
          return;
        }
        pathname = urlObj.pathname;
      } else {
        // URL relativa
        pathname = url;
      }
    } catch {
      // Asumir URL relativa si falla el parseo
      pathname = url;
    }

    // Rechazar si contiene ? o #
    if (pathname.includes('?') || pathname.includes('#')) {
      this.error.set('La URL no puede contener parámetros (?) ni fragmentos (#)');
      return;
    }

    // Extraer segmentos
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length < 2) {
      this.error.set('No se reconoce el tipo de contenido en la URL');
      return;
    }

    const [prefix, slug] = segments;
    let type: string | number;

    // Detectar tipo según el patrón
    switch (prefix) {
      case 'noticias':
        type = 'news';
        break;
      case 'eventos':
        type = 'event';
        break;
      case 'juegos':
        type = WebScope.GAME; // 3
        break;
      case 'asociaciones':
        type = WebScope.ASSOCIATION; // 2
        break;
      case 'p':
        type = 'page';
        break;
      default:
        this.error.set('No se reconoce el tipo de contenido en la URL');
        return;
    }

    // Llamar al API para resolver
    console.log('Resolviendo enlace:', { type, slug, pathname });
    this.resolving.set(true);
    this.apiService.resolve(type, slug).subscribe({
      next: (resolution) => {
        console.log('Resolución exitosa:', resolution);
        this.resolving.set(false);
        this.select.emit({
          label: resolution.title || slug,
          href: pathname,
          type: resolution.type,
          id: resolution.id,
        });
      },
      error: (err) => {
        console.error('Error al resolver enlace:', err);
        this.resolving.set(false);
        this.error.set('No se ha encontrado el contenido indicado');
      },
    });
  }
}
