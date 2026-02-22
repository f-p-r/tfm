import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AdminSidebarContainerComponent } from '../../../components/admin-sidebar/admin-sidebar-container.component';
import { AdminPageSubtitleComponent } from '../../../components/core/admin/admin-page-subtitle/admin-page-subtitle.component';
import { ContentSegmentsEditorComponent } from '../../../shared/content/segments-editor/content-segments-editor.component';
import { HelpIComponent } from '../../../shared/help/help-i/help-i.component';
import { HelpHoverDirective } from '../../../shared/help/help-hover.directive';
import { HelpContentService } from '../../../shared/help/help-content.service';
import { AssociationsApiService } from '../../../core/associations/associations-api.service';
import { ContextStore } from '../../../core/context/context.store';
import { EventsApiService } from '../../../core/events/events-api.service';
import { EventCreateDTO, EventDTO, EventUpdateDTO } from '../../../core/events/event.models';
import { CountryApiService, CountryDTO } from '../../../core/countries/country-api.service';
import { RegionApiService, RegionDTO } from '../../../core/regions/region-api.service';
import { PageContentDTO } from '../../../shared/content/page-content.dto';
import { WebScope } from '../../../core/web-scope.constants';
import { EVENTS_FORM_PACK } from './events-form.pack';
import { PageHelpService } from '../../../shared/help/page-help.service';
import { getAdminEventsFormHelp } from '../../../shared/help/page-content/admin-events-form.help';

/** Juego simplificado para el selector de gameId */
interface GameOption {
  id: number;
  name: string;
}

/**
 * Página de administración: formulario de creación y edición de eventos.
 *
 * El modo (crear / editar) se determina automáticamente según la presencia
 * del parámetro de ruta `eventId`.
 *
 * El scope (global, asociación o juego) se obtiene del ContextStore,
 * que es establecido por resolveScopeGuard antes de activar la ruta.
 *
 * Acceso: requiere permiso events.edit en el scope actual.
 */
@Component({
  selector: 'app-events-form-admin',
  imports: [
    FormsModule,
    AdminSidebarContainerComponent,
    AdminPageSubtitleComponent,
    ContentSegmentsEditorComponent,
    HelpIComponent,
    HelpHoverDirective,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './events-form-admin.page.html',
  styleUrl: './events-form-admin.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsFormAdminPage implements OnInit {
  private readonly eventsApi = inject(EventsApiService);
  private readonly associationsApi = inject(AssociationsApiService);
  private readonly countryApi = inject(CountryApiService);
  private readonly regionApi = inject(RegionApiService);
  private readonly contextStore = inject(ContextStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly helpContent = inject(HelpContentService);

  // -------------------------------------------------------------------------
  // PARÁMETROS DE RUTA Y SCOPE
  // -------------------------------------------------------------------------

  /** ID del evento (solo en modo edición) */
  readonly eventId = signal<number | null>(null);

  /** Tipo de scope actual leído del ContextStore */
  readonly scopeType = computed(() => this.contextStore.scopeType());

  /** ID del scope actual (null para global) */
  readonly scopeId = computed(() => this.contextStore.scopeId());

  // -------------------------------------------------------------------------
  // MODO
  // -------------------------------------------------------------------------

  /** true si hay un eventId en la ruta (modo edición), false si es creación */
  readonly isEditMode = computed(() => this.eventId() !== null);

  // -------------------------------------------------------------------------
  // DATOS ORIGINALES (solo en edición)
  // -------------------------------------------------------------------------

  /** Evento cargado desde el backend para comparar cambios */
  readonly originalEvent = signal<EventDTO | null>(null);

  // -------------------------------------------------------------------------
  // CAMPOS DEL FORMULARIO — Datos básicos
  // -------------------------------------------------------------------------

  readonly title = signal('');
  readonly slug = signal('');
  /** Texto introductorio para tarjetas y listados (obligatorio) */
  readonly text = signal('');
  readonly published = signal(false);
  /** El evento está visible/activo. Default: true */
  readonly active = signal(true);
  /** Se aceptan solicitudes de asistencia. Default: false */
  readonly registrationOpen = signal(false);
  /** ID del juego relacionado (solo disponible para scopeType=2) */
  readonly gameId = signal<number | null>(null);

  // -------------------------------------------------------------------------
  // CAMPOS DEL FORMULARIO — Lugar y fechas
  // -------------------------------------------------------------------------

  /** Fecha+hora de inicio en formato datetime-local (ej: '2026-04-01T10:00') */
  readonly startsAt = signal('');
  /** Fecha+hora de fin en formato datetime-local. Vacío si no hay fecha de fin */
  readonly endsAt = signal('');
  readonly countryCode = signal<string | null>(null);
  readonly regionId = signal<string | null>(null);
  readonly provinceName = signal('');
  readonly municipalityName = signal('');
  readonly postalCode = signal('');
  readonly streetName = signal('');
  readonly streetNumber = signal('');

  // -------------------------------------------------------------------------
  // CAMPOS DEL FORMULARIO — Contenido
  // -------------------------------------------------------------------------

  /** Clases CSS globales del evento (sincronizadas con content.classNames) */
  readonly classNames = signal('');
  readonly content = signal<PageContentDTO>({ schemaVersion: 1, segments: [] });
  /** Contenido inicial para el editor (se establece una sola vez al cargar) */
  readonly editorInitialContent = signal<PageContentDTO | null>(null);

  // -------------------------------------------------------------------------
  // DATOS AUXILIARES
  // -------------------------------------------------------------------------

  /** Juegos de la asociación actual (cargados solo cuando scopeType=2) */
  readonly associationGames = signal<GameOption[]>([]);
  /** Lista de países para el selector */
  readonly countries = signal<CountryDTO[]>([]);
  /** Lista completa de regiones (filtrada según país seleccionado) */
  readonly allRegions = signal<RegionDTO[]>([]);

  /**
   * Regiones filtradas por el país seleccionado.
   * Si no hay país seleccionado, se muestran todas.
   */
  readonly filteredRegions = computed<RegionDTO[]>(() => {
    const code = this.countryCode();
    if (!code) return [];
    return this.allRegions().filter(r => r.country_id === code);
  });

  // -------------------------------------------------------------------------
  // ESTADOS DE CARGA
  // -------------------------------------------------------------------------

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  /** true mientras el usuario está editando un segmento del editor */
  readonly isEditingSegment = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly validationErrors = signal<Record<string, string[]>>({});

  /** Controla si la sección de datos básicos está colapsada */
  readonly dataCollapsed = signal(false);
  /** Controla si la sección de lugar y fechas está colapsada */
  readonly locationCollapsed = signal(false);
  /** Controla si la sección de contenido está colapsada */
  readonly contentCollapsed = signal(false);

  // -------------------------------------------------------------------------
  // COMPUTED
  // -------------------------------------------------------------------------

  /** true si todos los campos obligatorios están cubiertos para poder crear */
  readonly canCreate = computed(() =>
    this.title().trim() !== '' &&
    this.slug().trim() !== '' &&
    this.text().trim() !== '' &&
    this.startsAt().trim() !== ''
  );

  /**
   * true si algún campo del formulario difiere del evento original.
   * Solo relevante en modo edición.
   */
  readonly hasChanges = computed(() => {
    if (!this.isEditMode()) return false;
    const original = this.originalEvent();
    if (!original) return false;

    return (
      this.title() !== original.title ||
      this.slug() !== original.slug ||
      this.text() !== original.text ||
      this.published() !== original.published ||
      this.active() !== original.active ||
      this.registrationOpen() !== original.registrationOpen ||
      this.gameId() !== original.gameId ||
      this.toIsoDateTime(this.startsAt()) !== this.normalizeDateTime(original.startsAt) ||
      this.toIsoDateTime(this.endsAt()) !== this.normalizeDateTime(original.endsAt) ||
      this.countryCode() !== original.countryCode ||
      this.regionId() !== original.regionId ||
      this.provinceName() !== (original.provinceName ?? '') ||
      this.municipalityName() !== (original.municipalityName ?? '') ||
      this.postalCode() !== (original.postalCode ?? '') ||
      this.streetName() !== (original.streetName ?? '') ||
      this.streetNumber() !== (original.streetNumber ?? '') ||
      JSON.stringify(this.content()) !== JSON.stringify(original.content ?? { schemaVersion: 1, segments: [] })
    );
  });

  /** Título de la página visible en el encabezado */
  readonly pageTitle = computed(() => {
    if (this.isEditMode()) {
      const t = this.title();
      return t ? `Evento: ${t}` : 'Editar evento';
    }
    return 'Nuevo evento';
  });

  /** true si el botón de envío debe estar deshabilitado */
  readonly isSubmitDisabled = computed(() => {
    if (this.isEditingSegment()) return true;
    if (this.isEditMode()) {
      return !this.hasChanges() || this.isSaving();
    }
    return !this.canCreate() || this.isSaving();
  });

  // -------------------------------------------------------------------------
  // CONSTRUCTOR
  // -------------------------------------------------------------------------

  constructor() {
    inject(PageHelpService).set(getAdminEventsFormHelp(inject(ContextStore).scopeType()));
    this.helpContent.setPack(EVENTS_FORM_PACK);

    // Sincronizar classNames con content.classNames
    effect(() => {
      const cn = this.classNames();
      this.content.update(c => ({ ...c, classNames: cn || undefined }));
    });

    // Limpiar regionId si el país cambia y la región ya no pertenece al nuevo país
    effect(() => {
      const code = this.countryCode();
      const regionId = this.regionId();
      if (regionId && code) {
        const region = this.allRegions().find(r => r.id === regionId);
        if (region && region.country_id !== code) {
          this.regionId.set(null);
        }
      }
    });

    // Auto-expandir si aparecen errores de validación
    effect(() => {
      const errors = this.validationErrors();
      if (Object.keys(errors).length > 0) {
        this.dataCollapsed.set(false);
      }
    });
  }

  // -------------------------------------------------------------------------
  // CICLO DE VIDA
  // -------------------------------------------------------------------------

  ngOnInit(): void {
    // Cargar países y regiones
    this.cargarPaises();
    this.cargarRegiones();

    // Leer el ID de evento de la ruta (presente solo en edición)
    const eventIdParam = this.route.snapshot.paramMap.get('eventId');
    if (eventIdParam) {
      const parsed = parseInt(eventIdParam, 10);
      if (isNaN(parsed)) {
        this.errorMessage.set('ID de evento no válido');
        return;
      }
      this.eventId.set(parsed);
    }

    // Para scopeType=2, cargar los juegos de la asociación
    if (this.scopeType() === WebScope.ASSOCIATION && this.scopeId() !== null) {
      this.cargarJuegosAsociacion(this.scopeId()!);
    }

    if (this.isEditMode()) {
      this.cargarEvento();
    }
  }

  // -------------------------------------------------------------------------
  // CALLBACKS DE LA PLANTILLA
  // -------------------------------------------------------------------------

  /** Recibe el contenido actualizado desde el editor de segmentos */
  onContentChange(newContent: PageContentDTO): void {
    this.content.set(newContent);
  }

  /** Recibe el estado de edición del editor (bloqueamos envío mientras edita) */
  onEditingStateChange(isEditing: boolean): void {
    this.isEditingSegment.set(isEditing);
  }

  /** Envía el formulario para crear o guardar */
  onSubmit(): void {
    if (this.isEditMode()) {
      this.guardar();
    } else {
      this.crear();
    }
  }

  /** Cancela y vuelve al listado de eventos del scope actual */
  onCancel(): void {
    this.router.navigateByUrl(this.backRoute());
  }

  /** Abre la previsualización del contenido en una nueva pestaña */
  openPreview(): void {
    try {
      sessionStorage.setItem('admin:pagePreview', JSON.stringify({
        title: this.title(),
        content: this.content(),
      }));
      window.open('/admin/pages/preview', '_blank');
    } catch (err) {
      console.error('[EventsForm] Error al abrir vista previa:', err);
    }
  }

  // -------------------------------------------------------------------------
  // MÉTODOS PRIVADOS — Carga de datos auxiliares
  // -------------------------------------------------------------------------

  private cargarPaises(): void {
    this.countryApi.list().subscribe({
      next: (countries) => this.countries.set(countries),
      error: (err) => console.error('[EventsForm] Error al cargar países:', err),
    });
  }

  private cargarRegiones(): void {
    this.regionApi.list().subscribe({
      next: (regions) => this.allRegions.set(regions),
      error: (err) => console.error('[EventsForm] Error al cargar regiones:', err),
    });
  }

  private cargarJuegosAsociacion(associationId: number): void {
    this.associationsApi.getById(associationId).subscribe({
      next: (assoc) => {
        const juegos: GameOption[] = (assoc.games ?? [])
          .filter(g => !g.disabled)
          .map(g => ({ id: g.id, name: g.name }));
        this.associationGames.set(juegos);
      },
      error: (err) => console.error('[EventsForm] Error al cargar juegos:', err),
    });
  }

  // -------------------------------------------------------------------------
  // MÉTODOS PRIVADOS — CRUD
  // -------------------------------------------------------------------------

  /** Carga el evento existente desde el backend (modo edición) */
  private cargarEvento(): void {
    const id = this.eventId();
    if (id === null) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.eventsApi.getById(id).subscribe({
      next: (event) => {
        this.originalEvent.set(event);
        this.title.set(event.title);
        this.slug.set(event.slug);
        this.text.set(event.text);
        this.published.set(event.published);
        this.active.set(event.active);
        this.registrationOpen.set(event.registrationOpen);
        this.gameId.set(event.gameId);
        this.startsAt.set(this.toDatetimeLocal(event.startsAt));
        this.endsAt.set(event.endsAt ? this.toDatetimeLocal(event.endsAt) : '');
        this.countryCode.set(event.countryCode);
        this.regionId.set(event.regionId);
        this.provinceName.set(event.provinceName ?? '');
        this.municipalityName.set(event.municipalityName ?? '');
        this.postalCode.set(event.postalCode ?? '');
        this.streetName.set(event.streetName ?? '');
        this.streetNumber.set(event.streetNumber ?? '');

        const contentCargado = event.content ?? { schemaVersion: 1, segments: [] };
        this.classNames.set(contentCargado.classNames ?? '');
        this.content.set(contentCargado);
        this.editorInitialContent.set(JSON.parse(JSON.stringify(contentCargado)));

        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.status === 404 ? 'Evento no encontrado' : (err.message ?? 'Error al cargar el evento')
        );
        console.error('[EventsForm] Error al cargar evento:', err);
      },
    });
  }

  /** Crea un nuevo evento con los datos del formulario */
  private crear(): void {
    if (!this.canCreate()) {
      this.errorMessage.set('Título, slug, texto y fecha de inicio son obligatorios');
      return;
    }

    const scopeType = this.scopeType();
    const scopeId = this.scopeId();

    const payload: EventCreateDTO = {
      scopeType,
      scopeId: scopeType === WebScope.GLOBAL ? null : (scopeId ?? null),
      slug: this.slug(),
      title: this.title(),
      text: this.text(),
      published: this.published(),
      active: this.active(),
      registrationOpen: this.registrationOpen(),
      startsAt: this.toIsoDateTime(this.startsAt()),
      endsAt: this.endsAt() ? this.toIsoDateTime(this.endsAt()) : null,
      content: this.content().segments.length > 0 ? this.content() : null,
      countryCode: this.countryCode() || null,
      regionId: this.regionId() || null,
      provinceName: this.provinceName() || null,
      municipalityName: this.municipalityName() || null,
      postalCode: this.postalCode() || null,
      streetName: this.streetName() || null,
      streetNumber: this.streetNumber() || null,
      // gameId solo se envía para scopeType=2 y cuando esté seleccionado
      ...(scopeType === WebScope.ASSOCIATION && this.gameId() !== null
        ? { gameId: this.gameId() }
        : {}),
    };

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.validationErrors.set({});

    this.eventsApi.create(payload).subscribe({
      next: (creado) => {
        this.isSaving.set(false);
        this.router.navigateByUrl(this.editRoute(creado.id));
      },
      error: (err) => {
        this.isSaving.set(false);
        if (err.status === 422) {
          this.errorMessage.set('Error de validación');
          this.validationErrors.set(err.errors ?? {});
        } else {
          this.errorMessage.set(err.message ?? 'Error al crear el evento');
        }
        console.error('[EventsForm] Error al crear evento:', err);
      },
    });
  }

  /** Guarda los cambios del evento en modo edición */
  private guardar(): void {
    const id = this.eventId();
    if (id === null) return;

    const patch: EventUpdateDTO = {
      slug: this.slug(),
      title: this.title(),
      text: this.text(),
      published: this.published(),
      active: this.active(),
      registrationOpen: this.registrationOpen(),
      startsAt: this.toIsoDateTime(this.startsAt()),
      endsAt: this.endsAt() ? this.toIsoDateTime(this.endsAt()) : null,
      content: this.content().segments.length > 0 ? this.content() : null,
      countryCode: this.countryCode() || null,
      regionId: this.regionId() || null,
      provinceName: this.provinceName() || null,
      municipalityName: this.municipalityName() || null,
      postalCode: this.postalCode() || null,
      streetName: this.streetName() || null,
      streetNumber: this.streetNumber() || null,
      // gameId solo editable en scopeType=2
      ...(this.scopeType() === WebScope.ASSOCIATION
        ? { gameId: this.gameId() }
        : {}),
    };

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.validationErrors.set({});

    this.eventsApi.update(id, patch).subscribe({
      next: (actualizado) => {
        this.originalEvent.set(actualizado);
        this.isSaving.set(false);
        const contentActualizado = actualizado.content ?? { schemaVersion: 1, segments: [] };
        this.editorInitialContent.set(JSON.parse(JSON.stringify(contentActualizado)));
        alert('Evento guardado correctamente');
      },
      error: (err) => {
        this.isSaving.set(false);
        if (err.status === 422) {
          this.errorMessage.set('Error de validación');
          this.validationErrors.set(err.errors ?? {});
        } else {
          this.errorMessage.set(err.message ?? 'Error al guardar el evento');
        }
        console.error('[EventsForm] Error al guardar evento:', err);
      },
    });
  }

  // -------------------------------------------------------------------------
  // MÉTODOS PRIVADOS — Rutas
  // -------------------------------------------------------------------------

  private backRoute(): string {
    switch (this.scopeType()) {
      case WebScope.ASSOCIATION: return '/admin/asociacion/eventos';
      case WebScope.GAME:        return '/admin/juego/eventos';
      default:                   return '/admin/eventos';
    }
  }

  private editRoute(id: number): string {
    switch (this.scopeType()) {
      case WebScope.ASSOCIATION: return `/admin/asociacion/eventos/${id}/editar`;
      case WebScope.GAME:        return `/admin/juego/eventos/${id}/editar`;
      default:                   return `/admin/eventos/${id}/editar`;
    }
  }

  // -------------------------------------------------------------------------
  // MÉTODOS PRIVADOS — Conversión de fechas
  // -------------------------------------------------------------------------

  /**
   * Convierte una fecha ISO del backend ("2026-04-01T10:00:00.000000Z")
   * al formato requerido por datetime-local input ("2026-04-01T10:00").
   */
  private toDatetimeLocal(iso: string): string {
    if (!iso) return '';
    // Quitar timezone y segundos si los trae
    return iso.substring(0, 16);
  }

  /**
   * Convierte un valor de datetime-local ("2026-04-01T10:00")
   * al formato ISO que espera el backend ("2026-04-01T10:00:00").
   * Si el string está vacío devuelve ''.
   */
  private toIsoDateTime(datetimeLocal: string): string {
    if (!datetimeLocal) return '';
    return datetimeLocal.length === 16 ? `${datetimeLocal}:00` : datetimeLocal;
  }

  /**
   * Normaliza una fecha ISO del backend al formato corto para comparación.
   * "2026-04-01T10:00:00.000000Z" → "2026-04-01T10:00:00"
   */
  private normalizeDateTime(iso: string | null): string {
    if (!iso) return '';
    return iso.substring(0, 19);
  }
}
