import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ContentRendererComponent } from '../../shared/content/content-renderer/content-renderer.component';
import { PageContentDTO } from '../../shared/content/page-content.dto';

const MOCK_CONTENT: PageContentDTO = {
  schemaVersion: 1,
  segments: [
    // 1. Cabecera a ancho completo con fondo brand-primary
    {
      id: 'seg-1',
      order: 1,
      type: 'columns',
      distribution: '1',
      containerWidth: 'standard',
      fullWidthBackground: true,
      backgroundColor: 'brand-primary',
      textColor: 'white',
      verticalPadding: 'large',
      columns: [
        {
          id: 'col-1',
          contentHtml: `
            <h1 class="h1 text-center" style="color: var(--color-brand-secondary)">Campeonato Nacional de Mus 2026</h1>
            <p class="ds-p-hero text-center">El torneo más esperado del año regresa con más participantes, más emoción y categorías ampliadas.
            No te pierdas la oportunidad de demostrar tu dominio del Mus entre los mejores del país.</p>
          `,
        },
      ],
    },
    // 2. Tres columnas informativas
    {
      id: 'seg-2',
      order: 2,
      type: 'columns',
      distribution: '1-1-1',
      containerWidth: 'standard',
      verticalPadding: 'normal',
      backgroundColor: 'white',
      columns: [
        {
          id: 'col-2a',
          contentHtml: `
            <h3 class="h3">📍 Sede</h3>
            <p>Pabellón Municipal de Deportes<br>
            Calle Mayor 42, Madrid<br>
            28013 España</p>
          `,
        },
        {
          id: 'col-2b',
          contentHtml: `
            <h3 class="h3">🗓️ Calendario</h3>
            <p><strong>Inicio:</strong> 15/03/2026 a las 10:00 h<br>
            <strong>Fin:</strong> 17/03/2026 a las 20:00 h<br>
            <strong>Inscripción hasta:</strong> 10/03/2026</p>
          `,
        },
        {
          id: 'col-2c',
          contentHtml: `
            <h3 class="h3">🏆 Premios</h3>
            <p><strong>1.º puesto:</strong> 1.500 €<br>
            <strong>2.º puesto:</strong> 750 €<br>
            <strong>3.º puesto:</strong> 300 €</p>
          `,
        },
      ],
    },
  ],
};

/**
 * Prototipo: página de detalle de evento (/eventos/{id}/{slug}).
 * Muestra la cabecera con todos los badges posibles y el contenido
 * con un segmento hero a ancho completo y un segmento a 3 columnas.
 */
@Component({
  selector: 'app-event-detail-demo',
  imports: [ContentRendererComponent],
  template: `
    <div class="ds-container">
      <div class="pt-6 pb-10">

        <!-- Cabecera -->
        <header class="flex items-start gap-16 border-b border-neutral-medium pb-4 mb-6">
          <h1 class="h1">Campeonato Nacional de Mus 2026</h1>
          <button
            type="button"
            class="ds-btn-close shrink-0 mt-1"
            aria-label="Cerrar"
          ><span class="material-symbols-outlined text-base">close</span></button>
        </header>

        <!-- Metadatos con todos los badges posibles -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">

          <!-- Fechas -->
          <div class="flex items-baseline gap-x-2">
            <span class="ds-card-label">Inicio:</span>
            <span class="ds-card-text">15/03/2026 10:00</span>
          </div>
          <div class="flex items-baseline gap-x-2">
            <span class="ds-card-label">Fin:</span>
            <span class="ds-card-text">17/03/2026 20:00</span>
          </div>

          <!-- Ubicación -->
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
            class="ds-card-link"
          >📍 Pabellón Municipal, Madrid</a>

          <!-- Badge: juego -->
          <span class="ds-badge ds-badge-game">Mus</span>

          <!-- Badge: asociación -->
          <span class="ds-badge ds-badge-association">Club Deportivo Demo</span>

          <!-- Badge: inscripción abierta -->
          <span class="ds-badge ds-badge-active">Inscripción abierta</span>

          <!-- Badge: asistencia -->
          <span class="ds-badge ds-badge-warning">Solicitud pendiente</span>
        </div>

        <!-- Botón de inscripción -->
        <div class="mb-4">
          <button type="button" class="ds-btn-sm ds-btn-primary">Solicitar inscripción</button>
        </div>

        <!-- Organizado por -->
        <div class="flex items-center gap-x-3 mb-6">
          <span class="ds-card-label">Organizado por:</span>
          <span class="ds-card-text">Club Deportivo Demo</span>
          <button type="button" class="ds-btn ds-btn-primary ds-btn-sm">Contactar</button>
        </div>

      </div>
    </div>

    <!-- Contenido enriquecido: fuera del ds-container para que fullWidthBackground funcione -->
    <app-content-renderer [content]="content()" />
  `,
  styles: [`:host { display: block; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailDemoPage {
  readonly content = signal<PageContentDTO>(MOCK_CONTENT);
}
