// Prototipo editor Quill: este componente se carga de forma lazy
// para mantener Quill fuera del bundle principal.
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { QuillModule, QuillEditorComponent } from 'ngx-quill';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Quill from 'quill';
import { editorDemoQuillModules } from '../quill.config';
import { InternalLinkBlot } from './internal-link.blot';
import { LinkSelectorComponent, type InternalLinkDestination } from './link-selector.component';

// Registrar el custom blot ANTES de que se inicialice el componente
Quill.register(InternalLinkBlot);

@Component({
  selector: 'app-editor-demo',
  imports: [CommonModule, ReactiveFormsModule, QuillModule, LinkSelectorComponent],
  templateUrl: './editor-demo.page.html',
  styleUrl: './editor-demo.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, // Necesario para que los estilos de Quill apliquen al DOM generado
})
export class EditorDemoPage {
  readonly quillEditor = viewChild<QuillEditorComponent>('editor');

  // Configuración dinámica con handler
  readonly modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['blockquote'],
        ['link'],
        ['internal-link'],
        ['clean'],
      ],
      handlers: {
        'internal-link': () => {
          this.openLinkSelector();
        },
      },
    },
  };

  // Semilla inicial para que se vea contenido al cargar
  readonly control = new FormControl<string>('<h2>Editor Quill listo</h2><p>Escribe aquí…</p>', {
    nonNullable: true,
  });
  readonly html = signal('');
  readonly showHtml = signal(false);
  readonly showExportModal = signal(false);
  readonly showLinkSelector = signal(false);

  private savedSelection: any = null;

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

  openLinkSelector(): void {
    const editor = this.quillEditor()?.quillEditor;
    if (!editor) return;

    // Guardar la selección actual
    this.savedSelection = editor.getSelection();
    this.showLinkSelector.set(true);
  }

  onLinkSelected(destination: InternalLinkDestination): void {
    const editor = this.quillEditor()?.quillEditor;
    if (!editor || !this.savedSelection) {
      this.showLinkSelector.set(false);
      return;
    }

    // Restaurar la selección
    editor.setSelection(this.savedSelection.index, this.savedSelection.length);

    const range = this.savedSelection;

    if (range.length > 0) {
      // Hay texto seleccionado: convertirlo en enlace
      editor.formatText(range.index, range.length, 'internal-link', destination);
    } else {
      // No hay selección: insertar el label como enlace
      editor.insertText(range.index, destination.label);
      editor.formatText(range.index, destination.label.length, 'internal-link', destination);
      editor.setSelection(range.index + destination.label.length, 0);
    }

    // Forzar actualización del HTML
    setTimeout(() => {
      const htmlContent = editor.root.innerHTML;
      this.control.setValue(htmlContent);
    }, 0);

    this.showLinkSelector.set(false);
    this.savedSelection = null;
  }

  onLinkCanceled(): void {
    this.showLinkSelector.set(false);
    this.savedSelection = null;
  }
}
