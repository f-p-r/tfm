/**
 * Componente de renderizado de segmentos ricos (texto + imagen).
 * Muestra imágenes con posicionamiento configurable (izquierda/derecha/arriba)
 * y permite que el texto fluya alrededor de la imagen en escritorio.
 */
import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RichImageDTO, RichSegmentDTO } from './page-content.dto';

@Component({
  selector: 'app-segment-rich',
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (segment(); as seg) {
      <section class="seg-article" [class]="seg.classNames ?? ''">
        <div class="ds-container">
        @if (imageFor(seg); as img) {
          @if (seg.imagePlacement === 'left') {
          <!-- Móvil: 100%; Desktop (md+): flotado a la izquierda y ancho configurado -->
          <figure
            class="seg-figure mb-4 md:mb-2 md:float-left md:mr-4"
            [style.--seg-img-w]="(seg.imageWidth ?? 50) + '%'"
          >
            <img
              [src]="img.url"
              [alt]="img.alt || 'Imagen'"
              class="w-full h-auto object-cover rounded-lg"
              [style.max-height.px]="seg.imageMaxHeightPx ?? null"
            />
          </figure>
          }
          @if (seg.imagePlacement === 'right') {
          <!-- Móvil: 100%; Desktop (md+): flotado a la derecha y ancho configurado -->
          <figure
            class="seg-figure mb-4 md:mb-2 md:float-right md:ml-4"
            [style.--seg-img-w]="(seg.imageWidth ?? 50) + '%'"
          >
            <img
              [src]="img.url"
              [alt]="img.alt || 'Imagen'"
              class="w-full h-auto object-cover rounded-lg"
              [style.max-height.px]="seg.imageMaxHeightPx ?? null"
            />
          </figure>
          }
          @if (!seg.imagePlacement || seg.imagePlacement === 'top') {
          <figure class="mb-4">
            <img
              [src]="img.url"
              [alt]="img.alt || 'Imagen'"
              class="w-full h-auto object-cover rounded-lg"
              [style.max-height.px]="seg.imageMaxHeightPx ?? null"
            />
          </figure>
          }
        }
        @if (seg.textHtml) {
          <div class="seg-text ql-editor" [innerHTML]="normalizeHtml(seg.textHtml)"></div>
        }
        <div class="clear-both"></div>
        </div>
      </section>
    }
  `,
  // Estilos locales: aplicamos la anchura personalizada solo en md+ (>= 768px)
  styles: [
    `
    section.seg-article {
      line-height: 1.75;
    }

    .seg-text {
      display: block;
    }

    /* Sobrescribir estilos del editor de Quill para el viewer */
    .seg-text.ql-editor {
      padding: 0;
      height: auto;
      overflow-y: visible;
      white-space: normal;
    }

    figure.seg-figure {
      width: 100%;
    }
    @media (min-width: 768px) {
      figure.seg-figure {
        width: var(--seg-img-w, 50%);
      }
    }

    section.seg-article :where(h1, h2, h3, h4, h5, h6) {
      font-weight: 600;
      line-height: 1.25;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }

    section.seg-article :where(p) {
      margin-top: 1em;
      margin-bottom: 1em;
    }

    section.seg-article :where(ul, ol) {
      margin-top: 1em;
      margin-bottom: 1em;
      padding-left: 1.625em;
    }

    section.seg-article :where(li) {
      margin-top: 0.5em;
      margin-bottom: 0.5em;
    }

    section.seg-article :where(a) {
      color: rgb(37 99 235);
      text-decoration: underline;
    }

    section.seg-article :where(strong) {
      font-weight: 600;
    }

    section.seg-article :where(em) {
      font-style: italic;
    }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentRichComponent {
  readonly segment = input<RichSegmentDTO>();

  imageFor(seg: RichSegmentDTO | null): RichImageDTO | null {
    if (!seg) return null;
    return seg.image ?? null;
  }

  normalizeHtml(html: string): string {
    // Normaliza espacios no rompibles y elimina comillas externas si existen.
    let normalized = html.replace(/\u00A0/g, ' ').replace(/&nbsp;/g, ' ');
    normalized = normalized.replace(/^\s*"(.*)"\s*$/s, '$1');
    return normalized;
  }
}
