/**
 * Componente de presentación que renderiza el menú lateral de administración.
 *
 * Responsabilidades:
 * - Renderizar items del menú recibidos por @Input
 * - Mostrar categorías agrupadas
 * - Aplicar estilos y navegación
 *
 * NO verifica permisos (esa responsabilidad es del componente contenedor).
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminMenuItem } from '../../../../core/admin/admin-menu.model';
import { HelpHoverDirective } from '../../../../shared/help/help-hover.directive';

@Component({
  selector: 'app-admin-menu',
  imports: [CommonModule, RouterModule, HelpHoverDirective],
  template: `
    <nav class="flex-1 py-6 space-y-1 overflow-y-auto">
      @for (item of items; track item.label) {

        @if (isNewCategory(item, $index)) {
           <div class="px-6 mt-6 mb-2 text-xs font-bold text-neutral-medium uppercase tracking-wider opacity-70">
             {{ item.category }}
           </div>
        }

        <a [routerLink]="item.route"
           routerLinkActive="bg-brand-primary text-white"
           class="ds-admin-nav-item group"
           (click)="item.action ? item.action() : null"
           helpHover
           [helpKey]="item.helpKey">

          <span class="text-xl transition-transform group-hover:scale-110 brightness-200 saturate-150"
                [ngClass]="item.iconClass || ''">
            {{ item.icon }}
          </span>

          <span class="font-medium">{{ item.label }}</span>
        </a>
      }
    </nav>
  `
})
export class AdminMenuComponent {
  @Input() items: AdminMenuItem[] = [];

  isNewCategory(item: AdminMenuItem, index: number): boolean {
    if (!item.category) return false;
    if (index === 0) return true;
    return item.category !== this.items[index - 1].category;
  }
}
