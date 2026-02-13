
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminTableColumn, AdminTableAction } from './admin-table.model';

@Component({
  selector: 'app-admin-table',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host {
      /* El propio componente es el contenedor Flex vertical */
      display: flex;
      flex-direction: column;
      overflow: hidden; /* Corta el contenido sobrante */
      height: 100%;     /* Intenta ocupar toda la altura que le den */
      background-color: white;
    }
  `],
  template: `
    <div class="flex-1 overflow-auto relative">
      <table class="ds-table w-full text-left border-collapse">
        <thead class="bg-neutral-light sticky top-0 z-10 shadow-sm">
          <tr>
            @for (col of columns; track col.key) {
              <th [class]="getHeaderClass(col)">{{ col.label }}</th>
            }
            @if (actions.length) {
              <th class="px-4 py-3 text-xs font-semibold text-neutral-dark uppercase tracking-wider border-b border-neutral-medium bg-neutral-light text-right sticky top-0 z-10">
                Acciones
              </th>
            }
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-light">
          @if (isLoading) {
            <tr><td [attr.colspan]="columns.length + (actions.length ? 1 : 0)" class="p-8 text-center text-neutral-500">Cargando...</td></tr>
          } @else if (data.length === 0) {
            <tr><td [attr.colspan]="columns.length + (actions.length ? 1 : 0)" class="p-8 text-center text-neutral-500">No hay registros.</td></tr>
          } @else {
            @for (row of data; track row) {
              <tr class="hover:bg-neutral-50 transition-colors">
                @for (col of columns; track col.key) {
                  <td [class]="getCellClass(col)">
                    @switch (col.type) {
                      @case ('badge') { <span class="ds-badge" [ngClass]="getBadgeClass(col, row[col.key])">{{ getBadgeLabel(col, row[col.key]) }}</span> }
                      @case ('date') { <span class="text-neutral-500 text-xs">{{ row[col.key] | date:'dd/MM/yyyy' }}</span> }
                      @default { <span class="text-neutral-dark">{{ row[col.key] }}</span> }
                    }
                  </td>
                }
                @if (actions.length) {
                  <td class="px-4 py-3 text-right whitespace-nowrap">
                    @for (a of actions; track a.action) {
                      <button class="ds-btn-sm ds-btn-primary ml-3" (click)="onAction(a.action, row)">{{ a.label }}</button>
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
        [disabled]="page === 1" (click)="changePage(page - 1)">&lt;</button>

      <span class="text-xs text-neutral-500">
        Mostrando <strong>{{ startItem }}-{{ endItem }}</strong> de <strong>{{ total }}</strong>
      </span>

      <button class="px-2 py-1 border border-neutral-medium rounded hover:bg-neutral-light disabled:opacity-50"
        [disabled]="endItem >= total" (click)="changePage(page + 1)">&gt;</button>
    </div>
  `
})
export class AdminTableComponent {
  // Inputs y lógica idénticos
  @Input() columns: AdminTableColumn[] = [];
  @Input() data: any[] = [];
  @Input() actions: AdminTableAction[] = [];
  @Input() total = 0;
  @Input() page = 1;
  @Input() pageSize = 15;
  @Input() isLoading = false;
  @Output() pageChange = new EventEmitter<number>();
  @Output() action = new EventEmitter<{action: string, row: any}>();

  get startItem() { if(this.total===0) return 0; return ((this.page - 1) * this.pageSize) + 1; }
  get endItem() { return Math.min(this.page * this.pageSize, this.total); }

  changePage(p: number) { this.pageChange.emit(p); }
  onAction(a: string, r: any) { this.action.emit({ action: a, row: r }); }

  getHeaderClass(col: any) {
    const baseClass = 'px-4 py-3 text-xs font-semibold text-neutral-dark uppercase tracking-wider border-b border-neutral-medium bg-neutral-light';
    if (col.align === 'right') return baseClass + ' text-right';
    if (col.align === 'center') return baseClass + ' text-center';
    return baseClass;
  }
  getCellClass(col: any) {
    const baseClass = 'px-4 py-3 align-middle';
    if (col.align === 'right') return baseClass + ' text-right';
    if (col.align === 'center') return baseClass + ' text-center';
    return baseClass;
  }
  getBadgeClass(col: any, v: string) { return col.badgeConfig?.[v] || ''; }
  getBadgeLabel(col: any, v: string) { return col.badgeLabels?.[v] || v; }
}
