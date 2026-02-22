
/**
 * Componente de tabla administrativa con funcionalidades integradas:
 *
 * - **Ordenación**: Click en cabeceras para ordenar ascendente/descendente
 * - **Paginación**: Automática con controles de navegación
 * - **Tipos de datos**: Soporta texto, números, fechas y badges
 * - **Acciones**: Botones configurables por fila
 * - **Alineación**: Configurable por columna (left/center/right)
 *
 * Recibe todos los datos y gestiona internamente el ordenamiento y paginación.
 * No requiere lógica externa para estas funcionalidades.
 */

import { Component, EventEmitter, Input, Output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminTableColumn, AdminTableAction } from './admin-table.model';

@Component({
  selector: 'app-admin-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      /* El propio componente es el contenedor Flex vertical */
      display: flex;
      flex-direction: column;
      overflow: hidden; /* Corta el contenido sobrante */
      height: 100%;     /* Intenta ocupar toda la altura que le den */
      background-color: white;
    }
    .sortable-header {
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s;
    }
    .sortable-header:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  `],
  template: `
    <div class="flex-1 overflow-auto relative">
      <table class="ds-table w-full text-left border-collapse">
        <thead class="bg-neutral-light sticky top-0 z-10 shadow-sm">
          <tr>
            @for (col of columns; track col.key) {
              <th [class]="getHeaderClass(col)" class="sortable-header" (click)="onHeaderClick(col.key)">
                <div class="flex items-center gap-2" [class.justify-end]="col.align === 'right'" [class.justify-center]="col.align === 'center'">
                  <span>{{ col.label }}</span>
                  @if (sortedColumn() === col.key) {
                    <span class="text-brand-primary">
                      {{ sortDirection() === 'asc' ? '▲' : '▼' }}
                    </span>
                  }
                </div>
              </th>
            }
            @if (actions.length) {
              <th class="px-4 py-3 text-xs font-semibold text-neutral-dark uppercase tracking-wider border-b border-neutral-medium bg-neutral-light text-center sticky top-0 z-10">
                Acciones
              </th>
            }
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-light">
          @if (isLoading) {
            <tr><td [attr.colspan]="columns.length + (actions.length ? 1 : 0)" class="p-8 text-center text-neutral-500">Cargando...</td></tr>
          } @else if (displayedData().length === 0) {
            <tr><td [attr.colspan]="columns.length + (actions.length ? 1 : 0)" class="p-8 text-center text-neutral-500">No hay registros.</td></tr>
          } @else {
            @for (row of displayedData(); track row) {
              <tr class="hover:bg-neutral-50 transition-colors cursor-pointer" (click)="onRowClick(row)">
                @for (col of columns; track col.key) {
                  <td [class]="getCellClass(col)">
                    @switch (col.type) {
                      @case ('badge') { <span class="ds-badge" [ngClass]="getBadgeClass(col, row[col.key])">{{ getBadgeLabel(col, row[col.key]) }}</span> }
                      @case ('date') { <span class="text-neutral-500 text-xs">{{ row[col.key] | date:'dd/MM/yyyy' }}</span> }
                      @case ('link') { <a [href]="getLinkHref(col, row[col.key])" class="text-brand-primary hover:text-brand-accent hover:underline">{{ row[col.key] }}</a> }
                      @case ('select') {
                        <div class="flex flex-col gap-1">
                          <select
                            class="ds-select"
                            style="width: 20ch"
                            [value]="row[col.key]"
                            [disabled]="row['_saving_' + col.key]"
                            (change)="onCellChange(col.key, row, $event)">
                            @for (opt of col.selectOptions ?? []; track opt.value) {
                              <option [value]="opt.value">{{ opt.label }}</option>
                            }
                          </select>
                          @if (row['_saving_' + col.key]) {
                            <span class="text-xs text-neutral-dark">Guardando…</span>
                          } @else if (row['_saved_' + col.key]) {
                            <span class="text-xs text-green-700">✓ Guardado</span>
                          }
                        </div>
                      }
                      @default { <span class="text-neutral-dark">{{ row[col.key] }}</span> }
                    }
                  </td>
                }
                @if (actions.length) {
                  <td class="px-4 py-3 text-center whitespace-nowrap">
                    @for (a of actions; track a.action) {
                      @let isDisabled = a.disabledWhen ? a.disabledWhen(row) : false;
                      <button
                        [class]="isDisabled ? 'ds-btn-sm ds-btn-disabled ml-3' : 'ds-btn-sm ds-btn-primary ml-3'"
                        [disabled]="isDisabled"
                        (click)="onAction(a.action, row); $event.stopPropagation()">{{ a.label }}</button>
                    }
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>

    <div class="ds-table-pagination border-t border-neutral-medium shrink-0 p-3 flex items-center justify-center gap-4 bg-white z-20">
      <button class="px-2 py-1 border border-neutral-medium rounded hover:bg-neutral-light disabled:opacity-50"
        [disabled]="currentPage() === 1" (click)="changePage(currentPage() - 1)">&lt;</button>

      <span class="text-xs text-neutral-500">
        Mostrando <strong>{{ startItem() }}-{{ endItem() }}</strong> de <strong>{{ totalItems() }}</strong>
      </span>

      <button class="px-2 py-1 border border-neutral-medium rounded hover:bg-neutral-light disabled:opacity-50"
        [disabled]="endItem() >= totalItems()" (click)="changePage(currentPage() + 1)">&gt;</button>
    </div>
  `
})
export class AdminTableComponent {
  // Inputs
  @Input() columns: AdminTableColumn[] = [];
  @Input() set data(value: any[]) { this.allData.set(value); }
  @Input() actions: AdminTableAction[] = [];
  @Input() pageSize = 15;
  @Input() isLoading = false;

  @Output() action = new EventEmitter<{action: string, row: any}>();

  /**
   * Emite cuando el usuario cambia el valor de una celda type='select'.
   * El objeto `row` incluye las propiedades `_saving_<key>` y `_saved_<key>`
   * que el consumidor puede mutar para mostrar feedback visual.
   */
  @Output() cellChange = new EventEmitter<{ col: string; row: any; value: any }>();

  /**
   * Emite la fila completa al hacer clic en una fila de la tabla.
   * Uso opcional: si no se escucha, no tiene efecto.
   */
  @Output() rowClick = new EventEmitter<any>();

  // Estado interno
  private readonly allData = signal<any[]>([]);
  protected readonly sortedColumn = signal<string | null>(null);
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
  protected readonly currentPage = signal(1);

  // Datos ordenados
  private readonly sortedData = computed(() => {
    const data = this.allData();
    const column = this.sortedColumn();
    const direction = this.sortDirection();

    if (!column) return data;

    return [...data].sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];

      // Manejo especial para fechas
      const col = this.columns.find(c => c.key === column);
      if (col?.type === 'date') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      }

      // Manejo especial para números
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Manejo para strings (case insensitive)
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();

      const comparison = aStr.localeCompare(bStr);
      return direction === 'asc' ? comparison : -comparison;
    });
  });

  // Total de items
  protected readonly totalItems = computed(() => this.sortedData().length);

  // Datos paginados (página actual)
  protected readonly displayedData = computed(() => {
    const data = this.sortedData();
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return data.slice(start, end);
  });

  // Paginación helpers
  protected readonly startItem = computed(() => {
    if (this.totalItems() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize + 1;
  });

  protected readonly endItem = computed(() => {
    return Math.min(this.currentPage() * this.pageSize, this.totalItems());
  });

  // Métodos
  protected onHeaderClick(columnKey: string) {
    if (this.sortedColumn() === columnKey) {
      // Alternar dirección en la misma columna
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // Nueva columna, empezar con ascendente
      this.sortedColumn.set(columnKey);
      this.sortDirection.set('asc');
    }
    // Reset a página 1 al cambiar ordenación
    this.currentPage.set(1);
  }

  protected changePage(page: number) {
    this.currentPage.set(page);
  }

  protected onAction(actionName: string, row: any) {
    this.action.emit({ action: actionName, row });
  }

  protected onCellChange(colKey: string, row: any, event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.cellChange.emit({ col: colKey, row, value });
  }

  protected onRowClick(row: any) {
    this.rowClick.emit(row);
  }

  // Helpers para estilos
  protected getHeaderClass(col: AdminTableColumn): string {
    const baseClass = 'px-4 py-3 text-xs font-semibold text-neutral-dark uppercase tracking-wider border-b border-neutral-medium bg-neutral-light';
    if (col.align === 'right') return baseClass + ' text-right';
    if (col.align === 'center') return baseClass + ' text-center';
    return baseClass;
  }

  protected getCellClass(col: AdminTableColumn): string {
    const baseClass = 'px-4 py-3 align-middle';
    if (col.align === 'right') return baseClass + ' text-right';
    if (col.align === 'center') return baseClass + ' text-center';
    return baseClass;
  }

  protected getBadgeClass(col: AdminTableColumn, value: string): string {
    return col.badgeConfig?.[value] || '';
  }

  protected getBadgeLabel(col: AdminTableColumn, value: string): string {
    return col.badgeLabels?.[value] || value;
  }

  protected getLinkHref(col: AdminTableColumn, value: string): string {
    if (!value) return '#';
    const prefix = col.linkPrefix || '';
    return prefix + value;
  }
}
