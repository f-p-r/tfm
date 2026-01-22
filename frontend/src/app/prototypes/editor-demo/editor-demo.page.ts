// Prototipo editor Quill: este componente se carga de forma lazy
// para mantener Quill fuera del bundle principal.
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { quillModules } from '../quill.config';

@Component({
  selector: 'app-editor-demo',
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './editor-demo.page.html',
  styleUrl: './editor-demo.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, // Necesario para que los estilos de Quill apliquen al DOM generado
})
export class EditorDemoPage {
  readonly modules = quillModules;

  // Semilla inicial para que se vea contenido al cargar
  readonly control = new FormControl<string>('<h2>Editor Quill listo</h2><p>Escribe aquí…</p>', {
    nonNullable: true,
  });
  readonly html = signal('');
  readonly showHtml = signal(false);
  readonly showExportModal = signal(false);

  constructor() {
    this.control.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.html.set(value);
    });
  }

  toggleHtml(): void {
    this.showHtml.update((v: boolean) => !v);
  }

  openExportModal(): void {
    this.showExportModal.set(true);
  }

  closeExportModal(): void {
    this.showExportModal.set(false);
  }
}
