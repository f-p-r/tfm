import { Component, OnInit, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PageContentDTO } from '../../../../shared/content/page-content.dto';
import { ContentSegmentsPreviewComponent } from '../../../../shared/content/segments-preview/content-segments-preview.component';

interface PreviewData {
  title: string;
  content: PageContentDTO;
}

@Component({
  selector: 'app-page-preview',
  imports: [ContentSegmentsPreviewComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './page-preview.page.html',
  styleUrl: './page-preview.page.css',
})
export class PagePreviewPage implements OnInit {
  readonly title = signal<string>('Vista previa');
  readonly content = signal<PageContentDTO | null>(null);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    try {
      const dataStr = sessionStorage.getItem('admin:pagePreview');
      if (!dataStr) {
        this.errorMessage.set('No hay datos de vista previa disponibles');
        return;
      }

      const data: PreviewData = JSON.parse(dataStr);
      this.title.set(data.title || 'Vista previa');
      this.content.set(data.content);
    } catch (error) {
      console.error('Error al cargar vista previa:', error);
      this.errorMessage.set('Error al cargar la vista previa');
    }
  }
}
