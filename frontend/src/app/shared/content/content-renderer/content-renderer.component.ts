import { Component, Input, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PageContentDTO, SegmentDTO } from '../page-content.dto';

@Component({
  selector: 'app-content-renderer',
  standalone: true,
  imports: [CommonModule /* Añade tu CarouselComponent si tienes uno */],
  templateUrl: './content-renderer.component.html',
  styleUrl: './content-renderer.component.css',
  encapsulation: ViewEncapsulation.None // Importante para que los estilos afecten al HTML inyectado
})
export class ContentRendererComponent {
  private sanitizer = inject(DomSanitizer);

  @Input() content: PageContentDTO | null = null;

  // Helper para sanitizar el HTML de Quill
  sanitize(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
