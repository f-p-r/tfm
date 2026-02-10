import { Component, Input, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PageContentDTO } from '../page-content.dto';
import { SegmentCarouselComponent } from '../segment-carousel.component';

@Component({
  selector: 'app-content-renderer',
  standalone: true,
  imports: [
    CommonModule,
    SegmentCarouselComponent
  ],
  templateUrl: './content-renderer.component.html',
  styleUrl: './content-renderer.component.css',
  encapsulation: ViewEncapsulation.None
})
export class ContentRendererComponent {
  private sanitizer = inject(DomSanitizer);

  @Input() content: PageContentDTO | null = null;

  sanitize(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
