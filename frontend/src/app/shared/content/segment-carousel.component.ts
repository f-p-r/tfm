import { ChangeDetectionStrategy, Component, input, ViewEncapsulation, signal, computed, effect, type EffectCleanupRegisterFn } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselSegmentDTO } from './page-content.dto';

@Component({
  selector: 'app-segment-carousel',
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (segment(); as seg) {
      <section class="seg-article" [class]="seg.classNames ?? ''">
        <div class="ds-container">
        <div
          class="relative group"
          [style.height.px]="seg.height"
          (mouseenter)="onHoverChange(true)"
          (mouseleave)="onHoverChange(false)"
        >
          <!-- Grid responsive de imágenes: móvil 1, tablet max 2, desktop según imagesPerView -->
          <div
            class="h-full p-2 grid gap-2 grid-cols-1"
            [class.md:grid-cols-2]="seg.imagesPerView >= 2"
            [class.lg:grid-cols-1]="seg.imagesPerView === 1"
            [class.lg:grid-cols-2]="seg.imagesPerView === 2"
            [class.lg:grid-cols-3]="seg.imagesPerView === 3"
            [class.lg:grid-cols-4]="seg.imagesPerView === 4"
            [class.lg:grid-cols-5]="seg.imagesPerView === 5"
            [class.lg:grid-cols-6]="seg.imagesPerView === 6"
          >
            @for (img of visibleImages(); track img.url ?? img.alt ?? $index; let i = $index) {
              <div class="h-full overflow-hidden rounded">
                <img
                  [src]="img.url"
                  [alt]="img.alt || 'Imagen de carrusel'"
                  class="w-full h-full object-contain cursor-pointer"
                  (click)="openModal(visibleStartIndex() + i)"
                />
              </div>
            }
          </div>

          <!-- Controles de navegación -->
          @if (totalPages() > 1) {
            <!-- Flecha izquierda y derecha siempre visibles; navegación con wrap-around -->
            <button
              type="button"
              (click)="prev()"
              class="absolute left-2 top-1/2 -translate-y-1/2 px-3 py-2 rounded bg-black/50 text-white hover:bg-black/70 transition-opacity duration-200 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
            >
              ◀
            </button>

            <button
              type="button"
              (click)="next()"
              class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 rounded bg-black/50 text-white hover:bg-black/70 transition-opacity duration-200 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
            >
              ▶
            </button>

            <!-- Indicador de página -->
            <div class="absolute bottom-2 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded transition-opacity duration-200 opacity-0 group-hover:opacity-100">
              {{ currentPage() + 1 }} / {{ totalPages() }}
            </div>
          }
        </div>

        <!-- Modal de imagen ampliada -->
        @if (modalImage(); as modal) {
          <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            (click)="closeModal()"
            role="dialog"
            aria-modal="true"
          >
            <div
              class="relative max-w-5xl w-11/12 md:w-4/5 lg:w-3/4 bg-white rounded-lg"
              (click)="$event.stopPropagation()"
              (mouseenter)="modalHovered.set(true)"
              (mouseleave)="modalHovered.set(false)"
            >
              <button
                type="button"
                class="absolute top-2 right-2 z-10 px-3 py-1 rounded bg-black/60 text-white hover:bg-black/80 transition-opacity duration-200"
                [class.opacity-0]="!modalHovered()"
                [class.opacity-100]="modalHovered()"
                [class.pointer-events-none]="!modalHovered()"
                (click)="closeModal()"
                aria-label="Cerrar"
              >
                ✕
              </button>

              <div class="relative bg-gray-100 flex items-center justify-center overflow-hidden rounded-lg" [style.minHeight.px]="segment()?.height">
                <img [src]="modal.url" [alt]="modal.alt || 'Imagen de carrusel ampliada'" class="max-h-[80vh] max-w-full object-contain" />

                <button
                  type="button"
                  class="absolute left-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded bg-black/50 text-white hover:bg-black/70 transition-opacity duration-200"
                  [class.opacity-0]="!modalHovered()"
                  [class.opacity-100]="modalHovered()"
                  [class.pointer-events-none]="!modalHovered()"
                  (click)="modalPrev()"
                  aria-label="Anterior"
                >
                  ◀
                </button>
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded bg-black/50 text-white hover:bg-black/70 transition-opacity duration-200"
                  [class.opacity-0]="!modalHovered()"
                  [class.opacity-100]="modalHovered()"
                  [class.pointer-events-none]="!modalHovered()"
                  (click)="modalNext()"
                  aria-label="Siguiente"
                >
                  ▶
                </button>

                <div class="absolute bottom-2 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded transition-opacity duration-200"
                  [class.opacity-0]="!modalHovered()"
                  [class.opacity-100]="modalHovered()"
                >
                  {{ (modalIndex() ?? 0) + 1 }} / {{ imageCount() }}
                </div>
              </div>
            </div>
          </div>
        }
        </div>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentCarouselComponent {
  readonly segment = input<CarouselSegmentDTO>();
  readonly currentPage = signal(0);
  readonly isHovered = signal(false);
  readonly modalIndex = signal<number | null>(null);
  readonly modalHovered = signal(false);
  private autoTimer: ReturnType<typeof setTimeout> | null = null;

  readonly totalPages = computed(() => {
    const seg = this.segment();
    if (!seg || seg.images.length === 0) return 0;
    return Math.ceil(seg.images.length / seg.imagesPerView);
  });

  readonly visibleImages = computed(() => {
    const seg = this.segment();
    if (!seg || seg.images.length === 0) return [];
    const start = this.currentPage() * seg.imagesPerView;
    return seg.images.slice(start, start + seg.imagesPerView);
  });

  readonly visibleStartIndex = computed(() => {
    const seg = this.segment();
    if (!seg || seg.images.length === 0) return 0;
    return this.currentPage() * seg.imagesPerView;
  });

  readonly imageCount = computed(() => this.segment()?.images.length ?? 0);

  readonly modalImage = computed(() => {
    const seg = this.segment();
    const idx = this.modalIndex();
    if (!seg || idx === null || idx < 0 || idx >= seg.images.length) return null;
    return seg.images[idx];
  });

  // Autoavance según delaySeconds; se reinicia al cambiar de página o parámetros
  private readonly autoplay = effect((onCleanup: EffectCleanupRegisterFn) => {
    const seg = this.segment();
    const delay = seg?.delaySeconds ?? 0;
    const total = this.totalPages();
    // Leer currentPage para que el efecto se reinicie en cada cambio de página
    const _p = this.currentPage();
    const hovered = this.isHovered();
    const modalOpen = this.modalIndex() !== null;

    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
    if (!seg || !delay || delay <= 0 || total <= 1 || hovered || modalOpen) return;

    this.autoTimer = setTimeout(() => this.next(), delay * 1000);

    onCleanup(() => {
      if (this.autoTimer) {
        clearTimeout(this.autoTimer);
        this.autoTimer = null;
      }
    });
  });

  prev(): void {
    const total = this.totalPages();
    if (total <= 0) return;
    const page = this.currentPage();
    const next = (page - 1 + total) % total;
    this.currentPage.set(next);
  }

  next(): void {
    const total = this.totalPages();
    if (total <= 0) return;
    const page = this.currentPage();
    const next = (page + 1) % total;
    this.currentPage.set(next);
  }

  onHoverChange(isHovering: boolean): void {
    this.isHovered.set(isHovering);
  }

  openModal(globalIndex: number): void {
    const seg = this.segment();
    const count = this.imageCount();
    if (!seg || count === 0) return;
    const normalized = ((globalIndex % count) + count) % count;
    this.modalIndex.set(normalized);
  }

  closeModal(): void {
    this.modalIndex.set(null);
  }

  modalPrev(): void {
    this.shiftModalIndex(-1);
  }

  modalNext(): void {
    this.shiftModalIndex(1);
  }

  private shiftModalIndex(delta: number): void {
    const seg = this.segment();
    const count = this.imageCount();
    const idx = this.modalIndex();
    if (!seg || count === 0 || idx === null) return;
    const nextIndex = ((idx + delta) % count + count) % count;
    this.modalIndex.set(nextIndex);
    this.syncPageToIndex(nextIndex, seg);
  }

  private syncPageToIndex(index: number, seg: CarouselSegmentDTO): void {
    const pageFromIndex = Math.floor(index / seg.imagesPerView);
    if (pageFromIndex !== this.currentPage()) {
      this.currentPage.set(pageFromIndex);
    }
  }
}
