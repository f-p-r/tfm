import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { QuillModule, QuillEditorComponent } from 'ngx-quill';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Quill from 'quill';
import { ContentDTO, SegmentDTO, RichSegmentDTO, CarouselSegmentDTO } from '../../shared/content/content-segments.dto';
import { ContentRendererComponent } from '../../shared/content/content-renderer.component';
import { quillModules } from '../quill.config';
import { MediaPickerComponent } from '../../components/media/media-picker.component';
import { MediaItem } from '../../components/media/media.models';
import { WebScope } from '../../core/web-scope.constants';
import { InternalLinkBlot } from '../../shared/content/internal-link.blot';
import { LinkSelectorComponent, type InternalLinkDestination } from '../../shared/content/link-selector.component';

// Constantes de configuración
const PREVIEW_KEY = 'contentSegmentsPreview:current';
const DEFAULT_CAROUSEL_HEIGHT = 300; // Altura por defecto del carrusel en px

// Registrar el custom blot ANTES de que se inicialice el componente
Quill.register(InternalLinkBlot);

@Component({
  selector: 'app-content-segments-editor-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule, ContentRendererComponent, MediaPickerComponent, LinkSelectorComponent],
  template: `
    <main class="ds-main">
      <div class="ds-page">
        <div class="ds-container space-y-6">
          <header class="border-b border-neutral-medium pb-4">
            <p class="text-xs uppercase tracking-[0.18em] text-neutral-dark/70">Prototipo</p>
            <h1 class="h1 mt-2">contentSegmentsEditor</h1>
            <p class="p mt-2 text-neutral-dark/80">Editor mínimo de segmentos (en memoria) con preview.</p>
          </header>

          <section>
            <div class="flex flex-wrap items-center gap-3">
              <button type="button" (click)="addRich()" class="ds-btn ds-btn-primary">Añadir segmento texto/imagen</button>
              <button type="button" (click)="addCarousel()" class="ds-btn ds-btn-primary">Añadir carrusel</button>
              <button type="button" (click)="openPreview()" class="ds-btn ds-btn-secondary">Ver</button>
            </div>
          </section>

          <section class="grid gap-4">
            @for (seg of segments(); track seg.id) {
              <article class="border border-neutral-medium rounded-lg p-4 bg-white shadow-sm">
                <div class="flex flex-wrap items-center gap-2 justify-between">
                  <div class="font-display font-semibold text-brand-primary">#{{ seg.order }} · @if (seg.type === 'rich') { Texto/Imagen } @else if (seg.type === 'carousel') { Carrusel }</div>
                  @if (editingId() === seg.id) {
                    <div class="flex flex-wrap items-center gap-2">
                      <button type="button" class="ds-btn ds-btn-primary" (click)="saveEdit()">Guardar</button>
                      <button type="button" class="ds-btn ds-btn-secondary" (click)="discardEdit()">Descartar</button>
                    </div>
                  } @else {
                    <div class="flex flex-wrap items-center gap-2">
                      <button type="button" class="ds-btn ds-btn-secondary" (click)="moveUp(seg.id)">↑</button>
                      <button type="button" class="ds-btn ds-btn-secondary" (click)="moveDown(seg.id)">↓</button>
                      <button type="button" class="ds-btn ds-btn-secondary" (click)="startEdit(seg.id)">Editar</button>
                      <button type="button" class="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition" (click)="remove(seg.id)">Eliminar</button>
                    </div>
                  }
                </div>

                @if (editingId() === seg.id) {
                  @if (editingDraft(); as draft) {
                    <div class="mt-4 border-t border-neutral-medium pt-4 grid gap-4">
                      @if (draft.type === 'rich') {
                        <div class="grid md:grid-cols-2 gap-4">
                          <div class="ds-field">
                            <label class="ds-label">Posicionamiento</label>
                            <select class="ds-select" [value]="draft.imagePlacement ?? 'top'" (change)="onRichPlacementChange(draft.id, $event)">
                              <option value="top">Arriba</option>
                              <option value="left">Izquierda</option>
                              <option value="right">Derecha</option>
                            </select>
                          </div>
                          <div class="ds-field">
                            <label class="ds-label">Ancho (%)</label>
                            <select class="ds-select" [value]="draft.imageWidth ?? 50" (change)="onRichWidthChange(draft.id, $event)">
                              <option [value]="10">10</option>
                              <option [value]="25">25</option>
                              <option [value]="33">33</option>
                              <option [value]="50">50</option>
                              <option [value]="66">66</option>
                              <option [value]="75">75</option>
                              <option [value]="100">100</option>
                            </select>
                          </div>
                          <div class="grid gap-2 md:col-span-2">
                            @if (draft.image; as image) {
                              <div class="border border-neutral-medium rounded-lg p-3 bg-neutral-light flex flex-col items-center gap-2 cursor-pointer hover:bg-white transition" (click)="toggleRichPicker()">
                                <img [src]="image.url" alt="" class="w-32 h-28 object-cover rounded" />
                                <div class="text-xs text-neutral-dark text-center truncate max-w-xs">{{ fileName(image.url) }}</div>
                              </div>
                            } @else {
                              <button
                                type="button"
                                class="ds-btn ds-btn-secondary w-fit"
                                (click)="toggleRichPicker()"
                              >
                                Añadir imagen
                              </button>
                            }

                            @if (richPickerOpen()) {
                              <app-media-picker
                                [scopeType]="WebScope.ASSOCIATION"
                                [scopeId]="1"
                                [includeGlobal]="true"
                                [mode]="'single'"
                                (pick)="onRichMediaPicked($event); toggleRichPicker()"
                                (uploadSuccess)="onRichMediaPicked($event); toggleRichPicker()"
                                (error)="onMediaPickerError($event)"
                                (close)="toggleRichPicker()"
                              ></app-media-picker>
                            }

                            @if (draft.image) {
                              <button
                                type="button"
                                class="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition"
                                (click)="removeImage()"
                              >Quitar imagen</button>
                            }

                            @if (pickerError()) {
                              <div class="text-sm text-red-600">{{ pickerError() }}</div>
                            }
                          </div>
                        </div>
                        <div class="grid gap-1">
                          <span class="text-sm text-neutral-dark font-semibold">Texto</span>
                          <div class="quill-shell">
                            <quill-editor
                              #editor
                              class="quill-editor-block"
                              [modules]="modules"
                              [formControl]="quillControl"
                              theme="snow"
                            ></quill-editor>
                          </div>
                        </div>
                      }

                      @if (draft.type === 'carousel') {
                        <div class="grid md:grid-cols-3 gap-4">
                          <div class="ds-field">
                            <label class="ds-label">Altura (px)</label>
                            <input class="ds-input" type="number" min="1" [value]="draft.height" (input)="onCarouselHeightChange(draft.id, $event)" />
                          </div>
                          <div class="ds-field">
                            <label class="ds-label">Imágenes visibles</label>
                            <select class="ds-select" [value]="draft.imagesPerView" (change)="onCarouselImagesPerViewChange(draft.id, $event)">
                              <option [value]="1">1</option>
                              <option [value]="2">2</option>
                              <option [value]="3">3</option>
                              <option [value]="4">4</option>
                              <option [value]="5">5</option>
                              <option [value]="6">6</option>
                            </select>
                          </div>
                          <div class="ds-field">
                            <label class="ds-label">Retardo (s)</label>
                            <input class="ds-input" type="number" min="0" placeholder="0 desactiva el autoavance" (input)="onCarouselDelayChange(draft.id, $event)" />
                          </div>
                        </div>

                        <div class="border border-neutral-medium rounded-lg p-3 bg-neutral-light space-y-3">
                          <button
                            type="button"
                            class="ds-btn ds-btn-secondary w-fit"
                            (click)="toggleCarouselPicker()"
                          >
                            Añadir imagen
                          </button>

                          @if (carouselPickerOpen()) {
                            <app-media-picker
                              [scopeType]="WebScope.ASSOCIATION"
                              [scopeId]="1"
                              [includeGlobal]="true"
                              [mode]="'multi'"
                              [infoMessage]="pickerInfo()"
                              (pick)="onCarouselMediaPicked($event)"
                              (uploadSuccess)="onCarouselMediaPicked($event)"
                              (error)="onMediaPickerError($event)"
                              (close)="toggleCarouselPicker()"
                            ></app-media-picker>
                          }

                          @if (draft.images.length) {
                            <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
                              @for (img of draft.images; track $index) {
                                <div class="border border-neutral-medium rounded-lg overflow-hidden bg-white flex flex-col">
                                  <img [src]="img.url" alt="" class="w-full h-28 object-cover" />
                                  <div class="flex items-center justify-between gap-2 px-2 py-1.5 text-xs text-neutral-dark">
                                    <span class="truncate">{{ fileName(img.url) }}</span>
                                    <button type="button" class="text-red-700 hover:text-red-500" (click)="removeCarouselImage($index)">Eliminar</button>
                                  </div>
                                </div>
                              }
                            </div>
                          } @else {
                            <div class="text-sm text-neutral-dark">El carrusel no tiene imagenes.</div>
                          }

                          @if (pickerError()) {
                            <div class="text-sm text-red-600">{{ pickerError() }}</div>
                          }
                        </div>
                      }
                    </div>
                  }
                }

                @if (editingId() !== seg.id) {
                  <div class="mt-4 border-t border-neutral-medium pt-4">
                    <app-content-renderer [content]="singleContent(seg)"></app-content-renderer>
                  </div>
                }
              </article>
            }
          </section>

          <!-- Selector de enlaces internos -->
          @if (showLinkSelector()) {
            <app-link-selector
              (select)="onLinkSelected($event)"
              (cancel)="onLinkCanceled()"
            ></app-link-selector>
          }
        </div>
      </div>
    </main>
  `,
  styleUrls: ['./content-segments-editor.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, // necesario para que los estilos de Quill apliquen a la toolbar e iconos
})
export class ContentSegmentsEditorPage {
  readonly WebScope = WebScope;
  readonly quillEditor = viewChild<QuillEditorComponent>('editor');

  // Configuración dinámica con handler para enlaces internos
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

  readonly quillControl = new FormControl<string>('', { nonNullable: true });
  readonly richPickerOpen = signal(false);
  readonly carouselPickerOpen = signal(false);
  readonly pickerError = signal<string | null>(null);
  readonly pickerInfo = signal<string | null>(null);
  readonly showLinkSelector = signal(false);
  private savedSelection: any = null;
  // Estado principal de contenido en memoria
  readonly content = signal<ContentDTO>({
    schemaVersion: 1,
    segments: [],
  });

  // UI: id del segmento en edición
  readonly editingId = signal<string | null>(null);
  readonly editingDraft = signal<SegmentDTO | null>(null);

  constructor() {
    this.quillControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      const draft = this.editingDraft();
      if (!draft || draft.type !== 'rich') return;
      this.editingDraft.set({ ...draft, textHtml: value });
    });
  }

  // Helpers de lectura
  segments(): SegmentDTO[] {
    return [...(this.content().segments)].sort((a, b) => a.order - b.order);
  }

  // Acciones de lista
  moveUp(id: string): void {
    const c = this.content();
    const idx = c.segments.findIndex(s => s.id === id);
    if (idx <= 0) return;
    const arr = [...c.segments];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    this.renormalizeAndSet(arr);
  }

  moveDown(id: string): void {
    const c = this.content();
    const idx = c.segments.findIndex(s => s.id === id);
    if (idx === -1 || idx >= c.segments.length - 1) return;
    const arr = [...c.segments];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    this.renormalizeAndSet(arr);
  }

  remove(id: string): void {
    const c = this.content();
    const arr = c.segments.filter(s => s.id !== id);
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
    const seg = this.content().segments.find(s => s.id === id);
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
    const c = this.content();
    const arr = c.segments.map(s => (s.id === id ? { ...draft } : s));
    this.content.set({ ...c, segments: arr });
    this.richPickerOpen.set(false);
    this.carouselPickerOpen.set(false);
    this.pickerError.set(null);
    this.editingId.set(null);
    this.editingDraft.set(null);
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
    const c = this.content();
    const id = this.newId('rich');
    const order = c.segments.length + 1;
    const seg: RichSegmentDTO = {
      id,
      order,
      type: 'rich',
      textHtml: '',
      imagePlacement: 'top',
      imageWidth: 50,
      // sin imagen por defecto
    };
    this.content.set({ ...c, segments: [...c.segments, seg] });
    this.startEdit(id);
  }

  addCarousel(): void {
    const c = this.content();
    const id = this.newId('carousel');
    const order = c.segments.length + 1;
    const seg: CarouselSegmentDTO = {
      id,
      order,
      type: 'carousel',
      images: [],
      height: DEFAULT_CAROUSEL_HEIGHT,
      imagesPerView: 3,
      delaySeconds: 0
    };
    this.content.set({ ...c, segments: [...c.segments, seg] });
    this.startEdit(id);
  }

  // Edición RICH
  onRichChange(id: string, patch: Partial<RichSegmentDTO>): void {
    const currentDraft = this.editingDraft();
    if (!currentDraft || currentDraft.id !== id || currentDraft.type !== 'rich') return;
    this.editingDraft.set({ ...currentDraft, ...patch });
  }

  onRichPlacementChange(id: string, ev: Event): void {
    const value = (ev.target as HTMLSelectElement | null)?.value as 'top' | 'left' | 'right' | undefined;
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

  // Preview
  openPreview(): void {
    try {
      sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(this.content()));
    } catch {
      // ignorar
    }
    window.open('/prototypes/content-segments-preview', '_blank');
  }

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

  // Métodos para enlaces internos
  openLinkSelector(): void {
    const editor = this.quillEditor()?.quillEditor;
    if (!editor) return;

    // Guardar la selección actual
    this.savedSelection = editor.getSelection();
    this.showLinkSelector.set(true);
  }

  onLinkSelected(destination: InternalLinkDestination): void {
    const editor = this.quillEditor()?.quillEditor;
    if (!editor || !this.savedSelection) {
      this.showLinkSelector.set(false);
      return;
    }

    // Restaurar la selección
    editor.setSelection(this.savedSelection.index, this.savedSelection.length);

    const range = this.savedSelection;

    if (range.length > 0) {
      // Hay texto seleccionado: convertirlo en enlace
      editor.formatText(range.index, range.length, 'internal-link', destination);
    } else {
      // No hay selección: insertar el label como enlace
      editor.insertText(range.index, destination.label);
      editor.formatText(range.index, destination.label.length, 'internal-link', destination);
      editor.setSelection(range.index + destination.label.length, 0);
    }

    // Forzar actualización del HTML
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

  fileName(url: string): string {
    if (!url) return '';
    try {
      const parts = url.split('?')[0].split('/');
      return parts[parts.length - 1] || url;
    } catch {
      return url;
    }
  }

  // Utilidades
  private renormalizeAndSet(arr: SegmentDTO[]): void {
    const c = this.content();
    const normalized = arr.map((s, i) => ({ ...s, order: i + 1 } as SegmentDTO));
    this.content.set({ ...c, segments: normalized });
  }

  private newId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }

  private cloneSeg<T extends SegmentDTO>(seg: T): T {
    return JSON.parse(JSON.stringify(seg)) as T;
  }

  singleContent(seg: SegmentDTO): ContentDTO {
    return {
      schemaVersion: 1,
      segments: [seg],
    };
  }
}
