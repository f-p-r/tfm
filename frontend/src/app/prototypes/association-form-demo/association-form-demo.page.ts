import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HelpIComponent } from '../../shared/help/help-i/help-i.component';
import { HelpHoverDirective } from '../../shared/help/help-hover.directive';
import { HelpContentService } from '../../shared/help/help-content.service';
import { PageHelpService } from '../../shared/help/page-help.service';
import { ASSOCIATION_EDIT_HELP } from '../../components/core/admin/association-edit-modal/association-edit-modal.help';
import { ADMIN_ASSOCIATION_FORM_PAGE_HELP } from '../../shared/help/page-content/admin-associations.help';
import { COUNTRIES, getRegionsByCountry } from '../../shared/utils';

/**
 * Prototipo: formulario Crear / Editar asociación.
 * Equivalente a AssociationEditModalComponent pero como página standalone.
 * Reutiliza el mismo pack de ayuda contextual.
 */
@Component({
  selector: 'app-association-form-demo',
  imports: [ReactiveFormsModule, HelpIComponent, HelpHoverDirective],
  template: `
    <!-- Página contenedora del prototipo -->
    <div class="ds-container pt-10">
      <p class="text-xs uppercase tracking-widest text-neutral-dark/60 mb-4">Prototipo</p>
      <h1 class="h1 mb-6">Crear / Editar Asociación</h1>
      <button class="ds-btn ds-btn-primary" (click)="showModal.set(true)">Abrir modal</button>
    </div>

    <!-- Modal (mismo formato que AssociationEditModalComponent) -->
    @if (showModal()) {
      <div class="ds-modal-backdrop">
        <div class="ds-modal-content">

          <!-- Header -->
          <div class="px-6 py-4 border-b border-neutral-medium">
            <h2 class="h3">Crear Asociación</h2>
          </div>

          <!-- Body -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="px-6 py-4 space-y-4">

              <!-- Feedback de éxito -->
              @if (submitted()) {
                <div class="ds-alert ds-alert-success ds-alert-autofade">
                  Formulario enviado correctamente (simulado).
                </div>
              }

              <!-- Nombre -->
              <div class="ds-field">
                <label for="name" class="ds-label">
                  Nombre *
                  <app-help-i helpKey="name" />
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
                    <app-help-i helpKey="slug" />
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
                    <app-help-i helpKey="shortname" />
                  </label>
                  <input
                    id="shortname"
                    type="text"
                    formControlName="shortname"
                    class="ds-input"
                    helpHover
                    helpKey="shortname"
                    maxlength="20"
                  />
                </div>
              </div>

              <!-- Descripción -->
              <div class="ds-field">
                <label for="description" class="ds-label">
                  Descripción
                  <app-help-i helpKey="description" />
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
                    <app-help-i helpKey="country" />
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
                    <app-help-i helpKey="region" />
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

              <!-- Web externa -->
              <div class="ds-field">
                <label for="web" class="ds-label">
                  Web Externa
                  <app-help-i helpKey="web" />
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
                      <app-help-i helpKey="management" />
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
                      <app-help-i helpKey="disabled" />
                    </span>
                  </label>
                </div>
              </div>

            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-neutral-medium flex justify-end gap-3">
              <button type="button" class="ds-btn" (click)="onCancel()">Cancelar</button>
              <button
                type="submit"
                class="ds-btn ds-btn-primary"
                [disabled]="isSubmitting()"
              >
                {{ isSubmitting() ? 'Guardando...' : 'Crear' }}
              </button>
            </div>
          </form>

        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationFormDemoPage {
  private readonly fb = inject(FormBuilder);
  private readonly helpContent = inject(HelpContentService);
  private readonly pageHelp = inject(PageHelpService);

  protected readonly countries = COUNTRIES;
  protected readonly showModal = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly submitted = signal(false);

  protected readonly filteredRegions = computed(() => {
    const countryId = this.form.get('country_id')?.value as string | null;
    return getRegionsByCountry(countryId);
  });

  protected readonly form = this.fb.group({
    name: ['', [Validators.required]],
    slug: ['', [Validators.required]],
    shortname: [''],
    description: [''],
    country_id: [null as number | null],
    region_id: [null as number | null],
    web: [''],
    management: [false],
    disabled: [false],
  });

  constructor() {
    this.helpContent.setPack(ASSOCIATION_EDIT_HELP);
    this.pageHelp.set(ADMIN_ASSOCIATION_FORM_PAGE_HELP);

    // Limpiar región al cambiar país
    this.form.get('country_id')?.valueChanges.subscribe(() => {
      this.form.patchValue({ region_id: null });
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    // Simular envío
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.submitted.set(true);
      setTimeout(() => {
        this.submitted.set(false);
        this.showModal.set(false);
        this.form.reset({ country_id: null, region_id: null, management: false, disabled: false });
      }, 1500);
    }, 800);
  }

  protected onCancel(): void {
    this.showModal.set(false);
    this.form.reset({ country_id: null, region_id: null, management: false, disabled: false });
    this.submitted.set(false);
  }
}
