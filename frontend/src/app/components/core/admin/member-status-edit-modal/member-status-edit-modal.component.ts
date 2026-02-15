/**
 * Modal de creación/edición de estados de miembros de asociaciones.
 *
 * Permite crear o editar estados con:
 * - Nombre
 * - Tipo (solicitud, activo, incidencias, alerta, baja)
 * - Orden
 * - Descripción (opcional)
 */

import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MEMBER_STATUS_TYPES, MEMBER_STATUS_TYPE_NAMES, MEMBER_STATUS_TYPE_BADGES } from '../../../../core/associations/member-status.constants';

@Component({
  selector: 'app-member-status-edit-modal',
  imports: [ReactiveFormsModule],
  styles: [],
  template: `
    <div class="ds-modal-backdrop">
      <div class="ds-modal-content">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-neutral-medium">
          <h2 class="h3">{{ mode === 'create' ? 'Crear Estado' : 'Editar Estado' }}</h2>
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
                [class.ds-control-error]="getFieldError('name')"
                placeholder="Ej: Activo Premium"
              />
              @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
                <span class="ds-error">El nombre es obligatorio</span>
              }
              @if (getFieldError('name')) {
                <span class="ds-error">{{ getFieldError('name') }}</span>
              }
            </div>

            <!-- Tipo -->
            <div class="ds-field">
              <label for="type" class="ds-label">Tipo</label>
              <select
                id="type"
                formControlName="type"
                class="ds-select"
                [class.ds-control-error]="getFieldError('type')"
              >
                <option value="" disabled>Selecciona un tipo</option>
                @for (typeId of statusTypeIds; track typeId) {
                  <option [value]="typeId">
                    {{ statusTypeNames[typeId] }}
                  </option>
                }
              </select>
              @if (form.get('type')?.hasError('required') && form.get('type')?.touched) {
                <span class="ds-error">El tipo es obligatorio</span>
              }
              @if (getFieldError('type')) {
                <span class="ds-error">{{ getFieldError('type') }}</span>
              }

              <!-- Preview del badge -->
              @if (form.get('type')?.value) {
                <div class="mt-2">
                  <span class="text-xs text-neutral-medium mr-2">Vista previa:</span>
                  <span class="ds-badge" [class]="statusTypeBadges[form.get('type')?.value]">
                    {{ statusTypeNames[form.get('type')?.value] }}
                  </span>
                </div>
              }
            </div>

            <!-- Orden -->
            <div class="ds-field">
              <label for="order" class="ds-label">Orden</label>
              <input
                id="order"
                type="number"
                formControlName="order"
                class="ds-input"
                min="1"
                [class.ds-control-error]="getFieldError('order')"
              />
              <span class="ds-help">Define el orden de visualización del estado</span>
              @if (form.get('order')?.hasError('required') && form.get('order')?.touched) {
                <span class="ds-error">El orden es obligatorio</span>
              }
              @if (form.get('order')?.hasError('min') && form.get('order')?.touched) {
                <span class="ds-error">El orden debe ser mayor a 0</span>
              }
              @if (getFieldError('order')) {
                <span class="ds-error">{{ getFieldError('order') }}</span>
              }
            </div>

            <!-- Descripción -->
            <div class="ds-field">
              <label for="description" class="ds-label">Descripción (opcional)</label>
              <textarea
                id="description"
                formControlName="description"
                class="ds-textarea"
                rows="3"
                [class.ds-control-error]="getFieldError('description')"
                placeholder="Descripción del estado..."
              ></textarea>
              @if (getFieldError('description')) {
                <span class="ds-error">{{ getFieldError('description') }}</span>
              }
            </div>

            <!-- Error general -->
            @if (generalError()) {
              <div class="ds-alert ds-alert-error">
                {{ generalError() }}
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
export class MemberStatusEditModalComponent {
  private readonly fb = inject(FormBuilder);

  @Input() mode: 'create' | 'edit' = 'edit';
  @Input() associationId!: number;

  @Input() set statusData(data: any) {
    if (data) {
      this.form.patchValue({
        name: data.name,
        type: data.type,
        order: data.order,
        description: data.description || ''
      });
      this.statusId = data.id;
    }
  }

  @Output() save = new EventEmitter<{ id: number | null; data: any }>();
  @Output() cancel = new EventEmitter<void>();

  protected readonly form: FormGroup;
  protected readonly isSaving = signal(false);
  protected readonly generalError = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});
  private statusId: number | null = null;

  // Constantes para el template
  protected readonly statusTypeIds = Object.values(MEMBER_STATUS_TYPES);
  protected readonly statusTypeNames = MEMBER_STATUS_TYPE_NAMES;
  protected readonly statusTypeBadges = MEMBER_STATUS_TYPE_BADGES;

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      type: ['', [Validators.required]],
      order: [1, [Validators.required, Validators.min(1)]],
      description: ['']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.generalError.set(null);
    this.fieldErrors.set({});

    const formData = this.form.getRawValue();
    const data = {
      association_id: this.associationId,
      ...formData,
      type: parseInt(formData.type, 10),
      order: parseInt(formData.order, 10),
      description: formData.description || null
    };

    this.save.emit({ id: this.statusId, data });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  setErrors(errors: Record<string, string>): void {
    const formFields = ['name', 'type', 'order', 'description'];
    const fieldErrs: Record<string, string> = {};
    const generalErrs: string[] = [];

    Object.entries(errors).forEach(([field, message]) => {
      if (formFields.includes(field)) {
        fieldErrs[field] = message;
      } else {
        generalErrs.push(message);
      }
    });

    this.fieldErrors.set(fieldErrs);
    if (generalErrs.length > 0) {
      this.generalError.set(generalErrs.join('. '));
    }
  }

  setSaving(saving: boolean): void {
    this.isSaving.set(saving);
  }

  getFieldError(field: string): string | null {
    return this.fieldErrors()[field] || null;
  }
}
