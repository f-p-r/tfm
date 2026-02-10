import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentRendererComponent } from '../../shared/content/content-renderer/content-renderer.component';
import { PageContentDTO } from '../../shared/content/page-content.dto';

const IMAGE_URL = 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=1000&auto=format&fit=crop';

@Component({
  selector: 'app-content-segments-demo',
  standalone: true,
  imports: [CommonModule, ContentRendererComponent],
  template: `
    <main class="ds-main">
      <div class="ds-page">
        <div class="ds-container space-y-8">

          <header class="border-b border-neutral-medium pb-4">
            <p class="text-xs uppercase tracking-[0.18em] text-neutral-dark/70">Prototipo</p>
            <h1 class="h1 mt-2">Demo de Visualización</h1>
            <p class="p mt-2 text-neutral-dark/80">
              Así es como se ve el contenido final renderizado por <code>app-content-renderer</code>.
            </p>
          </header>

          <section class="border border-neutral-medium rounded-xl overflow-hidden shadow-sm bg-white">
            <app-content-renderer [content]="content()"></app-content-renderer>
          </section>

          <section class="mt-8 pt-8 border-t border-neutral-medium">
            <h2 class="h3 mb-4 text-sm text-neutral-500">Datos simulados (PageContentDTO)</h2>
            <pre class="p-4 bg-neutral-light rounded-lg text-xs overflow-auto font-mono border border-neutral-medium">{{ content() | json }}</pre>
          </section>

        </div>
      </div>
    </main>
  `,
  styles: []
})
export class ContentSegmentsDemoPage { // <--- CORREGIDO: Antes ponía ContentSegmentsEditorPage

  content = signal<PageContentDTO>({
    schemaVersion: 1,
    segments: [
      // 1. Texto simple (1 Columna)
      {
        id: '1',
        order: 1,
        type: 'columns',
        distribution: '1',
        verticalPadding: 'normal',
        backgroundColor: 'white',
        containerWidth: 'standard',
        columns: [
          {
            id: 'c1',
            contentHtml: '<h2 class="h2">Bienvenido a la nueva Demo</h2><p>Este bloque es un texto de ancho completo (distribución "1") renderizado con el nuevo sistema.</p>'
          }
        ]
      },
      // 2. Carrusel
      {
        id: '2',
        order: 2,
        type: 'carousel',
        height: 400,
        imagesPerView: 3,
        delaySeconds: 5,
        images: [
          { mediaId: 1, url: IMAGE_URL, alt: 'Paisaje 1' },
          { mediaId: 2, url: IMAGE_URL, alt: 'Paisaje 2' },
          { mediaId: 3, url: IMAGE_URL, alt: 'Paisaje 3' }
        ]
      },
      // 3. Columnas 50/50 con fondo
      {
        id: '3',
        order: 3,
        type: 'columns',
        distribution: '1-1',
        backgroundColor: 'neutral',
        verticalPadding: 'large',
        containerWidth: 'standard',
        columns: [
          {
            id: 'c2',
            contentHtml: '<h3 class="h3">Columna Izquierda</h3><p>Esta sección tiene fondo gris (<code>neutral</code>) y padding amplio.</p>'
          },
          {
            id: 'c3',
            contentHtml: '<img src="' + IMAGE_URL + '" style="float:right; width: 100%; border-radius: 8px;">'
          }
        ]
      }
    ]
  });
}
