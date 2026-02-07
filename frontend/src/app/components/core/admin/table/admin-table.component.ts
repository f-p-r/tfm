import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminTableColumn, AdminTableAction } from './admin-table.model';

@Component({
  selector: 'app-admin-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ds-table-viewport">

      <table class="ds-table">
        <thead>
          <tr>
            @for (col of columns; track col.key) {
              <th [class]="getHeaderClass(col)">
                {{ col.label }}
              </th>
            }
            @if (actions.length) {
              <th class="px-4 py-3 text-xs font-semibold text-neutral-dark uppercase tracking-wider border-b border-neutral-medium bg-neutral-light text-right sticky top-0 z-10">
                Acciones
              </th>
            }
          </tr>
        </thead>

        <tbody>

          @if (isLoading) {
            <tr>
              <td [attr.colspan]="columns.length + (actions.length ? 1 : 0)" class="p-8 text-center text-neutral-500">
                Cargando datos...
              </td>
            </tr>
          }

          @else if (data.length === 0) {
            <tr>
              <td [attr.colspan]="columns.length + (actions.length ? 1 : 0)" class="p-8 text-center text-neutral-500">
                No hay registros para mostrar.
              </td>
            </tr>
          }

          @else {
            @for (row of data; track row) {
              <tr class="hover:bg-neutral-50 transition-colors">

                @for (col of columns; track col.key) {
                  <td [class]="getCellClass(col)">

                    @switch (col.type) {
                      @case ('badge') {
                        <span class="ds-badge" [ngClass]="getBadgeClass(col, row[col.key])">
                          {{ getBadgeLabel(col, row[col.key]) }}
                        </span>
                      }
                      @case ('date') {
                        <span class="text-neutral-500 text-xs">
                          {{ row[col.key] | date:'dd/MM/yyyy HH:mm' }}
                        </span>
                      }
                      @default {
                        <span [ngClass]="{'font-medium text-neutral-dark': col.key === 'name', 'font-mono text-xs text-neutral-500': col.key === 'id'}">
                          {{ row[col.key] }}
                        </span>
                      }
                    }
                  </td>
                }

                @if (actions.length) {
                  <td class="px-4 py-3 text-right whitespace-nowrap">
                    @for (action of actions; track action.action) {
                      <button
                        (click)="onAction(action.action, row)"
                        class="ml-3 text-sm font-medium hover:underline"
                        [ngClass]="action.class || 'text-brand-primary'">
                        {{ action.label }}
                      </button>
                    }
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>

    <div class="ds-table-pagination !justify-center gap-4">
      <button
        class="px-2 py-1 border border-neutral-medium rounded hover:bg-neutral-light disabled:opacity-50 disabled:cursor-not-allowed"
        [disabled]="page === 1 || isLoading"
        (click)="changePage(page - 1)">
        &lt;
      </button>

      <span class="text-xs text-neutral-500">
        Mostrando <strong>{{ startItem }}-{{ endItem }}</strong> de <strong>{{ total }}</strong>
      </span>

      <button
        class="px-2 py-1 border border-neutral-medium rounded hover:bg-neutral-light disabled:opacity-50 disabled:cursor-not-allowed"
        [disabled]="endItem >= total || isLoading"
        (click)="changePage(page + 1)">
        &gt;
      </button>
    </div>
  `
})
export class AdminTableComponent {
  @Input() columns: AdminTableColumn[] = [];
  @Input() data: any[] = [];
  @Input() actions: AdminTableAction[] = [];

  @Input() total = 0;
  @Input() page = 1;
  @Input() pageSize = 15;
  @Input() isLoading = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() action = new EventEmitter<{ action: string, row: any }>();

  get startItem(): number {
    if (this.total === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.page * this.pageSize, this.total);
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= Math.ceil(this.total / this.pageSize)) {
      this.pageChange.emit(newPage);
    }
  }

  onAction(actionName: string, row: any) {
    this.action.emit({ action: actionName, row });
  }

  // Helpers de estilos para coincidir con tu CSS
  getHeaderClass(col: AdminTableColumn): string {
    // Clases exactas de tu thead > th en styles.css
    // sticky top-0 z-10 se aplica globalmente en styles.css a .ds-table th,
    // pero aquí lo reforzamos o dejamos que el CSS actúe si usamos <th> simple.
    // Dado que el CSS usa @apply sticky..., basta con alinear texto.
    let classes = '';
    if (col.align === 'right') classes += 'text-right ';
    else if (col.align === 'center') classes += 'text-center ';
    if (col.width) classes += col.width;
    return classes;
  }

  getCellClass(col: AdminTableColumn): string {
    let classes = '';
    if (col.align === 'right') classes += 'text-right';
    else if (col.align === 'center') classes += 'text-center';
    return classes;
  }

  getBadgeClass(col: AdminTableColumn, value: string): string {
    return col.badgeConfig?.[value] || 'ds-badge'; // fallback
  }

  getBadgeLabel(col: AdminTableColumn, value: string): string {
    return col.badgeLabels?.[value] || value;
  }
}
