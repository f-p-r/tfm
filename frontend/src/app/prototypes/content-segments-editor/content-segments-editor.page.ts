import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentSegmentsEditorComponent } from '../../shared/content/segments-editor/content-segments-editor.component';
import { PageContentDTO } from '../../shared/content/page-content.dto';
import { ContentRendererComponent } from '../../shared/content/content-renderer/content-renderer.component';

@Component({
  selector: 'app-content-segments-editor-page',
  standalone: true,
  imports: [CommonModule, ContentSegmentsEditorComponent, ContentRendererComponent],
  template: `
    <main class="ds-main">
      <div class="ds-page">
        <div class="ds-container space-y-8">

          <header class="border-b border-neutral-medium pb-4 flex justify-between items-end">
            <div>
              <p class="text-xs uppercase tracking-[0.18em] text-neutral-dark/70">Prototipo</p>
              <h1 class="h1 mt-2">Editor de Contenidos (Nuevo)</h1>
              <p class="p mt-2 text-neutral-dark/80">Sistema de columnas, grid y carrusel integrado.</p>
            </div>
            <button (click)="downloadJson()" class="ds-btn ds-btn-secondary text-sm">
              Descargar JSON
            </button>
          </header>

          <section>
            <app-content-segments-editor
              [initialContent]="content()"
              [scopeType]="1"
              [scopeId]="1"
              (contentChange)="onContentChange($event)">
            </app-content-segments-editor>
          </section>

          <section class="mt-12 pt-8 border-t border-neutral-medium">
            <h2 class="h3 mb-4">Resultado Final (Visor)</h2>
            <div class="border border-neutral-medium rounded-xl overflow-hidden shadow-sm bg-white">
               <app-content-renderer [content]="content()"></app-content-renderer>
            </div>
          </section>

          <section class="mt-12 pt-8 border-t-4 border-red-500 bg-red-50 p-6 rounded-xl">
            <h2 class="h3 mb-2 text-red-800">🔍 DEBUG: Inspección de Código Fuente</h2>
            <p class="mb-6 text-sm text-red-700">
              Aquí puedes ver exactamente qué caracteres está guardando el editor.
              Busca si aparecen muchos <code>&amp;nbsp;</code> en el texto.
            </p>

            @for (seg of content().segments; track seg.id) {
              @if (seg.type === 'columns') {
                <div class="mb-8 border-b border-red-200 pb-4 last:border-0">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="ds-badge ds-badge-active">#{{ seg.order }}</span>
                    <h4 class="font-bold text-red-900">Segmento de Columnas ({{ seg.distribution }})</h4>
                  </div>

                  <div class="grid gap-4" [style.grid-template-columns]="'repeat(' + seg.columns.length + ', 1fr)'">
                    @for (col of seg.columns; track col.id; let i = $index) {
                      <div>
                        <strong class="block text-xs uppercase text-red-600 mb-1">Columna {{ i + 1 }}</strong>
                        <textarea
                          readonly
                          class="w-full h-40 p-3 border border-red-300 rounded font-mono text-xs bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                          [value]="col.contentHtml"
                        ></textarea>
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </section>
          </div>
      </div>
    </main>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentSegmentsEditorPage {

  readonly content = signal<PageContentDTO>({
    schemaVersion: 1,
    segments: []
  });

  onContentChange(newContent: PageContentDTO) {
    this.content.set(newContent);
    // console.log('Contenido actualizado:', newContent); // Opcional
  }

  downloadJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.content(), null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "page-content.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}
