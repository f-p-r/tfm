import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentSegmentsEditorComponent } from '../../shared/content/segments-editor/content-segments-editor.component';
import { PageContentDTO } from '../../shared/content/page-content.dto';
import { ContentRendererComponent } from '../../shared/content/content-renderer/content-renderer.component';

@Component({
  selector: 'app-content-segments-editor-page',
  standalone: true,
  imports: [CommonModule, ContentSegmentsEditorComponent, ContentRendererComponent],
  // CAMBIO CLAVE: Usamos templateUrl para leer tu archivo HTML externo
  templateUrl: './content-segments-editor.page.html',
  // Si tienes estilos, úsalos, si no, puedes dejarlo vacío o borrarlo
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentSegmentsEditorPage {
  // ... resto de tu código igual ...
  readonly content = signal<PageContentDTO>({
    schemaVersion: 1,
    segments: []
  });

  onContentChange(newContent: PageContentDTO) {
    this.content.set(newContent);
  }

  downloadJson() {
    // ... tu lógica de descarga ...
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.content(), null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "page-content.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}
