import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselSegmentDTO } from '../content-segments.dto';

@Component({
  selector: 'app-segment-carousel',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (segment(); as seg) {
      <article class="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
        <div class="relative bg-gray-100">
          @if (currentImg(); as img) {
            <img
              [src]="img.url"
              [alt]="img.alt || 'Slide'"
              class="w-full h-auto object-cover max-h-96"
              [style.max-height.px]="segment()?.maxHeightPx ?? null"
            />
          }

          <div class="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
            <button
              type="button"
              (click)="prev()"
              class="pointer-events-auto px-3 py-2 rounded bg-black/50 text-white hover:bg-black/70"
            >
              ◀
            </button>
            <button
              type="button"
              (click)="next()"
              class="pointer-events-auto px-3 py-2 rounded bg-black/50 text-white hover:bg-black/70"
            >
              ▶
            </button>
          </div>

          <div class="absolute bottom-2 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {{ idx() + 1 }} / {{ seg.images.length }}
          </div>
        </div>
      </article>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentCarouselComponent {
  readonly segment = input<CarouselSegmentDTO>();
  readonly idx = signal(0);

  get currentImg() {
    return () => {
      const seg = this.segment();
      if (!seg || seg.images.length === 0) return null;
      return seg.images[this.idx()];
    };
  }

  prev(): void {
    const seg = this.segment();
    if (!seg || seg.images.length === 0) return;
    const next = (this.idx() - 1 + seg.images.length) % seg.images.length;
    this.idx.set(next);
  }

  next(): void {
    const seg = this.segment();
    if (!seg || seg.images.length === 0) return;
    const next = (this.idx() + 1) % seg.images.length;
    this.idx.set(next);
  }
}
