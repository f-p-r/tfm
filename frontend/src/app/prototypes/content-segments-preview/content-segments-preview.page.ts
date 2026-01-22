import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentRendererComponent } from '../content-segments-demo/content-renderer.component';
import { ContentDTO } from '../content-segments-demo/content-segments.dto';

const PREVIEW_KEY = 'contentSegmentsPreview:current';

@Component({
  selector: 'app-content-segments-preview-page',
  standalone: true,
  imports: [CommonModule, ContentRendererComponent],
  template: `
    <main class="max-w-5xl mx-auto py-8 px-4">
      <header class="mb-6 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p class="text-xs uppercase tracking-widest text-gray-500">Prototipo</p>
          <h1 class="text-3xl font-semibold text-gray-900 mt-2">contentSegmentsPreview</h1>
        </div>
        <a class="px-3 py-2 rounded bg-gray-900 text-white hover:bg-black" href="/prototypes/content-segments-editor">Volver al editor</a>
      </header>

      @if (content; as c) {
        <app-content-renderer [content]="c"></app-content-renderer>
      } @else {
        <div class="text-gray-700">No hay contenido para previsualizar. Abre el editor y pulsa Ver.</div>
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentSegmentsPreviewPage {
  readonly content: ContentDTO | null;

  constructor() {
    this.content = this.load();
  }

  private load(): ContentDTO | null {
    try {
      const raw = sessionStorage.getItem(PREVIEW_KEY);
      return raw ? (JSON.parse(raw) as ContentDTO) : null;
    } catch {
      return null;
    }
  }
}
