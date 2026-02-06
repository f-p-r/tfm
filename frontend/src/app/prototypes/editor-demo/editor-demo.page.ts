// Prototipo editor Quill: este componente se carga de forma lazy
// para mantener Quill fuera del bundle principal.
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { QuillModule, QuillEditorComponent } from 'ngx-quill';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import Quill from 'quill';
import { createQuillModules } from '../quill.config';
import { InternalLinkBlot } from '../../shared/content/internal-link.blot';
import { LinkSelectorComponent, type InternalLinkDestination } from '../../shared/content/link-selector.component';
import { InternalLinksRewriterService } from '../../shared/content/internal-links-rewriter.service';
import { WebScope } from '../../core/web-scope.constants';
import { GamesStore } from '../../core/games/games.store';
import { AssociationsResolveService } from '../../core/associations/associations-resolve.service';

// Registrar el custom blot
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
  private readonly rewriterService = inject(InternalLinksRewriterService);
  private readonly gamesStore = inject(GamesStore);
  private readonly associationsResolve = inject(AssociationsResolveService);

  readonly quillEditor = viewChild<QuillEditorComponent>('editor');

  // Configuración con handlers
  readonly modules = createQuillModules({
    'internal-link': () => this.openLinkSelector(),
  });

  // Semilla inicial para que se vea contenido al cargar
  readonly control = new FormControl<string>('<h2>Editor Quill listo</h2><p>Escribe aquí…</p>', {
    nonNullable: true,
  });
  readonly html = signal('');
  readonly showHtml = signal(false);
  readonly showExportModal = signal(false);
  readonly showLinkSelector = signal(false);
  readonly rewrittenHtml = signal('');

  private savedSelection: any = null;

  constructor() {
    this.control.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.html.set(value);
    });

    // Effect que reescribe el HTML cuando cambia
    effect(() => {
      const originalHtml = this.html();
      this.rewriterService.rewrite(originalHtml, this.buildUrl.bind(this)).subscribe({
        next: (rewritten) => this.rewrittenHtml.set(rewritten),
        error: (err) => {
          console.error('Error reescribiendo HTML:', err);
          this.rewrittenHtml.set(originalHtml);
        },
      });
    });
  }

  /**
   * Función que construye URLs basándose en tipo e ID.
   * Devuelve Observable cuando necesita cargar datos de la API.
   */
  private buildUrl(type: string | number, id: number): Observable<string> | string {
    switch (type) {
      case 'news':
        return `/noticias/slug-${id}`;
      case 'event':
        return `/eventos/slug-${id}`;
      case 'page':
        return `/p/slug-${id}`;
      case WebScope.ASSOCIATION: {
        const cached = this.associationsResolve.getById(id);
        if (cached) {
          return `/asociaciones/${cached.slug}`;
        }
        // No está en caché: resolver desde API
        return this.associationsResolve.resolveById(id).pipe(
          map((association) => `/asociaciones/${association.slug}`)
        );
      }
      case WebScope.GAME: {
        const game = this.gamesStore.getById(id);
        return game ? `/juegos/${game.slug}` : `/juegos/slug-${id}`;
      }
      default:
        throw new Error(`Tipo desconocido: ${type}`);
    }
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

    // Preparar el valor para el blot (ahora usa type e id)
    const blotValue = {
      href: destination.href,
      type: destination.type,
      id: destination.id,
    };

    if (range.length > 0) {
      // Hay texto seleccionado: convertirlo en enlace
      editor.formatText(range.index, range.length, 'internal-link', blotValue);
    } else {
      // No hay selección: insertar el label como enlace
      editor.insertText(range.index, destination.label);
      editor.formatText(range.index, destination.label.length, 'internal-link', blotValue);
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
