import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal, input, output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorComponent, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';

import { PageContentDTO, SegmentDTO, ColumnsSegmentDTO, CarouselSegmentDTO } from '../page-content.dto';
import { CONTENT_EDITOR_HELP } from './content-editor.help';
import { HelpContentService } from '../../help/help-content.service';
import { HelpIComponent } from '../../help/help-i/help-i.component';
import { MediaPickerComponent } from '../../../components/media/media-picker.component';
import { MediaItem } from '../../../components/media/media.models';

@Component({
  selector: 'app-content-segments-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EditorComponent,
    HelpIComponent,
    MediaPickerComponent
  ],
  // Inyección del script local
  providers: [
    { provide: TINYMCE_SCRIPT_SRC, useValue: '/assets/tinymce/tinymce.min.js' }
  ],
  templateUrl: './content-segments-editor.component.html',
  styleUrl: './content-segments-editor.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentSegmentsEditorComponent {
  readonly initialContent = input<PageContentDTO | null>(null);
  readonly scopeType = input.required<number>();
  readonly scopeId = input<number | null>(null);

  readonly contentChange = output<PageContentDTO>();

  readonly segments = signal<SegmentDTO[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly editingDraft = signal<SegmentDTO | null>(null);

  readonly showMediaPicker = signal(false);

  private helpService = inject(HelpContentService);
  private activeEditorRef: any = null;

  // --- CONFIGURACIÓN TINYMCE DEFINITIVA ---
  readonly tinyConfig: any = {
    base_url: '/assets/tinymce',
    license_key: 'gpl',
    suffix: '.min',
    height: 300,
    menubar: false,

    // 1. AQUI ESTÁ LA CLAVE: 'quickbars'
    plugins: 'lists link image table code help wordcount quickbars',

    // Barra superior estándar
    toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | customImage | removeformat',

    // 2. CONFIGURACIÓN DE BARRA FLOTANTE DE IMAGEN
    quickbars_image_toolbar: 'alignleft aligncenter alignright alignnone | image',

    // Opcional: Desactivar la barra flotante de texto (la que sale al dar Enter) para que no moleste
    quickbars_insert_toolbar: false,

    branding: false,
    statusbar: false,

    // Configuración visual interna
    content_style: `
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; }
      img { max-width: 100%; height: auto; }
    `,

    setup: (editor: any) => {
      // Tu botón personalizado para abrir el MediaPicker
      editor.ui.registry.addButton('customImage', {
        icon: 'image',
        tooltip: 'Insertar Imagen',
        onAction: () => {
          this.activeEditorRef = editor;
          this.showMediaPicker.set(true);
        }
      });
    }
  };

  constructor() {
    effect(() => {
      const c = this.initialContent();
      if (c && c.segments) {
        this.segments.set(JSON.parse(JSON.stringify(c.segments)));
      }
    });

    this.helpService.setPack(CONTENT_EDITOR_HELP);
  }

  // ... (RESTO DEL CÓDIGO: addBlock, addCarousel, saveEdit, etc. SE MANTIENE IGUAL) ...

  addBlock(initialDist: '1' | '1-1' = '1') {
    const newSeg: ColumnsSegmentDTO = {
      id: crypto.randomUUID(),
      order: this.segments().length + 1,
      type: 'columns',
      distribution: initialDist as any,
      verticalPadding: 'normal',
      backgroundColor: 'white',
      textColor: 'default',
      containerWidth: 'standard',
      columns: Array(initialDist === '1' ? 1 : 2).fill(null).map(() => ({
        id: crypto.randomUUID(), contentHtml: ''
      }))
    };
    this.addSegment(newSeg);
  }

  addCarousel() {
    const newSeg: CarouselSegmentDTO = {
      id: crypto.randomUUID(),
      order: this.segments().length + 1,
      type: 'carousel',
      images: [],
      height: 400,
      imagesPerView: 3,
      delaySeconds: 5
    };
    this.addSegment(newSeg);
  }

  private addSegment(seg: SegmentDTO) {
    this.segments.update(list => [...list, seg]);
    this.emitChange();
    this.startEdit(seg.id);
  }

  startEdit(id: string) {
    const seg = this.segments().find(s => s.id === id);
    if (seg) {
      this.editingId.set(id);
      this.editingDraft.set(JSON.parse(JSON.stringify(seg)));
    }
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editingDraft.set(null);
    this.activeEditorRef = null;
  }

  saveEdit() {
    const draft = this.editingDraft();
    if (draft) {
      this.segments.update(list => list.map(s => s.id === draft.id ? draft : s));
      this.emitChange();
      this.cancelEdit();
    }
  }

  updateDistribution(dist: string) {
    const draft = this.editingDraft();
    if (!draft || draft.type !== 'columns') return;
    let target = dist === '1' ? 1 : (['1-1-1', '1-2-1', '2-1-1', '1-1-2'].includes(dist) ? 3 : (dist === '1-1-1-1' ? 4 : 2));
    let newCols = [...draft.columns];
    while (newCols.length < target) newCols.push({ id: crypto.randomUUID(), contentHtml: '' });
    if (newCols.length > target) newCols = newCols.slice(0, target);
    this.updateDraft({ ...draft, distribution: dist as any, columns: newCols });
  }

  updateProperty(field: keyof ColumnsSegmentDTO | keyof CarouselSegmentDTO, value: any) {
    const draft = this.editingDraft();
    if (draft) this.updateDraft({ ...draft, [field]: value });
  }

  private updateDraft(newData: SegmentDTO) {
    this.editingDraft.set(newData as any);
  }

  moveSegment(index: number, direction: -1 | 1) {
    const list = [...this.segments()];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < list.length) {
      [list[index], list[newIndex]] = [list[newIndex], list[index]];
      list.forEach((s, i) => s.order = i + 1);
      this.segments.set(list);
      this.emitChange();
    }
  }

  deleteSegment(index: number) {
    if (confirm('¿Borrar este bloque?')) {
      const list = this.segments().filter((_, i) => i !== index);
      list.forEach((s, i) => s.order = i + 1);
      this.segments.set(list);
      this.emitChange();
    }
  }

  private emitChange() {
    this.contentChange.emit({ schemaVersion: 1, segments: this.segments() });
  }

  onMediaSelected(media: MediaItem) {
    this.showMediaPicker.set(false);

    if (media.url && this.activeEditorRef) {
      const altText = (media as any).alt || (media as any).name || '';
      this.activeEditorRef.insertContent(
        `<img src="${media.url}" alt="${altText}" />`
      );
    }
    this.activeEditorRef = null;
  }
}
