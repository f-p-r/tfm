/**
 * Modal de creación/edición de juego.
 *
 * Permite crear o editar campos básicos de un juego:
 * - Nombre
 * - Slug
 * - Tamaño de equipos
 * - Estado (activo/deshabilitado)
 */

import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-game-edit-modal',
  imports: [ReactiveFormsModule],
  styles: [],
  template: `
    <div class="ds-modal-backdrop">
      <div class="ds-modal-content">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-neutral-medium">
          <h2 class="h3">{{ mode === 'create' ? 'Crear Juego' : 'Editar Juego' }}</h2>
        </div>

        <!-- Modal Body -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="px-6 py-4 space-y-4">

            <!-- Nombre -->
            <div class="ds-field">
              <label for="name" class="ds-label">Nombre</label>
              <input
                id="name"
                type="text"
                formControlName="name"
                class="ds-input"
                [class.ds-control-error]="form.get('name')?.invalid && form.get('name')?.touched"
              />
              @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
                <span class="ds-error">El nombre es obligatorio</span>
              }
            </div>

            <!-- Slug -->
            <div class="ds-field">
              <label for="slug" class="ds-label">Slug</label>
              <input
                id="slug"
                type="text"
                formControlName="slug"
                class="ds-input"
                [class.ds-control-error]="form.get('slug')?.invalid && form.get('slug')?.touched"
              />
              <span class="ds-help">Identificador único para URLs (solo letras, números y guiones)</span>
              @if (form.get('slug')?.hasError('required') && form.get('slug')?.touched) {
                <span class="ds-error">El slug es obligatorio</span>
              }
              @if (form.get('slug')?.hasError('maxlength') && form.get('slug')?.touched) {
                <span class="ds-error">Máximo 64 caracteres</span>
              }
            </div>

            <!-- Tamaño de equipos -->
            <div class="ds-field">
              <label for="team_size" class="ds-label">Tamaño de equipos</label>
              <input
                id="team_size"
                type="number"
                formControlName="team_size"
                class="ds-input"
                min="1"
                [class.ds-control-error]="form.get('team_size')?.invalid && form.get('team_size')?.touched"
              />
              @if (form.get('team_size')?.hasError('required') && form.get('team_size')?.touched) {
                <span class="ds-error">El tamaño de equipos es obligatorio</span>
              }
              @if (form.get('team_size')?.hasError('min') && form.get('team_size')?.touched) {
                <span class="ds-error">Mínimo 1 jugador por equipo</span>
              }
            </div>

            <!-- Estado -->
            <div class="ds-field">
              <label class="ds-checkbox-label">
                <input
                  type="checkbox"
                  formControlName="disabled"
                />
                <span>Deshabilitar juego (oculto para usuarios)</span>
              </label>
            </div>

            <!-- Error general -->
            @if (errorMessage()) {
              <div class="ds-alert ds-alert-error">
                {{ errorMessage() }}
              </div>
            }

          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 border-t border-neutral-medium flex justify-end gap-3">
            <button
              type="button"
              class="ds-btn ds-btn-secondary"
              (click)="onCancel()"
              [disabled]="isSaving()"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="ds-btn ds-btn-primary"
              [disabled]="form.invalid || isSaving()"
            >
              {{ isSaving() ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class GameEditModalComponent {
  @Input() mode: 'create' | 'edit' = 'edit';

  @Input() set gameData(data: any) {
    if (data) {
      this.form.patchValue({
        name: data.name,
        slug: data.slug,
        team_size: data.team_size,
        disabled: data.disabled
      });
      this.gameId = data.id;
    }
  }

  @Output() save = new EventEmitter<{ id: number | null; data: any }>();
  @Output() cancel = new EventEmitter<void>();

  protected form: FormGroup;
  protected isSaving = signal(false);
  protected errorMessage = signal<string | null>(null);
  private gameId: number = 0;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      slug: ['', [Validators.required, Validators.maxLength(64)]],
      team_size: [1, [Validators.required, Validators.min(1)]],
      disabled: [false]
    });
  }

  protected onSubmit() {
    if (this.form.valid && !this.isSaving()) {
      this.isSaving.set(true);
      this.errorMessage.set(null);
      this.save.emit({
        id: this.mode === 'create' ? null : this.gameId,
        data: this.form.value
      });
    }
  }

  protected onCancel() {
    this.cancel.emit();
  }

  // Método público para gestionar errores desde el padre
  public setError(message: string) {
    this.errorMessage.set(message);
    this.isSaving.set(false);
  }

  // Método público para resetear estado de guardado
  public resetSaving() {
    this.isSaving.set(false);
  }
}
