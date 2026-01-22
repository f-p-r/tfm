import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RichSegmentDTO } from '../content-segments.dto';

@Component({
  selector: 'app-segment-rich',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (segment(); as seg) {
      <article class="space-y-3">
        @if (seg.imageUrl && seg.imagePlacement === 'left') {
          <!-- Móvil: 100%; Desktop (md+): flotado a la izquierda y ancho por valor arbitrario -->
          <figure
            class="mb-4 md:mb-2 md:float-left md:mr-4 seg-figure"
            [style.--seg-img-w]="seg.imageWidth != null ? seg.imageWidth + '%' : null"
            [style.width.%]="seg.imageWidth ?? null"
          >
            <img
              [src]="seg.imageUrl"
              [alt]="seg.imageAlt || 'Imagen'"
              class="w-full h-auto object-cover rounded-lg"
              [style.max-height.px]="seg.imageMaxHeightPx ?? null"
            />
          </figure>
        }
        @if (seg.imageUrl && seg.imagePlacement === 'right') {
          <!-- Móvil: 100%; Desktop (md+): flotado a la derecha y ancho por valor arbitrario -->
          <figure
            class="mb-4 md:mb-2 md:float-right md:ml-4 seg-figure"
            [style.--seg-img-w]="seg.imageWidth != null ? seg.imageWidth + '%' : null"
            [style.width.%]="seg.imageWidth ?? null"
          >
            <img
              [src]="seg.imageUrl"
              [alt]="seg.imageAlt || 'Imagen'"
              class="w-full h-auto object-cover rounded-lg"
              [style.max-height.px]="seg.imageMaxHeightPx ?? null"
            />
          </figure>
        }
        @if (seg.imageUrl && (!seg.imagePlacement || seg.imagePlacement === 'top')) {
          <figure class="mb-4">
            <img
              [src]="seg.imageUrl"
              [alt]="seg.imageAlt || 'Imagen'"
              class="w-full h-auto object-cover rounded-lg"
              [style.max-height.px]="seg.imageMaxHeightPx ?? null"
            />
          </figure>
        }
        @if (seg.textHtml) {
          <div class="prose prose-neutral max-w-none" [innerHTML]="seg.textHtml"></div>
        }
        <div class="clear-both"></div>
      </article>
    }
  `,
  // Estilos locales: aplicamos la anchura personalizada solo en md+ (>= 768px)
  styles: [
    `figure.seg-figure { width: 100% !important; }
     @media (min-width: 768px) { figure.seg-figure { width: var(--seg-img-w, 100%) !important; } }`,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentRichComponent {
  readonly segment = input<RichSegmentDTO>();
}
