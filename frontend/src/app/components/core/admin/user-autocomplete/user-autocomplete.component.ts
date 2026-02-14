/**
 * Componente de autocompletado para selección de usuarios.
 *
 * Filtra usuarios por username en tiempo real y permite seleccionar uno.
 * Carga todos los usuarios al inicializar (adecuado para <1000 usuarios).
 */

import { Component, ChangeDetectionStrategy, signal, computed, output, input, inject, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../../core/users/users.service';
import { User } from '../../../../core/auth/user.model';

@Component({
  selector: 'app-user-autocomplete',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ds-autocomplete">
      <input
        type="text"
        class="ds-input"
        placeholder="Buscar usuario por username..."
        [(ngModel)]="searchText"
        (focus)="showDropdown.set(true)"
        (blur)="onBlur()"
        [disabled]="disabled()"
      />

      @if (showDropdown() && !disabled()) {
        <div class="ds-autocomplete-dropdown">
          @if (filteredUsers().length > 0) {
            @for (user of filteredUsers(); track user.id) {
              <div
                class="ds-autocomplete-item"
                (mousedown)="selectUser(user)"
              >
                <div>{{ user.username }}</div>
              </div>
            }
          } @else {
            <div class="ds-autocomplete-empty">No se encontraron usuarios</div>
          }
        </div>
      }
    </div>
  `
})
export class UserAutocompleteComponent {
  private readonly usersService = inject(UsersService);

  // Inputs
  readonly value = input<number | null>(null); // user_id seleccionado
  readonly disabled = input(false);

  // Outputs
  readonly valueChange = output<number | null>();

  // Estado interno
  protected readonly searchText = signal('');
  protected readonly showDropdown = signal(false);
  private readonly allUsers = signal<User[]>([]);

  // Usuarios filtrados por username
  protected readonly filteredUsers = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    if (!search) return this.allUsers();

    return this.allUsers().filter(user =>
      user.username.toLowerCase().includes(search)
    ).slice(0, 10); // Limitar a 10 resultados
  });

  constructor() {
    // Cargar usuarios al inicializar
    this.loadUsers();

    // Sincronizar valor inicial con searchText
    effect(() => {
      const userId = this.value();
      if (userId && this.allUsers().length > 0) {
        const user = this.allUsers().find(u => u.id === userId);
        if (user) {
          this.searchText.set(user.username);
        }
      } else if (userId === null) {
        this.searchText.set('');
      }
    });
  }

  private loadUsers() {
    this.usersService.getAll().subscribe({
      next: (response) => {
        this.allUsers.set(response.data);
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
      }
    });
  }

  protected selectUser(user: User) {
    this.searchText.set(user.username);
    this.showDropdown.set(false);
    this.valueChange.emit(user.id ?? null);
  }

  protected onBlur() {
    // Delay para permitir click en item
    setTimeout(() => {
      this.showDropdown.set(false);

      // Si el texto no coincide con ningún usuario, limpiar
      const search = this.searchText().toLowerCase().trim();
      const user = this.allUsers().find(u => u.username.toLowerCase() === search);

      if (!user && search) {
        // Texto inválido, restaurar o limpiar
        const currentValue = this.value();
        if (currentValue) {
          const currentUser = this.allUsers().find(u => u.id === currentValue);
          this.searchText.set(currentUser?.username || '');
        } else {
          this.searchText.set('');
        }
      } else if (user) {
        // Seleccionar automáticamente si hay coincidencia exacta
        this.valueChange.emit(user.id ?? null);
      } else if (!search) {
        // Campo vacío, emitir null
        this.valueChange.emit(null);
      }
    }, 200);
  }
}
