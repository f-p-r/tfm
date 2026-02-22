import { PageContentDTO } from '../../shared/content/page-content.dto';

/**
 * Información reducida del creador de un evento.
 */
export interface EventCreatorDTO {
  id: number;
  username: string;
  name: string;
}

/**
 * Información reducida del juego asociado a un evento.
 */
export interface EventGameDTO {
  id: number;
  name: string;
  slug: string;
}

/**
 * Información del país del evento.
 */
export interface EventCountryDTO {
  id: string;
  name: string;
}

/**
 * Información de la región del evento.
 */
export interface EventRegionDTO {
  id: string;
  name: string;
}

/**
 * Resumen de evento para listados (sin campo content).
 * Corresponde al formato devuelto por GET /api/events.
 */
export interface EventSummaryDTO {
  id: number;
  /** Tipo de scope: 1=Global, 2=Asociación, 3=Juego */
  scopeType: number;
  /** ID del scope (null si es global) */
  scopeId: number | null;
  /** ID del juego relacionado (null si no aplica) */
  gameId: number | null;
  slug: string;
  title: string;
  /** Descripción breve para cards y listados */
  text: string;
  /** Indica si el evento tiene contenido enriquecido */
  hasContent: boolean;
  startsAt: string;
  endsAt: string | null;
  countryCode: string | null;
  country: EventCountryDTO | null;
  regionId: string | null;
  region: EventRegionDTO | null;
  provinceName: string | null;
  municipalityName: string | null;
  postalCode: string | null;
  streetName: string | null;
  streetNumber: string | null;
  active: boolean;
  registrationOpen: boolean;
  published: boolean;
  publishedAt: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  creator: EventCreatorDTO;
  /** Juego relacionado (null si el evento no tiene gameId) */
  game: EventGameDTO | null;
}

/**
 * Evento completo con contenido enriquecido.
 * Corresponde al formato devuelto por GET /api/events/{id}.
 */
export interface EventDTO extends EventSummaryDTO {
  /** Contenido estructurado en segmentos */
  content: PageContentDTO | null;
}

/**
 * Parámetros de filtrado para el listado de eventos.
 */
export interface EventListParams {
  scopeType?: number;
  scopeId?: number;
  gameId?: number;
  active?: boolean;
  registrationOpen?: boolean;
  /** ISO date string, ej: '2026-01-01' */
  from?: string;
  /** ISO date string, ej: '2026-12-31' */
  to?: string;
  includeUnpublished?: boolean;
}

/**
 * Payload para crear un nuevo evento.
 */
export interface EventCreateDTO {
  scopeType: number;
  scopeId: number | null;
  gameId?: number | null;
  slug: string;
  title: string;
  text: string;
  content?: PageContentDTO | null;
  startsAt: string;
  endsAt?: string | null;
  countryCode?: string | null;
  regionId?: string | null;
  provinceName?: string | null;
  municipalityName?: string | null;
  postalCode?: string | null;
  streetName?: string | null;
  streetNumber?: string | null;
  active?: boolean;
  registrationOpen?: boolean;
  published: boolean;
  publishedAt?: string | null;
}

/**
 * Payload para actualizar parcialmente un evento.
 * scope_type y scope_id no son modificables.
 */
export interface EventUpdateDTO {
  gameId?: number | null;
  slug?: string;
  title?: string;
  text?: string;
  content?: PageContentDTO | null;
  startsAt?: string;
  endsAt?: string | null;
  countryCode?: string | null;
  regionId?: string | null;
  provinceName?: string | null;
  municipalityName?: string | null;
  postalCode?: string | null;
  streetName?: string | null;
  streetNumber?: string | null;
  active?: boolean;
  registrationOpen?: boolean;
  published?: boolean;
  publishedAt?: string | null;
}
