import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageContentDTO } from './page-content.dto';
import { SegmentRichComponent } from './segment-rich.component';
import { SegmentCarouselComponent } from './segment-carousel.component';

@Component({
  selector: 'app-content-renderer',
  imports: [CommonModule, SegmentRichComponent, SegmentCarouselComponent],
  template: `
    <section>
      @for (segment of segments; track segment.id) {
        @if (segment.type === 'rich') {
          <app-segment-rich [segment]="segment"></app-segment-rich>
        }
        @if (segment.type === 'carousel') {
          <app-segment-carousel [segment]="segment"></app-segment-carousel>
        }
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentRendererComponent {
  readonly content = input<PageContentDTO | null>(null);

  get segments() {
    return this.content()?.segments ?? [];
  }
}
