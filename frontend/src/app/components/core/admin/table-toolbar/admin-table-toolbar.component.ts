import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// 1. IMPORTANTE: Importamos la directiva de ayuda (ajusta la ruta si es necesario)
import { HelpHoverDirective } from '../../../../shared/help/help-hover.directive';

@Component({
  selector: 'app-admin-table-toolbar',
  standalone: true,
  // 2. Añadimos la directiva a los imports
  imports: [CommonModule, FormsModule, HelpHoverDirective],
  template: `
    <div class="ds-table-toolbar">

      <div class="flex items-center gap-3 flex-1 min-w-0">

        @if (showSearch) {
          <div class="relative w-full max-w-xs group">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-brand-primary transition-colors pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd" />
              </svg>
            </span>

            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange($event)"
              [placeholder]="placeholder"
              class="ds-input pl-9"
              helpHover
              [helpKey]="searchHelpKey"
            >
          </div>
        }

        <ng-content select="[filters]"></ng-content>
      </div>

      <div class="flex items-center gap-2">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `
})
export class AdminTableToolbarComponent {
  @Input() showSearch = true;
  @Input() placeholder = 'Buscar...';

  /** Clave opcional para mostrar ayuda en el buscador */
  @Input() searchHelpKey?: string;

  @Output() search = new EventEmitter<string>();

  searchTerm = '';

  onSearchChange(value: string) {
    this.search.emit(value);
  }
}
