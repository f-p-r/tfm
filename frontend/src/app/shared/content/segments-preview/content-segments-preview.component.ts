import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ContentRendererComponent } from '../content-renderer/content-renderer.component';
import { PageContentDTO } from '../page-content.dto';

/**
 * Componente de preview para segmentos de contenido.
 * Wrapper que usa el motor de renderizado único (ContentRendererComponent).
 * Se usa tanto en el gestor de páginas como en el editor.
 */
@Component({
  selector: 'app-content-segments-preview',
  imports: [ContentRendererComponent],
  template: `
    <app-content-renderer [content]="content()" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentSegmentsPreviewComponent {
  readonly content = input.required<PageContentDTO>();
}
