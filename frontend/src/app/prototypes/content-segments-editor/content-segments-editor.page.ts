import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContentDTO, SegmentDTO, RichSegmentDTO, CarouselSegmentDTO } from '../content-segments-demo/content-segments.dto';
import { ContentRendererComponent } from '../content-segments-demo/content-renderer.component';
import { quillModules } from '../quill.config';
import { MediaApiService, MediaItem } from '../shared/media-api.service';
import { HttpClientModule } from '@angular/common/http';

// URL fija para imágenes del prototipo
const IMAGE_URL = 'https://lawebdeperez.es/frameworks_a3/img/landing1.jpg';
const PREVIEW_KEY = 'contentSegmentsPreview:current';

@Component({
  selector: 'app-content-segments-editor-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule, HttpClientModule, ContentRendererComponent],
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
              <button type="button" (click)="addRich()" class="px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-accent transition">Añadir segmento texto/imagen</button>
              <button type="button" (click)="addCarousel()" class="px-4 py-2 rounded-lg border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition">Añadir carrusel</button>
              <button type="button" (click)="openPreview()" class="px-4 py-2 rounded-lg bg-neutral-dark text-white hover:bg-brand-primary transition">Ver</button>
            </div>
          </section>

          <section class="grid gap-4">
            @for (seg of segments(); track seg.id) {
              <article class="border border-neutral-medium rounded-lg p-4 bg-white shadow-sm">
                <div class="flex flex-wrap items-center gap-2 justify-between">
                  <div class="font-display font-semibold text-brand-primary">#{{ seg.order }} · {{ seg.type }}</div>
                  @if (editingId() === seg.id) {
                    <div class="flex flex-wrap items-center gap-2">
                      <button type="button" class="px-3 py-1.5 rounded-lg bg-brand-primary text-white hover:bg-brand-accent transition" (click)="saveEdit()">Guardar</button>
                      <button type="button" class="px-3 py-1.5 rounded-lg border border-neutral-medium text-neutral-dark hover:bg-neutral-light transition" (click)="discardEdit()">Descartar</button>
                    </div>
                  } @else {
                    <div class="flex flex-wrap items-center gap-2">
                      <button type="button" class="px-3 py-1.5 rounded-lg border border-neutral-medium hover:bg-neutral-light transition" (click)="moveUp(seg.id)">↑</button>
                      <button type="button" class="px-3 py-1.5 rounded-lg border border-neutral-medium hover:bg-neutral-light transition" (click)="moveDown(seg.id)">↓</button>
                      <button type="button" class="px-3 py-1.5 rounded-lg border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition" (click)="startEdit(seg.id)">Editar</button>
                      <button type="button" class="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition" (click)="remove(seg.id)">Eliminar</button>
                    </div>
                  }
                </div>

                @if (editingId() === seg.id) {
                  @if (editingDraft(); as draft) {
                    <div class="mt-4 border-t border-neutral-medium pt-4 grid gap-4">
                      @if (draft.type === 'rich') {
                        <!-- Edición de RICH -->
                        <div class="grid md:grid-cols-2 gap-4">
                          <label class="grid gap-1">
                            <span class="text-sm text-neutral-dark font-semibold">Placement</span>
                            <select class="border border-neutral-medium rounded px-3 py-2 focus:ring-2 focus:ring-brand-primary" [value]="draft.imagePlacement ?? 'top'" (change)="onRichPlacementChange(draft.id, $event)">
                              <option value="top">top</option>
                              <option value="left">left</option>
                              <option value="right">right</option>
                            </select>
                          </label>
                          <label class="grid gap-1">
                            <span class="text-sm text-neutral-dark font-semibold">widthPreset</span>
                            <select class="border border-neutral-medium rounded px-3 py-2 focus:ring-2 focus:ring-brand-primary" [value]="draft.imageWidth ?? 50" (change)="onRichWidthChange(draft.id, $event)">
                              <option [value]="25">25</option>
                              <option [value]="33">33</option>
                              <option [value]="50">50</option>
                              <option [value]="66">66</option>
                              <option [value]="75">75</option>
                              <option [value]="100">100</option>
                            </select>
                          </label>
                          <div class="grid gap-2">
                            <button
                              type="button"
                              class="px-3 py-2 rounded-lg border border-neutral-medium bg-neutral-light hover:bg-white text-left transition"
                              (click)="toggleImageSelector()"
                            >
                              {{ draft.imageUrl ? fileName(draft.imageUrl) : 'Añadir imagen' }}
                            </button>

                            @if (imageSelectorOpen()) {
                              <div class="border border-neutral-medium rounded-lg p-3 bg-neutral-light space-y-3">
                                <div class="flex flex-wrap items-center justify-between gap-2">
                                  <div class="text-sm font-semibold text-neutral-dark">Seleccionar imagen</div>
                                  <button type="button" class="px-3 py-1.5 rounded-lg border border-neutral-medium text-neutral-dark opacity-60" disabled>Subir imagen</button>
                                </div>

                                @if (mediaLoading()) {
                                  <div class="text-sm text-neutral-dark">Cargando imágenes…</div>
                                } @else if (mediaError()) {
                                  <div class="text-sm text-red-600">No se pudieron cargar imágenes.</div>
                                } @else {
                                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    @for (item of mediaItems(); track item.id) {
                                      <button
                                        type="button"
                                        class="border border-neutral-medium rounded-lg overflow-hidden bg-white hover:ring-2 hover:ring-brand-primary"
                                        (click)="openImageModal(item)"
                                      >
                                        <img [src]="item.url" alt="" class="w-full h-28 object-cover" />
                                        <div class="p-2 text-xs text-neutral-dark truncate">{{ fileName(item.url) }}</div>
                                      </button>
                                    }
                                  </div>
                                  @if (!mediaItems().length) {
                                    <div class="text-sm text-neutral-dark">No hay imágenes disponibles.</div>
                                  }
                                }

                                @if (draft.imageUrl) {
                                  <button
                                    type="button"
                                    class="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition"
                                    (click)="removeImage()"
                                  >Quitar imagen</button>
                                }
                              </div>
                            }
                          </div>
                        </div>
                          <div class="grid gap-1">
                            <span class="text-sm text-neutral-dark font-semibold">textHtml</span>
                            <div class="quill-shell">
                              <quill-editor
                                class="quill-editor-block"
                                [modules]="quillModules"
                                [formControl]="quillControl"
                                theme="snow"
                              ></quill-editor>
                            </div>
                          </div>
                      }

                      @if (draft.type === 'carousel') {
                        <!-- Edición de CAROUSEL -->
                        <div class="grid md:grid-cols-2 gap-4">
                          <label class="grid gap-1">
                            <span class="text-sm text-neutral-dark font-semibold">numImages (1..6)</span>
                            <input class="border border-neutral-medium rounded px-3 py-2 focus:ring-2 focus:ring-brand-primary" type="number" min="1" max="6" [value]="draft.images.length" (input)="onCarouselNumInput(draft.id, $event)" />
                          </label>
                          <label class="grid gap-1">
                            <span class="text-sm text-neutral-dark font-semibold">maxHeightPx (opcional)</span>
                            <input class="border border-neutral-medium rounded px-3 py-2 focus:ring-2 focus:ring-brand-primary" type="number" [value]="draft.maxHeightPx ?? ''" (input)="onCarouselMaxHeightChange(draft.id, $event)" />
                          </label>
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

                @if (modalImage(); as modal) {
                  <div class="modal-backdrop" (click)="closeImageModal()"></div>
                  <div class="modal-card" role="dialog" aria-modal="true" aria-label="Vista previa de imagen">
                    <div class="modal-surface">
                      <div class="modal-body">
                        <img [src]="modal.url" alt="" class="max-h-[70vh] max-w-full object-contain" />
                        <div class="text-sm text-neutral-dark break-all">{{ fileName(modal.url) }}</div>
                      </div>
                      <div class="modal-footer">
                        <button type="button" class="px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-accent transition" (click)="confirmImage(modal)">Seleccionar</button>
                        <button type="button" class="px-4 py-2 rounded-lg border border-neutral-medium text-neutral-dark hover:bg-neutral-light transition" (click)="closeImageModal()">Cancelar</button>
                      </div>
                    </div>
                  </div>
                }
              </article>
            }
          </section>
        </div>
      </div>
    </main>
  `,
  styleUrls: ['./content-segments-editor.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, // necesario para que los estilos de Quill apliquen a la toolbar e iconos
})
export class ContentSegmentsEditorPage {
  readonly quillModules = quillModules;
  readonly quillControl = new FormControl<string>('', { nonNullable: true });
  readonly mediaItems = signal<MediaItem[]>([]);
  readonly mediaLoading = signal(false);
  readonly mediaError = signal<string | null>(null);
  readonly imageSelectorOpen = signal(false);
  readonly modalImage = signal<MediaItem | null>(null);
  // Estado principal de contenido en memoria
  readonly content = signal<ContentDTO>({
    schemaVersion: 1,
    templateId: 1,
    status: 'draft',
    segments: [],
  });

  // UI: id del segmento en edición
  readonly editingId = signal<string | null>(null);
  readonly editingDraft = signal<SegmentDTO | null>(null);

  constructor(private readonly mediaApi: MediaApiService) {
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
    if (this.editingId() === id) this.editingId.set(null);
  }

  startEdit(id: string): void {
    const seg = this.content().segments.find(s => s.id === id);
    if (!seg) return;
    if (seg.type === 'rich') {
      this.quillControl.setValue(seg.textHtml ?? '', { emitEvent: false });
      this.imageSelectorOpen.set(false);
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
    this.editingId.set(null);
    this.editingDraft.set(null);
  }

  discardEdit(): void {
    this.quillControl.setValue('', { emitEvent: false });
    this.imageSelectorOpen.set(false);
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
      textHtml: '<h3 class="text-xl font-semibold mb-2">Nuevo segmento rich</h3><p class="text-gray-700">Texto de ejemplo.</p>',
      imagePlacement: 'top',
      imageWidth: 50,
      // sin imagen por defecto
    };
    this.content.set({ ...c, segments: [...c.segments, seg] });
  }

  addCarousel(): void {
    const c = this.content();
    const id = this.newId('carousel');
    const order = c.segments.length + 1;
    const images = Array.from({ length: 3 }, (_, i) => ({ url: IMAGE_URL, alt: `Slide ${i + 1}` }));
    const seg: CarouselSegmentDTO = { id, order, type: 'carousel', images };
    this.content.set({ ...c, segments: [...c.segments, seg] });
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

  onRichHasImageChange(id: string, ev: Event): void {
    // Eliminado: se reemplazó por selector de imágenes
  }

  onRichTextChange(id: string, ev: Event): void {
    // Ya no se usa textarea; Quill actualiza directamente mediante quillControl
  }

  // Edición CAROUSEL
  onCarouselNum(id: string, n: number): void {
    const count = Math.max(1, Math.min(6, Math.floor(n)));
    const images = Array.from({ length: count }, (_, i) => ({ url: IMAGE_URL, alt: `Slide ${i + 1}` }));
    this.onCarouselChange(id, { images });
  }

  onCarouselNumInput(id: string, ev: Event): void {
    const raw = (ev.target as HTMLInputElement | null)?.value ?? '1';
    const n = Number(raw);
    this.onCarouselNum(id, n);
  }

  onCarouselMaxHeightChange(id: string, ev: Event): void {
    const raw = (ev.target as HTMLInputElement | null)?.value ?? '';
    const n = Number(raw);
    this.onCarouselChange(id, { maxHeightPx: isNaN(n) ? undefined : n });
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

  toggleImageSelector(): void {
    const next = !this.imageSelectorOpen();
    this.imageSelectorOpen.set(next);
    if (next && !this.mediaItems().length) {
      this.loadMedia();
    }
  }

  loadMedia(): void {
    this.mediaLoading.set(true);
    this.mediaError.set(null);
    this.mediaApi.listAssociationMedia(1, true).subscribe({
      next: (items) => {
        this.mediaItems.set(items ?? []);
        this.mediaLoading.set(false);
      },
      error: () => {
        this.mediaLoading.set(false);
        this.mediaError.set('error');
      },
    });
  }

  selectImage(item: MediaItem): void {
    const draft = this.editingDraft();
    if (!draft || draft.type !== 'rich') return;
    this.editingDraft.set({ ...draft, imageUrl: item.url, imageMediaId: item.id, imageAlt: draft.imageAlt ?? '' });
    this.imageSelectorOpen.set(false);
  }

  removeImage(): void {
    const draft = this.editingDraft();
    if (!draft || draft.type !== 'rich') return;
    this.editingDraft.set({ ...draft, imageUrl: undefined, imageMediaId: undefined });
    this.imageSelectorOpen.set(false);
  }

  openImageModal(item: MediaItem): void {
    this.modalImage.set(item);
  }

  closeImageModal(): void {
    this.modalImage.set(null);
  }

  confirmImage(item: MediaItem): void {
    this.selectImage(item);
    this.modalImage.set(null);
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
      templateId: this.content().templateId,
      status: this.content().status,
      segments: [seg],
    };
  }
}
