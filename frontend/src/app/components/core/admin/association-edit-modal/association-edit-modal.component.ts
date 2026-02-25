/**
 * Modal de creación/edición de asociación.
 *
 * Permite crear o editar campos básicos de una asociación:
 * - Nombre
 * - Slug
 * - Nombre corto
 * - Descripción
 * - País y Región
 * - Responsable (owner_id)
 * - Gestión desde Naipeando (management)
 * - Estado (activo/deshabilitado)
 */

import { Component, input, output, signal, effect, inject, computed, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserAutocompleteComponent } from '../user-autocomplete/user-autocomplete.component';
import { Association } from '../../../../core/associations/associations.models';
import { COUNTRIES, getRegionsByCountry } from '../../../../shared/utils';
import { HelpContentService } from '../../../../shared/help/help-content.service';
import { HelpIComponent } from '../../../../shared/help/help-i/help-i.component';
import { HelpHoverDirective } from '../../../../shared/help/help-hover.directive';
import { ASSOCIATION_EDIT_HELP } from './association-edit-modal.help';
import { PageHelpService } from '../../../../shared/help/page-help.service';
import { ADMIN_ASSOCIATIONS_PAGE_HELP, ADMIN_ASSOCIATION_FORM_PAGE_HELP } from '../../../../shared/help/page-content/admin-associations.help';

@Component({
  selector: 'app-association-edit-modal',
  standalone: true,
  imports: [ReactiveFormsModule, UserAutocompleteComponent, HelpIComponent, HelpHoverDirective],
  styles: [],
  template: `
    <div class="ds-modal-backdrop">
      <div class="ds-modal-content">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-neutral-medium">
          <h2 class="h3">{{ mode() === 'create' ? 'Crear Asociación' : 'Editar Asociación' }}</h2>
        </div>

        <!-- Modal Body -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="px-6 py-4 space-y-4">

            <!-- Error general del servidor -->
            @if (serverError()) {
              <div class="ds-alert ds-alert-error">
                {{ serverError() }}
              </div>
            }

            <!-- Nombre -->
            <div class="ds-field">
              <label for="name" class="ds-label">
                Nombre *
                <app-help-i helpKey="name"></app-help-i>
              </label>
              <input
                id="name"
                type="text"
                formControlName="name"
                class="ds-input"
                helpHover
                helpKey="name"
                [class.ds-control-error]="form.get('name')?.invalid && form.get('name')?.touched"
              />
              @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
                <span class="ds-error">El nombre es obligatorio</span>
              }
            </div>

            <!-- Slug y Nombre corto -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="ds-field">
                <label for="slug" class="ds-label">
                  Slug *
                  <app-help-i helpKey="slug"></app-help-i>
                </label>
                <input
                  id="slug"
                  type="text"
                  formControlName="slug"
                  class="ds-input"
                  helpHover
                  helpKey="slug"
                  [class.ds-control-error]="form.get('slug')?.invalid && form.get('slug')?.touched"
                />
                @if (form.get('slug')?.hasError('required') && form.get('slug')?.touched) {
                  <span class="ds-error">El slug es obligatorio</span>
                }
              </div>

              <div class="ds-field">
                <label for="shortname" class="ds-label">
                  Nombre Corto
                  <app-help-i helpKey="shortname"></app-help-i>
                </label>
                <input
                  id="shortname"
                  type="text"
                  formControlName="shortname"
                  class="ds-input"
                  helpHover
                  helpKey="shortname"
                  maxlength="20"
                  [class.ds-control-error]="form.get('shortname')?.invalid && form.get('shortname')?.touched"
                />
              </div>
            </div>

            <!-- Descripción -->
            <div class="ds-field">
              <label for="description" class="ds-label">
                Descripción
                <app-help-i helpKey="description"></app-help-i>
              </label>
              <textarea
                id="description"
                formControlName="description"
                class="ds-textarea"
                helpHover
                helpKey="description"
                rows="4"
              ></textarea>
            </div>

            <!-- País y Región -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="ds-field">
                <label for="country" class="ds-label">
                  País
                  <app-help-i helpKey="country"></app-help-i>
                </label>
                <select
                  id="country"
                  formControlName="country_id"
                  class="ds-select"
                  helpHover
                  helpKey="country"
                >
                  <option [value]="null">Selecciona un país</option>
                  @for (country of countries; track country.id) {
                    <option [value]="country.id">{{ country.name }}</option>
                  }
                </select>
              </div>

              <div class="ds-field">
                <label for="region" class="ds-label">
                  Región
                  <app-help-i helpKey="region"></app-help-i>
                </label>
                <select
                  id="region"
                  formControlName="region_id"
                  class="ds-select ds-select-scrollable"
                  helpHover
                  helpKey="region"
                  [disabled]="!form.get('country_id')?.value"
                >
                  <option [value]="null">
                    {{ form.get('country_id')?.value ? 'Selecciona una región' : 'Primero selecciona un país' }}
                  </option>
                  @for (region of filteredRegions(); track region.id) {
                    <option [value]="region.id">{{ region.name }}</option>
                  }
                </select>
              </div>
            </div>

            <!-- Responsable y Web externa -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="ds-field" style="max-width: 20ch;">
                <label class="ds-label">
                  Responsable
                  <app-help-i helpKey="owner"></app-help-i>
                </label>
                <div helpHover helpKey="owner">
                  <app-user-autocomplete
                    [value]="form.get('owner_id')?.value"
                    (valueChange)="onOwnerChange($event)"
                  />
                </div>
              </div>

              <div class="ds-field">
                <label for="web" class="ds-label">
                  Web Externa
                  <app-help-i helpKey="web"></app-help-i>
                </label>
                <input
                  id="web"
                  type="url"
                  formControlName="web"
                  class="ds-input"
                  helpHover
                  helpKey="web"
                  placeholder="https://"
                />
              </div>
            </div>

            <!-- Gestión desde Naipeando y Deshabilitada -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="ds-field">
                <label class="ds-checkbox-label">
                  <input
                    type="checkbox"
                    formControlName="management"
                    helpHover
                    helpKey="management"
                  />
                  <span>
                    Gestión desde Naipeando
                    <app-help-i helpKey="management"></app-help-i>
                  </span>
                </label>
              </div>

              <div class="ds-field">
                <label class="ds-checkbox-label">
                  <input
                    type="checkbox"
                    formControlName="disabled"
                    helpHover
                    helpKey="disabled"
                  />
                  <span>
                    Deshabilitada
                    <app-help-i helpKey="disabled"></app-help-i>
                  </span>
                </label>
              </div>
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 border-t border-neutral-medium flex justify-end gap-3">
            <button type="button" (click)="onCancel()" class="ds-btn">
              Cancelar
            </button>
            <button
              type="submit"
              class="ds-btn ds-btn-primary"
              [disabled]="form.invalid || isSubmitting()"
            >
              {{ isSubmitting() ? 'Guardando...' : (mode() === 'create' ? 'Crear' : 'Guardar') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AssociationEditModalComponent implements OnDestroy {
  private readonly fb = new FormBuilder();
  private readonly helpContent = inject(HelpContentService);
  private readonly pageHelp = inject(PageHelpService);

  // Inputs
  readonly mode = input<'create' | 'edit'>('create');
  readonly associationData = input<Partial<Association> | null>(null);

  // Outputs
  readonly save = output<{ id: number | null; data: Partial<Association> }>();
  readonly cancel = output<void>();

  // Estado
  protected readonly isSubmitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  // Catálogos
  protected readonly countries = COUNTRIES;

  // Regiones filtradas según el país seleccionado
  protected readonly filteredRegions = computed(() => {
    const countryId = this.form.get('country_id')?.value;
    return getRegionsByCountry(countryId);
  });

  // Formulario
  protected readonly form: FormGroup;

  constructor() {
    // Establecer pack de ayuda de campos (hover + iconos ⓘ)
    this.helpContent.setPack(ASSOCIATION_EDIT_HELP);
    // Actualizar el panel de ayuda de página con el contexto del formulario
    this.pageHelp.set(ADMIN_ASSOCIATION_FORM_PAGE_HELP);

    this.form = this.fb.group({
      name: ['', [Validators.required]],
      slug: ['', [Validators.required]],
      shortname: [''],
      description: [''],
      country_id: [null],
      region_id: [null],
      owner_id: [null],
      web: [''],
      management: [false],
      disabled: [false]
    });

    // Limpiar región cuando cambia el país
    this.form.get('country_id')?.valueChanges.subscribe(() => {
      this.form.patchValue({ region_id: null });
    });

    // Cargar datos cuando cambien
    effect(() => {
      const data = this.associationData();
      if (data) {
        this.form.patchValue({
          name: data.name || '',
          slug: data.slug || '',
          shortname: data.shortname || '',
          description: data.description || '',
          country_id: data.country_id || null,
          region_id: data.region_id || null,
          owner_id: data.owner_id || null,
          web: data.web || '',
          management: data.management || false,
          disabled: data.disabled || false
        });
      }
    });
  }

  ngOnDestroy(): void {
    // Restaurar la ayuda del listado cuando el modal se cierra
    this.pageHelp.set(ADMIN_ASSOCIATIONS_PAGE_HELP);
  }

  protected onOwnerChange(userId: number | null) {
    this.form.patchValue({ owner_id: userId });
  }

  protected onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.mode() === 'edit' ? (this.associationData()?.id || null) : null;
    const formData = this.form.value;

    // Limpiar campos opcionales vacíos
    const data: Partial<Association> = {
      name: formData.name,
      slug: formData.slug,
      disabled: formData.disabled,
      management: formData.management
    };

    if (formData.shortname) data.shortname = formData.shortname;
    if (formData.description) data.description = formData.description;
    if (formData.country_id) data.country_id = formData.country_id;
    if (formData.region_id) data.region_id = formData.region_id;
    if (formData.owner_id) data.owner_id = formData.owner_id;
    if (formData.web) data.web = formData.web;

    this.save.emit({ id, data });
  }

  protected onCancel() {
    this.cancel.emit();
  }

  /**
   * Método público para mostrar errores del servidor.
   * Se llama desde el componente padre cuando falla la petición.
   */
  setError(message: string) {
    this.serverError.set(message);
    this.isSubmitting.set(false);
  }
}
