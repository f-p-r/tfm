import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentDTO } from './content-segments.dto';
import { SegmentRichComponent } from './components/segment-rich.component';
import { SegmentCarouselComponent } from './components/segment-carousel.component';

@Component({
  selector: 'app-content-renderer',
  standalone: true,
  imports: [CommonModule, SegmentRichComponent, SegmentCarouselComponent],
  template: `
    <section class="flex flex-col gap-8">
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
  readonly content = input<ContentDTO | null>(null);

  get segments() {
    return this.content()?.segments ?? [];
  }
}
