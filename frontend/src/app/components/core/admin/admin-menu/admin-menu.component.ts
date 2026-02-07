/**
 * Componente que renderiza el menú lateral de administración.
 * Ahora integra el sistema de ayuda contextual ([helpHover]).
 */
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminContextService } from '../../../../core/admin/admin-context.service';
import { AdminMenuItem } from '../../../../core/admin/admin-menu.model';
import { HelpHoverDirective } from '../../../../shared/help/help-hover.directive';

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  // Añadimos HelpHoverDirective a los imports
  imports: [CommonModule, RouterModule, HelpHoverDirective],
  template: `
    <nav class="flex-1 py-6 space-y-1 overflow-y-auto">
      @for (item of items; track item.label) {

        @if (shouldShow(item)) {

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
      }
    </nav>
  `
})
export class AdminMenuComponent {
  private adminContext = inject(AdminContextService);

  @Input() items: AdminMenuItem[] = [];
  @Input() demoMode = false;

  shouldShow(item: AdminMenuItem): boolean {
    if (this.demoMode) return true;
    if (!item.permission) return true;
    return this.adminContext.hasPermission(item.permission);
  }

  isNewCategory(item: AdminMenuItem, index: number): boolean {
    if (!item.category) return false;
    if (index === 0) return true;
    return item.category !== this.items[index - 1].category;
  }
}
