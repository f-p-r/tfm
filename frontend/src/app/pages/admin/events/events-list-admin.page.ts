import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { AdminSidebarContainerComponent } from '../../../components/admin-sidebar/admin-sidebar-container.component';
import { AdminPageSubtitleComponent } from '../../../components/core/admin/admin-page-subtitle/admin-page-subtitle.component';
import { AdminTableComponent } from '../../../components/core/admin/table/admin-table.component';
import { AdminTableAction, AdminTableColumn } from '../../../components/core/admin/table/admin-table.model';
import { ContextStore } from '../../../core/context/context.store';
import { EventsApiService } from '../../../core/events/events-api.service';
import { EventSummaryDTO } from '../../../core/events/event.models';
import { WebScope } from '../../../core/web-scope.constants';
import { PageHelpService } from '../../../shared/help/page-help.service';
import { getAdminEventsListHelp } from '../../../shared/help/page-content/admin-events-list.help';

/** Fila de la tabla de eventos — mapeo plano para AdminTableComponent */
interface EventTableRow {
  id: number;
  title: string;
  slug: string;
  gameName: string;
  publishedLabel: string;
  activeLabel: string;
  publishedAt: string | null;
  registrationOpen: boolean;
}

/**
 * Página de administración: listado de eventos.
 *
 * Muestra los eventos del scope actual (global, asociación o juego)
 * incluyendo borradores. Permite acceder a la gestión de cada evento.
 *
 * Acceso: requiere permiso events.edit en el scope actual.
 */
@Component({
  selector: 'app-events-list-admin',
  imports: [
    AdminSidebarContainerComponent,
    AdminPageSubtitleComponent,
    AdminTableComponent,
  ],
  templateUrl: './events-list-admin.page.html',
  styleUrl: './events-list-admin.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsListAdminPage implements OnInit {
  constructor() { inject(PageHelpService).set(getAdminEventsListHelp(inject(ContextStore).scopeType())); }

  private readonly eventsApi = inject(EventsApiService);
  private readonly contextStore = inject(ContextStore);
  private readonly router = inject(Router);

  // -------------------------------------------------------------------------
  // ESTADO
  // -------------------------------------------------------------------------

  /** Lista original de eventos cargados desde el backend */
  readonly events = signal<EventSummaryDTO[]>([]);

  /** Indica si hay una carga en progreso */
  readonly isLoading = signal(false);

  /** Mensaje de error de carga, null si no hay error */
  readonly errorMessage = signal<string | null>(null);

  // -------------------------------------------------------------------------
  // CONFIGURACIÓN DE LA TABLA
  // -------------------------------------------------------------------------

  /** Definición de columnas de la tabla */
  readonly columns: AdminTableColumn[] = [
    { key: 'id', label: 'ID', type: 'text', align: 'center' },
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'slug', label: 'Slug', type: 'text' },
    { key: 'gameName', label: 'Juego', type: 'text' },
    {
      key: 'publishedLabel',
      label: 'Estado',
      type: 'badge',
      align: 'center',
      badgeConfig: {
        Publicado: 'ds-badge-active',
        Borrador: 'ds-badge-inactive',
      },
    },
    {
      key: 'activeLabel',
      label: 'Activo',
      type: 'badge',
      align: 'center',
      badgeConfig: {
        Activo: 'ds-badge-active',
        Finalizado: 'ds-badge-inactive',
      },
    },
    { key: 'publishedAt', label: 'Publicado el', type: 'date', align: 'center' },
  ];

  /** Acciones disponibles por fila */
  readonly tableActions: AdminTableAction[] = [
    { label: 'Gestión', action: 'gestión' },
    { label: 'Inscripciones', action: 'inscripciones', disabledWhen: (row: EventTableRow) => !row.registrationOpen },
  ];

  // -------------------------------------------------------------------------
  // DATOS DERIVADOS
  // -------------------------------------------------------------------------

  /**
   * Filas de la tabla derivadas de la lista de eventos.
   * Mapea el DTO plano que necesita AdminTableComponent.
   */
  readonly tableRows = computed<EventTableRow[]>(() =>
    this.events().map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      gameName: e.game?.name ?? '—',
      publishedLabel: e.published ? 'Publicado' : 'Borrador',
      activeLabel: e.active ? 'Activo' : 'Finalizado',
      publishedAt: e.publishedAt,
      registrationOpen: e.registrationOpen,
    }))
  );

  // -------------------------------------------------------------------------
  // CICLO DE VIDA
  // -------------------------------------------------------------------------

  ngOnInit(): void {
    this.cargarEventos();
  }

  // -------------------------------------------------------------------------
  // MÉTODOS PÚBLICOS (bindings de plantilla)
  // -------------------------------------------------------------------------

  /**
   * Gestiona las acciones de fila emitidas por AdminTableComponent.
   */
  onTableAction(event: { action: string; row: EventTableRow }): void {
    if (event.action === 'gestión') {
      this.router.navigateByUrl(this.editRoute(event.row.id));
    } else if (event.action === 'inscripciones') {
      this.router.navigateByUrl(this.attendeesRoute(event.row.id));
    }
  }

  /** Navega al formulario de creación según el scope actual */
  onNuevoEvento(): void {
    this.router.navigateByUrl(this.createRoute());
  }

  /** Construye la ruta de edición según el scope actual */
  private editRoute(id: number): string {
    switch (this.contextStore.scopeType()) {
      case WebScope.ASSOCIATION: return `/admin/asociacion/eventos/${id}/editar`;
      case WebScope.GAME:        return `/admin/juego/eventos/${id}/editar`;
      default:                   return `/admin/eventos/${id}/editar`;
    }
  }

  /** Construye la ruta de gestión de inscripciones según el scope actual */
  private attendeesRoute(id: number): string {
    switch (this.contextStore.scopeType()) {
      case WebScope.ASSOCIATION: return `/admin/asociacion/eventos/${id}/inscripciones`;
      case WebScope.GAME:        return `/admin/juego/eventos/${id}/inscripciones`;
      default:                   return `/admin/eventos/${id}/inscripciones`;
    }
  }

  /** Construye la ruta de creación según el scope actual */
  private createRoute(): string {
    switch (this.contextStore.scopeType()) {
      case WebScope.ASSOCIATION: return '/admin/asociacion/eventos/nuevo';
      case WebScope.GAME:        return '/admin/juego/eventos/nuevo';
      default:                   return '/admin/eventos/nuevo';
    }
  }

  // -------------------------------------------------------------------------
  // MÉTODOS PRIVADOS
  // -------------------------------------------------------------------------

  /**
   * Carga los eventos del scope actual desde el backend.
   * Incluye borradores (requiere permiso events.edit, garantizado por el guard de la ruta).
   */
  private cargarEventos(): void {
    const scopeType = this.contextStore.scopeType();
    const scopeId = this.contextStore.scopeId();

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const params = this.buildListParams(scopeType, scopeId);

    this.eventsApi.list(params).subscribe({
      next: (eventos) => {
        this.events.set(eventos);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message ?? 'Error al cargar los eventos');
        this.isLoading.set(false);
        console.error('[EventsListAdmin] Error al cargar eventos:', err);
      },
    });
  }

  /**
   * Construye los parámetros de filtrado para el endpoint según el scope activo.
   */
  private buildListParams(
    scopeType: WebScope,
    scopeId: number | null
  ): Parameters<EventsApiService['list']>[0] {
    const base = { includeUnpublished: true };

    if (scopeType === WebScope.GLOBAL) {
      return { ...base, scopeType: WebScope.GLOBAL };
    }

    return {
      ...base,
      scopeType,
      ...(scopeId !== null ? { scopeId } : {}),
    };
  }
}
