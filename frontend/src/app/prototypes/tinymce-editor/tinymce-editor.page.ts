import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { EditorComponent, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface Segment {
  id: string;
  type: 'rich' | 'carousel';
  order: number;
  content?: string;
  images?: string[];
}

@Component({
  selector: 'app-tinymce-editor',
  imports: [CommonModule, ReactiveFormsModule, EditorComponent],
  templateUrl: './tinymce-editor.page.html',
  styleUrl: './tinymce-editor.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' }
  ]
})
export class TinymceEditorPage {
  readonly segments = signal<Segment[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly editorControl = new FormControl<string>('', { nonNullable: true });

  readonly init = {
    base_url: '/tinymce',
    suffix: '.min',
    height: 400,
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | blocks | ' +
      'bold italic forecolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'table | removeformat | help',
    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif; font-size: 14px }'
  };

  readonly editingSegment = computed(() => {
    const id = this.editingId();
    return id ? this.segments().find(s => s.id === id) : null;
  });

  constructor() {
    this.editorControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(value => {
      const id = this.editingId();
      if (!id) return;
      
      this.segments.update(segments => 
        segments.map(s => s.id === id ? { ...s, content: value } : s)
      );
    });
  }

  addRichSegment(): void {
    const id = `rich-${Date.now()}`;
    const order = this.segments().length + 1;
    
    this.segments.update(segments => [
      ...segments,
      { id, type: 'rich', order, content: '<p>Nuevo contenido...</p>' }
    ]);
    
    this.startEdit(id);
  }

  addCarouselSegment(): void {
    const id = `carousel-${Date.now()}`;
    const order = this.segments().length + 1;
    
    this.segments.update(segments => [
      ...segments,
      { id, type: 'carousel', order, images: [] }
    ]);
    
    this.startEdit(id);
  }

  startEdit(id: string): void {
    const segment = this.segments().find(s => s.id === id);
    if (!segment) return;
    
    if (segment.type === 'rich') {
      this.editorControl.setValue(segment.content || '', { emitEvent: false });
    }
    
    this.editingId.set(id);
  }

  saveEdit(): void {
    this.editingId.set(null);
  }

  discardEdit(): void {
    this.editingId.set(null);
  }

  remove(id: string): void {
    this.segments.update(segments => 
      segments.filter(s => s.id !== id)
        .map((s, i) => ({ ...s, order: i + 1 }))
    );
    
    if (this.editingId() === id) {
      this.editingId.set(null);
    }
  }

  moveUp(id: string): void {
    const segments = this.segments();
    const idx = segments.findIndex(s => s.id === id);
    if (idx <= 0) return;
    
    const newSegments = [...segments];
    [newSegments[idx - 1], newSegments[idx]] = [newSegments[idx], newSegments[idx - 1]];
    
    this.segments.set(
      newSegments.map((s, i) => ({ ...s, order: i + 1 }))
    );
  }

  moveDown(id: string): void {
    const segments = this.segments();
    const idx = segments.findIndex(s => s.id === id);
    if (idx === -1 || idx >= segments.length - 1) return;
    
    const newSegments = [...segments];
    [newSegments[idx], newSegments[idx + 1]] = [newSegments[idx + 1], newSegments[idx]];
    
    this.segments.set(
      newSegments.map((s, i) => ({ ...s, order: i + 1 }))
    );
  }

  addImage(segmentId: string): void {
    const url = prompt('URL de la imagen:');
    if (!url) return;
    
    this.segments.update(segments =>
      segments.map(s => {
        if (s.id === segmentId && s.type === 'carousel') {
          return { ...s, images: [...(s.images || []), url] };
        }
        return s;
      })
    );
  }

  removeImage(segmentId: string, imageIndex: number): void {
    this.segments.update(segments =>
      segments.map(s => {
        if (s.id === segmentId && s.type === 'carousel') {
          return { 
            ...s, 
            images: s.images?.filter((_, i) => i !== imageIndex) || []
          };
        }
        return s;
      })
    );
  }
}
