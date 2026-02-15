/**
 * Modal de creación/edición de información de contacto.
 *
 * Permite crear o editar contactos con:
 * - Tipo de contacto (email, teléfono, redes sociales, etc.)
 * - Valor (con validación según el tipo)
 * - Categoría (condicional para email/phone/whatsapp)
 * - Etiqueta opcional
 * - Orden de visualización
 * - Visibilidad pública/privada
 */

import { Component, EventEmitter, Input, Output, signal, computed, effect, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import {
  ContactType,
  CONTACT_TYPES,
  CONTACT_CATEGORIES,
  ContactCategory,
} from '../../../../core/contact/contact.constants';
import { ContactInfo, CreateContactInfo } from '../../../../core/contact/contact.models';
import { HelpIComponent } from '../../../../shared/help/help-i/help-i.component';
import { HelpHoverDirective } from '../../../../shared/help/help-hover.directive';
import { HelpContentService } from '../../../../shared/help/help-content.service';
import { CONTACT_EDIT_HELP_PACK } from '../../../../shared/help/packs/contact-edit.pack';

@Component({
  selector: 'app-contact-edit-modal',
  imports: [ReactiveFormsModule, HelpIComponent],
  template: `
    <div class="ds-modal-backdrop">
      <div class="ds-modal-content">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-neutral-medium">
          <h2 class="h3">{{ mode === 'create' ? 'Crear Contacto' : 'Editar Contacto' }}</h2>
        </div>

        <!-- Modal Body -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="px-6 py-4 space-y-4">

            <!-- Tipo de contacto -->
            <div class="ds-field">
              <label for="contact_type" class="ds-label-with-help">
                <span>Tipo de contacto</span>
                <app-help-i helpKey="contact_type" />
              </label>
              <select
                id="contact_type"
                formControlName="contact_type"
                class="ds-select"
                [class.ds-control-error]="getFieldError('contact_type')"
              >
                <option value="" disabled>Selecciona un tipo</option>
                @for (type of contactTypes; track type) {
                  <option [value]="type">{{ getContactTypeLabel(type) }}</option>
                }
              </select>
              @if (form.get('contact_type')?.hasError('required') && form.get('contact_type')?.touched) {
                <span class="ds-error">El tipo es obligatorio</span>
              }
              @if (getFieldError('contact_type')) {
                <span class="ds-error">{{ getFieldError('contact_type') }}</span>
              }
              @if (selectedTypeInfo(); as info) {
                @if (info.maxLimit && info.maxLimit > 0) {
                  <span class="ds-help">Límite: {{ info.maxLimit }} por organización</span>
                }
              }
            </div>

            <!-- Valor -->
            <div class="ds-field">
              <label for="value" class="ds-label-with-help">
                <span>{{ getValueLabel() }}</span>
                <app-help-i helpKey="value" />
              </label>
              <input
                id="value"
                type="text"
                formControlName="value"
                class="ds-input"
                [class.ds-control-error]="getFieldError('value')"
                [placeholder]="getValuePlaceholder()"
              />
              @if (form.get('value')?.hasError('required') && form.get('value')?.touched) {
                <span class="ds-error">El valor es obligatorio</span>
              }
              @if (form.get('value')?.hasError('pattern') && form.get('value')?.touched) {
                <span class="ds-error">Formato inválido para este tipo de contacto</span>
              }
              @if (getFieldError('value')) {
                <span class="ds-error">{{ getFieldError('value') }}</span>
              }
            </div>

            <!-- Categoría (condicional) -->
            @if (requiresCategory()) {
              <div class="ds-field">
                <label for="category" class="ds-label-with-help">
                  <span>Categoría</span>
                  <app-help-i helpKey="category" />
                </label>
                <select
                  id="category"
                  formControlName="category"
                  class="ds-select"
                  [class.ds-control-error]="getFieldError('category')"
                >
                  <option value="" disabled>Selecciona una categoría</option>
                  @for (cat of categories; track cat.value) {
                    <option [value]="cat.value">{{ cat.label }}</option>
                  }
                </select>
                @if (form.get('category')?.hasError('required') && form.get('category')?.touched) {
                  <span class="ds-error">La categoría es obligatoria para este tipo</span>
                }
                @if (getFieldError('category')) {
                  <span class="ds-error">{{ getFieldError('category') }}</span>
                }
              </div>
            }

            <!-- Etiqueta (opcional) -->
            <div class="ds-field">
              <label for="label" class="ds-label-with-help">
                <span>Etiqueta (opcional)</span>
                <app-help-i helpKey="label" />
              </label>
              <input
                id="label"
                type="text"
                formControlName="label"
                class="ds-input"
                [class.ds-control-error]="getFieldError('label')"
                placeholder="Ej: Contabilidad, Atención al socio"
              />
              @if (getFieldError('label')) {
                <span class="ds-error">{{ getFieldError('label') }}</span>
              }
            </div>

            <!-- Grid: Orden + Público -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Orden -->
              <div class="ds-field">
                <label for="order" class="ds-label-with-help">
                  <span>Orden</span>
                  <app-help-i helpKey="order" />
                </label>
                <input
                  id="order"
                  type="number"
                  formControlName="order"
                  class="ds-input"
                  min="1"
                  [class.ds-control-error]="getFieldError('order')"
                />
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

              <!-- Público (checkbox) -->
              <div class="ds-field ds-field-checkbox-grid">
                <label class="ds-checkbox-label">
                  <input
                    type="checkbox"
                    formControlName="is_public"
                  />
                  <span>
                    Público
                    <app-help-i helpKey="is_public" class="ml-1" />
                  </span>
                </label>
                <span class="ds-help">Visible en la página de contacto</span>
              </div>
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
  `,
})
export class ContactEditModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly helpContent = inject(HelpContentService);

  /** Modo: 'create' para crear, 'edit' para editar */
  @Input() mode: 'create' | 'edit' = 'create';

  /** ID del propietario (owner_id) */
  @Input() ownerId: number | null = null;

  /** Tipo de propietario (owner_type: 1=Global, 2=Association, 3=Game) */
  @Input() ownerType!: number;

  /** Datos del contacto a editar (solo en modo edit) */
  @Input() contactData: ContactInfo | null = null;

  /** Contactos existentes para validar límites */
  @Input() existingContacts: ContactInfo[] = [];

  /** Evento emitido al guardar */
  @Output() save = new EventEmitter<CreateContactInfo>();

  /** Evento emitido al cancelar */
  @Output() cancel = new EventEmitter<void>();

  readonly helpPack = CONTACT_EDIT_HELP_PACK;
  readonly isSaving = signal(false);
  readonly generalError = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string[]>>({});

  readonly contactTypes = Object.keys(CONTACT_TYPES) as ContactType[];
  readonly categories = Object.entries(CONTACT_CATEGORIES).map(([value, label]) => ({ value, label }));

  form!: FormGroup;

  /** Signal del tipo de contacto actual (se inicializa en ngOnInit) */
  private contactTypeValue = signal<ContactType | null>(null);

  /** Información del tipo de contacto seleccionado */
  readonly selectedTypeInfo = computed(() => {
    const type = this.contactTypeValue();
    return type ? CONTACT_TYPES[type] : null;
  });

  /** ¿Requiere categoría el tipo seleccionado? */
  readonly requiresCategory = computed(() => {
    const info = this.selectedTypeInfo();
    return info?.requiresCategory ?? false;
  });

  constructor() {
    this.helpContent.setPack(CONTACT_EDIT_HELP_PACK);

    // Effect para actualizar validadores cuando cambia el tipo
    effect(() => {
      const typeInfo = this.selectedTypeInfo();
      if (typeInfo && this.form) {
        this.updateValueValidators(typeInfo);
        this.updateCategoryValidators(typeInfo);
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      contact_type: ['', Validators.required],
      value: ['', Validators.required],
      category: [null],
      label: [''],
      order: [1, [Validators.required, Validators.min(1)]],
      is_public: [true],
    });

    // Suscribirse a cambios en contact_type para actualizar el signal
    this.form.get('contact_type')?.valueChanges.subscribe((value: ContactType) => {
      this.contactTypeValue.set(value || null);
    });

    // Si es edición, cargar datos
    if (this.mode === 'edit' && this.contactData) {
      this.form.patchValue({
        contact_type: this.contactData.contact_type,
        value: this.contactData.value,
        category: this.contactData.category || null,
        label: this.contactData.label || '',
        order: this.contactData.order,
        is_public: this.contactData.is_public,
      });
      // Actualizar signal con el valor inicial en modo edición
      this.contactTypeValue.set(this.contactData.contact_type);
    }
  }

  private updateValueValidators(typeInfo: typeof CONTACT_TYPES[ContactType]): void {
    const valueControl = this.form.get('value');
    if (!valueControl) return;

    const validators = [Validators.required];
    if (typeInfo.validationPattern) {
      validators.push(Validators.pattern(typeInfo.validationPattern));
    }

    valueControl.setValidators(validators);
    valueControl.updateValueAndValidity({ emitEvent: false });
  }

  private updateCategoryValidators(typeInfo: typeof CONTACT_TYPES[ContactType]): void {
    const categoryControl = this.form.get('category');
    if (!categoryControl) return;

    if (typeInfo.requiresCategory) {
      categoryControl.setValidators([Validators.required]);
    } else {
      categoryControl.clearValidators();
      categoryControl.setValue(null);
    }

    categoryControl.updateValueAndValidity({ emitEvent: false });
  }

  getContactTypeLabel(type: ContactType): string {
    return CONTACT_TYPES[type]?.label || type;
  }

  getValueLabel(): string {
    const typeInfo = this.selectedTypeInfo();
    if (!typeInfo) return 'Valor';

    switch (typeInfo.label) {
      case 'Email': return 'Dirección de email';
      case 'Teléfono': return 'Número de teléfono';
      case 'WhatsApp': return 'Número de WhatsApp';
      case 'Sitio web': return 'URL del sitio web';
      case 'Dirección física': return 'Dirección postal';
      default: return `Usuario de ${typeInfo.label}`;
    }
  }

  getValuePlaceholder(): string {
    const typeInfo = this.selectedTypeInfo();
    return typeInfo?.placeholder || '';
  }

  getFieldError(field: string): string | null {
    const errors = this.serverErrors();
    return errors[field]?.[0] || null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Validar límites antes de guardar
    const formValue = this.form.value;
    const typeInfo = CONTACT_TYPES[formValue.contact_type as ContactType];

    if (typeInfo.maxLimit && typeInfo.maxLimit > 0) {
      const count = this.existingContacts.filter(c =>
        c.contact_type === formValue.contact_type &&
        (this.mode === 'create' || c.id !== this.contactData?.id)
      ).length;

      if (count >= typeInfo.maxLimit) {
        this.generalError.set(`Ya has alcanzado el límite de ${typeInfo.maxLimit} contacto(s) de tipo ${typeInfo.label}`);
        return;
      }
    }

    this.isSaving.set(true);
    this.generalError.set(null);

    const data: CreateContactInfo = {
      owner_type: this.ownerType,
      owner_id: this.ownerId,
      contact_type: formValue.contact_type,
      value: formValue.value,
      category: formValue.category || null,
      label: formValue.label || null,
      order: formValue.order,
      is_public: formValue.is_public,
    };

    this.save.emit(data);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  /**
   * Método público para mostrar errores del servidor
   * (llamado desde el componente padre cuando falla la API)
   */
  setServerErrors(errors: Record<string, string[]>): void {
    this.serverErrors.set(errors);
    this.isSaving.set(false);

    // Mostrar primer error como error general si no es de campo específico
    const firstError = Object.values(errors)[0]?.[0];
    if (firstError && !['contact_type', 'value', 'category', 'label', 'order', 'is_public'].includes(Object.keys(errors)[0])) {
      this.generalError.set(firstError);
    }
  }

  /**
   * Método público para resetear estado de guardado
   * (llamado desde el componente padre cuando la API tiene éxito)
   */
  resetSaving(): void {
    this.isSaving.set(false);
  }
}
