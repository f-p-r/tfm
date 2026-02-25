import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HelpIComponent } from '../../shared/help/help-i/help-i.component';
import { HelpHoverDirective } from '../../shared/help/help-hover.directive';
import { HelpContentService } from '../../shared/help/help-content.service';
import { PageHelpService } from '../../shared/help/page-help.service';
import { EVENTS_FORM_PACK } from '../../pages/admin/events/events-form.pack';
import { getAdminEventsFormHelp } from '../../shared/help/page-content/admin-events-form.help';
import { WebScope } from '../../core/web-scope.constants';
import { COUNTRIES, getRegionsByCountry } from '../../shared/utils';

/**
 * Prototipo: formulario Crear / Editar evento.
 * Equivalente a EventsFormAdminPage pero standalone y sin sidebar ni API calls.
 * Reutiliza exactamente el mismo pack de ayuda contextual.
 */
@Component({
  selector: 'app-event-form-demo',
  imports: [FormsModule, HelpIComponent, HelpHoverDirective],
  template: `
    <div class="ds-admin-form ds-container">

      <!-- Cabecera -->
      <div>
        <h1 class="h1 mb-4">Nuevo evento</h1>
        <p class="text-xs uppercase tracking-widest text-neutral-dark/60">Prototipo · scope global</p>
      </div>

      <!-- ── Sección 1: Datos del evento ──────────────────────────────── -->
      <div class="form-section">
        <button type="button" class="ds-form-section-toggle" (click)="dataCollapsed.set(!dataCollapsed())">
          <span>Datos del evento</span>
          <span class="ds-form-section-toggle-icon">{{ dataCollapsed() ? '▸' : '▾' }}</span>
        </button>
        <div class="ds-form-section-body" [class.collapsed]="dataCollapsed()">
          <div class="space-y-4" style="margin: 0 4px 4px 4px;">

            <!-- Título + Slug -->
            <div class="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4">
              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label class="ds-label" for="title">Título</label>
                  <app-help-i helpKey="title" />
                </div>
                <input
                  type="text"
                  id="title"
                  class="ds-input"
                  helpHover
                  helpKey="title"
                  [(ngModel)]="title"
                  placeholder="Título del evento"
                />
              </div>

              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label class="ds-label" for="slug">Slug (URL)</label>
                  <app-help-i helpKey="slug" />
                </div>
                <input
                  type="text"
                  id="slug"
                  class="ds-input"
                  helpHover
                  helpKey="slug"
                  [(ngModel)]="slug"
                  placeholder="torneo-primavera-2026"
                />
              </div>
            </div>

            <!-- Texto introductorio -->
            <div class="ds-field">
              <div class="ds-label-with-help">
                <label class="ds-label" for="text">Texto introductorio</label>
                <app-help-i helpKey="text" />
              </div>
              <textarea
                id="text"
                class="ds-textarea"
                helpHover
                helpKey="text"
                [(ngModel)]="text"
                placeholder="Descripción breve del evento"
                rows="2"
              ></textarea>
            </div>

            <!-- Checkboxes de estado -->
            <div class="flex flex-wrap gap-6">
              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label class="ds-checkbox-label ds-label">
                    <input type="checkbox" helpHover helpKey="published" [(ngModel)]="published" />
                    <span>Publicado</span>
                  </label>
                  <app-help-i helpKey="published" />
                </div>
              </div>

              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label class="ds-checkbox-label ds-label">
                    <input type="checkbox" helpHover helpKey="active" [(ngModel)]="active" />
                    <span>Activo</span>
                  </label>
                  <app-help-i helpKey="active" />
                </div>
              </div>

              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label class="ds-checkbox-label ds-label">
                    <input type="checkbox" helpHover helpKey="registrationOpen" [(ngModel)]="registrationOpen" />
                    <span>Inscripción abierta</span>
                  </label>
                  <app-help-i helpKey="registrationOpen" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- ── Sección 2: Lugar y fechas ─────────────────────────────────── -->
      <div class="form-section">
        <button type="button" class="ds-form-section-toggle" (click)="locationCollapsed.set(!locationCollapsed())">
          <span>Lugar y fechas</span>
          <span class="ds-form-section-toggle-icon">{{ locationCollapsed() ? '▸' : '▾' }}</span>
        </button>
        <div class="ds-form-section-body" [class.collapsed]="locationCollapsed()">
          <div class="space-y-4" style="margin: 0 4px 4px 4px;">

            <!-- Fecha de inicio + Fecha de fin -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label class="ds-label" for="startsAt">Fecha de inicio *</label>
                  <app-help-i helpKey="startsAt" />
                </div>
                <input
                  type="datetime-local"
                  id="startsAt"
                  class="ds-input"
                  helpHover
                  helpKey="startsAt"
                  [(ngModel)]="startsAt"
                />
              </div>

              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label class="ds-label" for="endsAt">Fecha de fin</label>
                  <app-help-i helpKey="endsAt" />
                </div>
                <input
                  type="datetime-local"
                  id="endsAt"
                  class="ds-input"
                  helpHover
                  helpKey="endsAt"
                  [(ngModel)]="endsAt"
                />
              </div>
            </div>

            <!-- País + Región -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label class="ds-label" for="countryCode">País</label>
                  <app-help-i helpKey="countryCode" />
                </div>
                <select
                  id="countryCode"
                  class="ds-select"
                  helpHover
                  helpKey="countryCode"
                  [(ngModel)]="countryCode"
                >
                  <option [ngValue]="null">— Sin país —</option>
                  @for (country of countries; track country.id) {
                    <option [ngValue]="country.id">{{ country.name }}</option>
                  }
                </select>
              </div>

              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label class="ds-label" for="regionId">Región / Comunidad autónoma</label>
                  <app-help-i helpKey="regionId" />
                </div>
                <select
                  id="regionId"
                  class="ds-select"
                  helpHover
                  helpKey="regionId"
                  [(ngModel)]="regionId"
                  [disabled]="!countryCode()"
                >
                  <option [ngValue]="null">— Sin región —</option>
                  @for (region of filteredRegions(); track region.id) {
                    <option [ngValue]="region.id">{{ region.name }}</option>
                  }
                </select>
                @if (!countryCode()) {
                  <p class="ds-help">Selecciona un país primero.</p>
                }
              </div>
            </div>

            <!-- Provincia + Municipio + CP -->
            <div class="grid grid-cols-1 md:grid-cols-[1fr_1fr_130px] gap-4">
              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label class="ds-label" for="provinceName">Provincia</label>
                  <app-help-i helpKey="provinceName" />
                </div>
                <input
                  type="text"
                  id="provinceName"
                  class="ds-input"
                  helpHover
                  helpKey="provinceName"
                  [(ngModel)]="provinceName"
                  placeholder="Ej: Madrid"
                />
              </div>

              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label class="ds-label" for="municipalityName">Municipio</label>
                  <app-help-i helpKey="municipalityName" />
                </div>
                <input
                  type="text"
                  id="municipalityName"
                  class="ds-input"
                  helpHover
                  helpKey="municipalityName"
                  [(ngModel)]="municipalityName"
                  placeholder="Ej: Getafe"
                />
              </div>

              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label class="ds-label" for="postalCode">CP</label>
                  <app-help-i helpKey="postalCode" />
                </div>
                <input
                  type="text"
                  id="postalCode"
                  class="ds-input"
                  helpHover
                  helpKey="postalCode"
                  [(ngModel)]="postalCode"
                  placeholder="28001"
                  maxlength="5"
                />
              </div>
            </div>

            <!-- Calle + Número -->
            <div class="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-4">
              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label class="ds-label" for="streetName">Calle / Vía</label>
                  <app-help-i helpKey="streetName" />
                </div>
                <input
                  type="text"
                  id="streetName"
                  class="ds-input"
                  helpHover
                  helpKey="streetName"
                  [(ngModel)]="streetName"
                  placeholder="Ej: Calle Gran Vía"
                />
              </div>

              <div class="ds-field">
                <div class="ds-label-with-help">
                  <label class="ds-label" for="streetNumber">Número</label>
                  <app-help-i helpKey="streetNumber" />
                </div>
                <input
                  type="text"
                  id="streetNumber"
                  class="ds-input"
                  helpHover
                  helpKey="streetNumber"
                  [(ngModel)]="streetNumber"
                  placeholder="Ej: 12 bis"
                  maxlength="20"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- ── Sección 3: Contenido ───────────────────────────────────────── -->
      <div class="form-section">
        <button type="button" class="ds-form-section-toggle" (click)="contentCollapsed.set(!contentCollapsed())">
          <span>Contenido</span>
          <span class="ds-form-section-toggle-icon">{{ contentCollapsed() ? '▸' : '▾' }}</span>
        </button>

        <!-- Clases CSS: siempre visible -->
        <div class="ds-field" style="margin-bottom: 0.75rem;">
          <div class="ds-label-with-help">
            <label class="ds-label" for="classNames">Clases CSS del contenido (avanzado)</label>
            <app-help-i helpKey="classNames" />
          </div>
          <input
            type="text"
            id="classNames"
            class="ds-input"
            helpHover
            helpKey="classNames"
            [(ngModel)]="classNames"
            placeholder="ds-clase-1 ds-clase-2"
          />
        </div>

        <div class="ds-form-section-body" [class.collapsed]="contentCollapsed()">
          <p class="ds-help p-4">
            Editor de contenido segmentado disponible en la versión real de la página.
          </p>
        </div>
      </div>

    </div>

    <!-- Acciones (sticky) -->
    <div class="ds-actions-section ds-container">
      @if (submitted()) {
        <div class="ds-alert ds-alert-success ds-alert-autofade">
          Evento creado correctamente (simulado).
        </div>
      }
      @if (validationError()) {
        <div class="ds-alert ds-alert-error">{{ validationError() }}</div>
      }

      <div class="ds-actions-buttons">
        <button
          class="ds-btn ds-btn-danger"
          (click)="onCancel()"
        >
          Cancelar
        </button>
        <button
          class="ds-btn"
          [class.ds-btn-secondary]="!isSaving()"
          [class.ds-btn-disabled]="isSaving()"
          [disabled]="isSaving()"
        >
          Vista previa
        </button>
        <button
          class="ds-btn"
          [class.ds-btn-primary]="!isSubmitDisabled()"
          [class.ds-btn-disabled]="isSubmitDisabled()"
          (click)="onSubmit()"
          [disabled]="isSubmitDisabled()"
        >
          {{ isSaving() ? 'Creando...' : 'Crear evento' }}
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventFormDemoPage {
  private readonly helpContent = inject(HelpContentService);
  private readonly pageHelp = inject(PageHelpService);

  // Catálogos estáticos
  protected readonly countries = COUNTRIES;

  // Secciones colapsables
  readonly dataCollapsed = signal(false);
  readonly locationCollapsed = signal(false);
  readonly contentCollapsed = signal(false);

  // Datos básicos
  readonly title = signal('');
  readonly slug = signal('');
  readonly text = signal('');
  readonly published = signal(false);
  readonly active = signal(true);
  readonly registrationOpen = signal(false);

  // Lugar y fechas
  readonly startsAt = signal('');
  readonly endsAt = signal('');
  readonly countryCode = signal<string | null>(null);
  readonly regionId = signal<string | null>(null);
  readonly provinceName = signal('');
  readonly municipalityName = signal('');
  readonly postalCode = signal('');
  readonly streetName = signal('');
  readonly streetNumber = signal('');

  // Contenido
  readonly classNames = signal('');

  // Estados
  readonly isSaving = signal(false);
  readonly submitted = signal(false);
  readonly validationError = signal<string | null>(null);

  readonly filteredRegions = computed(() =>
    getRegionsByCountry(this.countryCode()),
  );

  readonly canCreate = computed(() =>
    this.title().trim() !== '' &&
    this.slug().trim() !== '' &&
    this.text().trim() !== '' &&
    this.startsAt().trim() !== '',
  );

  readonly isSubmitDisabled = computed(() => !this.canCreate() || this.isSaving());

  constructor() {
    this.helpContent.setPack(EVENTS_FORM_PACK);
    this.pageHelp.set(getAdminEventsFormHelp(WebScope.GLOBAL));

    // Limpiar región al cambiar país
    effect(() => {
      this.countryCode(); // track
      this.regionId.set(null);
    });
  }

  protected onSubmit(): void {
    if (!this.canCreate()) {
      this.validationError.set('Título, slug, texto y fecha de inicio son obligatorios.');
      return;
    }
    this.validationError.set(null);
    this.isSaving.set(true);
    setTimeout(() => {
      this.isSaving.set(false);
      this.submitted.set(true);
      setTimeout(() => this.submitted.set(false), 2500);
    }, 800);
  }

  protected onCancel(): void {
    this.title.set('');
    this.slug.set('');
    this.text.set('');
    this.published.set(false);
    this.active.set(true);
    this.registrationOpen.set(false);
    this.startsAt.set('');
    this.endsAt.set('');
    this.countryCode.set(null);
    this.provinceName.set('');
    this.municipalityName.set('');
    this.postalCode.set('');
    this.streetName.set('');
    this.streetNumber.set('');
    this.classNames.set('');
    this.validationError.set(null);
    this.submitted.set(false);
  }
}
