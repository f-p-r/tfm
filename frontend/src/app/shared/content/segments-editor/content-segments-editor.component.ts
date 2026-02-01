import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  signal,
  input,
  output,
  effect,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { QuillModule, QuillEditorComponent } from 'ngx-quill';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Quill from 'quill';
import { PageContentDTO, SegmentDTO, RichSegmentDTO, CarouselSegmentDTO } from '../page-content.dto';
import { ContentRendererComponent } from '../content-renderer.component';
import { MediaPickerComponent } from '../../../components/media/media-picker.component';
import { MediaItem } from '../../../components/media/media.models';
import { WebScope } from '../../../core/web-scope.constants';
import { InternalLinkBlot } from '../internal-link.blot';
import { LinkSelectorComponent, type InternalLinkDestination } from '../link-selector.component';

// Registrar el custom blot
Quill.register(InternalLinkBlot);

const DEFAULT_CAROUSEL_HEIGHT = 300;

@Component({
  selector: 'app-content-segments-editor',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    QuillModule,
    ContentRendererComponent,
    MediaPickerComponent,
    LinkSelectorComponent,
  ],
  templateUrl: './content-segments-editor.component.html',
  styleUrl: './content-segments-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ContentSegmentsEditorComponent {
  readonly WebScope = WebScope;
  readonly quillEditor = viewChild<QuillEditorComponent>('editor');

  // Input/output
  readonly content = input.required<PageContentDTO>();
  readonly contentChange = output<PageContentDTO>();
  readonly scopeType = input<number>(WebScope.ASSOCIATION); // Default: ASSOCIATION
  readonly scopeId = input<number>(1); // Default: 1

  // Configuración de Quill con handler para enlaces internos
  readonly modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['blockquote'],
        ['link'],
        ['internal-link'],
        ['clean'],
      ],
      handlers: {
        'internal-link': () => {
          this.openLinkSelector();
        },
      },
    },
  };

  // Estado interno
  readonly internalContent = signal<PageContentDTO>({
    schemaVersion: 1,
    segments: [],
  });
  readonly quillControl = new FormControl<string>('', { nonNullable: true });
  readonly editingId = signal<string | null>(null);
  readonly editingDraft = signal<SegmentDTO | null>(null);
  readonly richPickerOpen = signal(false);
  readonly carouselPickerOpen = signal(false);
  readonly pickerError = signal<string | null>(null);
  readonly pickerInfo = signal<string | null>(null);
  readonly showLinkSelector = signal(false);
  private savedSelection: any = null;

  constructor() {
    // Sincronizar input con estado interno
    effect(() => {
      const inputContent = this.content();
      this.internalContent.set(JSON.parse(JSON.stringify(inputContent)));
    });

    // Sincronizar cambios de Quill con el draft
    this.quillControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      const draft = this.editingDraft();
      if (!draft || draft.type !== 'rich') return;
      this.editingDraft.set({ ...draft, textHtml: value });
    });
  }

  // Helpers
  segments(): SegmentDTO[] {
    return [...this.internalContent().segments].sort((a, b) => a.order - b.order);
  }

  private emitChange(): void {
    this.contentChange.emit(this.internalContent());
  }

  private renormalizeAndSet(arr: SegmentDTO[]): void {
    const c = this.internalContent();
    const normalized = arr.map((s, i) => ({ ...s, order: i + 1 } as SegmentDTO));
    this.internalContent.set({ ...c, segments: normalized });
    this.emitChange();
  }

  private newId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }

  private cloneSeg<T extends SegmentDTO>(seg: T): T {
    return JSON.parse(JSON.stringify(seg)) as T;
  }

  singleContent(seg: SegmentDTO): PageContentDTO {
    return {
      schemaVersion: 1,
      segments: [seg],
    };
  }

  fileName(url: string): string {
    if (!url) return '';
    try {
      const parts = url.split('?')[0].split('/');
      return parts[parts.length - 1] || url;
    } catch {
      return url;
    }
  }

  // Acciones de lista
  moveUp(id: string): void {
    const c = this.internalContent();
    const idx = c.segments.findIndex((s) => s.id === id);
    if (idx <= 0) return;
    const arr = [...c.segments];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    this.renormalizeAndSet(arr);
  }

  moveDown(id: string): void {
    const c = this.internalContent();
    const idx = c.segments.findIndex((s) => s.id === id);
    if (idx === -1 || idx >= c.segments.length - 1) return;
    const arr = [...c.segments];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    this.renormalizeAndSet(arr);
  }

  remove(id: string): void {
    const c = this.internalContent();
    const arr = c.segments.filter((s) => s.id !== id);
    this.renormalizeAndSet(arr);
    if (this.editingId() === id) {
      this.editingId.set(null);
      this.editingDraft.set(null);
      this.richPickerOpen.set(false);
      this.carouselPickerOpen.set(false);
      this.pickerError.set(null);
    }
  }

  startEdit(id: string): void {
    const seg = this.internalContent().segments.find((s) => s.id === id);
    if (!seg) return;
    this.pickerError.set(null);
    this.richPickerOpen.set(false);
    this.carouselPickerOpen.set(false);
    if (seg.type === 'rich') {
      this.quillControl.setValue(seg.textHtml ?? '', { emitEvent: false });
    } else {
      this.quillControl.setValue('', { emitEvent: false });
    }
    this.editingId.set(id);
    this.editingDraft.set(this.cloneSeg(seg));
  }

  saveEdit(): void {
    const id = this.editingId();
    const draft = this.editingDraft();
    if (!id || !draft) return;
    const c = this.internalContent();
    const arr = c.segments.map((s) => (s.id === id ? { ...draft } : s));
    this.internalContent.set({ ...c, segments: arr });
    this.richPickerOpen.set(false);
    this.carouselPickerOpen.set(false);
    this.pickerError.set(null);
    this.editingId.set(null);
    this.editingDraft.set(null);
    this.emitChange();
  }

  discardEdit(): void {
    this.quillControl.setValue('', { emitEvent: false });
    this.richPickerOpen.set(false);
    this.carouselPickerOpen.set(false);
    this.pickerError.set(null);
    this.editingId.set(null);
    this.editingDraft.set(null);
  }

  // Añadir segmentos
  addRich(): void {
    const c = this.internalContent();
    const id = this.newId('rich');
    const order = c.segments.length + 1;
    const seg: RichSegmentDTO = {
      id,
      order,
      type: 'rich',
      textHtml: '',
      imagePlacement: 'top',
      imageWidth: 50,
    };
    this.internalContent.set({ ...c, segments: [...c.segments, seg] });
    this.emitChange();
    this.startEdit(id);
  }

  addCarousel(): void {
    const c = this.internalContent();
    const id = this.newId('carousel');
    const order = c.segments.length + 1;
    const seg: CarouselSegmentDTO = {
      id,
      order,
      type: 'carousel',
      images: [],
      height: DEFAULT_CAROUSEL_HEIGHT,
      imagesPerView: 3,
      delaySeconds: 0,
    };
    this.internalContent.set({ ...c, segments: [...c.segments, seg] });
    this.emitChange();
    this.startEdit(id);
  }

  // Edición RICH
  onRichChange(id: string, patch: Partial<RichSegmentDTO>): void {
    const currentDraft = this.editingDraft();
    if (!currentDraft || currentDraft.id !== id || currentDraft.type !== 'rich') return;
    this.editingDraft.set({ ...currentDraft, ...patch });
  }

  onRichPlacementChange(id: string, ev: Event): void {
    const value = (ev.target as HTMLSelectElement | null)?.value as
      | 'top'
      | 'left'
      | 'right'
      | undefined;
    this.onRichChange(id, { imagePlacement: value ?? 'top' });
  }

  onRichWidthChange(id: string, ev: Event): void {
    const raw = (ev.target as HTMLSelectElement | null)?.value ?? '';
    const n = Number(raw);
    this.onRichChange(id, { imageWidth: isNaN(n) ? 50 : n });
  }

  // Edición CAROUSEL
  onCarouselHeightChange(id: string, ev: Event): void {
    const raw = (ev.target as HTMLInputElement | null)?.value ?? '';
    const n = Number(raw);
    if (!isNaN(n) && n > 0) {
      this.onCarouselChange(id, { height: n });
    }
  }

  onCarouselImagesPerViewChange(id: string, ev: Event): void {
    const raw = (ev.target as HTMLSelectElement | null)?.value ?? '';
    const n = Number(raw);
    if (!isNaN(n) && n >= 1 && n <= 6) {
      this.onCarouselChange(id, { imagesPerView: n });
    }
  }

  onCarouselDelayChange(id: string, ev: Event): void {
    const raw = (ev.target as HTMLInputElement | null)?.value ?? '0';
    const n = Number(raw);
    if (!isNaN(n) && n >= 0) {
      this.onCarouselChange(id, { delaySeconds: n });
    }
  }

  onCarouselChange(id: string, patch: Partial<CarouselSegmentDTO>): void {
    const currentDraft = this.editingDraft();
    if (!currentDraft || currentDraft.id !== id || currentDraft.type !== 'carousel') return;
    this.editingDraft.set({ ...currentDraft, ...patch });
  }

  // Media picker
  toggleRichPicker(): void {
    this.pickerError.set(null);
    this.pickerInfo.set(null);
    this.richPickerOpen.set(!this.richPickerOpen());
    this.carouselPickerOpen.set(false);
  }

  toggleCarouselPicker(): void {
    this.pickerError.set(null);
    this.pickerInfo.set(null);
    this.carouselPickerOpen.set(!this.carouselPickerOpen());
    this.richPickerOpen.set(false);
  }

  onMediaPickerError(message: string): void {
    this.pickerError.set(message);
    this.pickerInfo.set(null);
  }

  onRichMediaPicked(item: MediaItem): void {
    const draft = this.currentRichDraft();
    if (!draft) return;
    const image = { mediaId: item.id, url: item.url, alt: draft.image?.alt ?? '' };
    this.editingDraft.set({ ...draft, image });
    this.richPickerOpen.set(false);
    this.pickerError.set(null);
    this.pickerInfo.set(null);
  }

  onCarouselMediaPicked(item: MediaItem): void {
    const draft = this.currentCarouselDraft();
    if (!draft) return;
    const images = [...draft.images, { url: item.url, mediaId: item.id }];
    this.editingDraft.set({ ...draft, images });
    this.pickerError.set(null);
    this.pickerInfo.set(`Imagen ${this.fileName(item.url)} añadida`);
  }

  removeImage(): void {
    const draft = this.currentRichDraft();
    if (!draft) return;
    this.editingDraft.set({ ...draft, image: undefined });
    this.richPickerOpen.set(false);
  }

  removeCarouselImage(index: number): void {
    const draft = this.currentCarouselDraft();
    if (!draft) return;
    const images = draft.images.filter((_, i) => i !== index);
    this.editingDraft.set({ ...draft, images });
  }

  // Enlaces internos
  openLinkSelector(): void {
    const editor = this.quillEditor()?.quillEditor;
    if (!editor) return;
    this.savedSelection = editor.getSelection();
    this.showLinkSelector.set(true);
  }

  onLinkSelected(destination: InternalLinkDestination): void {
    const editor = this.quillEditor()?.quillEditor;
    if (!editor || !this.savedSelection) {
      this.showLinkSelector.set(false);
      return;
    }

    editor.setSelection(this.savedSelection.index, this.savedSelection.length);
    const range = this.savedSelection;

    if (range.length > 0) {
      editor.formatText(range.index, range.length, 'internal-link', destination);
    } else {
      editor.insertText(range.index, destination.label);
      editor.formatText(range.index, destination.label.length, 'internal-link', destination);
      editor.setSelection(range.index + destination.label.length, 0);
    }

    setTimeout(() => {
      const htmlContent = editor.root.innerHTML;
      this.quillControl.setValue(htmlContent);
    }, 0);

    this.showLinkSelector.set(false);
    this.savedSelection = null;
  }

  onLinkCanceled(): void {
    this.showLinkSelector.set(false);
    this.savedSelection = null;
  }

  private currentRichDraft(): RichSegmentDTO | null {
    const draft = this.editingDraft();
    return draft && draft.type === 'rich' ? draft : null;
  }

  private currentCarouselDraft(): CarouselSegmentDTO | null {
    const draft = this.editingDraft();
    return draft && draft.type === 'carousel' ? draft : null;
  }
}
