import { PageContentDTO } from '../../shared/content/page-content.dto';

/**
 * Información reducida del creador de una noticia.
 */
export interface NewsCreatorDTO {
  id: number;
  username: string;
  name: string;
}

/**
 * Información reducida del juego asociado a una noticia.
 */
export interface NewsGameDTO {
  id: number;
  name: string;
  slug: string;
}

/**
 * Resumen de noticia para listados (sin campo content).
 * Corresponde al formato devuelto por GET /api/news (mapNewsSummary).
 */
export interface NewsSummaryDTO {
  id: number;
  /** Tipo de scope: 1=Global, 2=Asociación, 3=Juego */
  scopeType: number;
  /** ID del scope (null si es global) */
  scopeId: number | null;
  /** ID del juego relacionado (null si no aplica) */
  gameId: number | null;
  slug: string;
  title: string;
  /** Texto introductorio para cards y listados */
  text: string;
  /** Indica si la noticia tiene contenido enriquecido (content != null y segments no vacío) */
  hasContent: boolean;
  published: boolean;
  publishedAt: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  creator: NewsCreatorDTO;
  /** Juego relacionado (null si la noticia no tiene gameId) */
  game: NewsGameDTO | null;
}

/**
 * Noticia completa con contenido enriquecido.
 * Corresponde al formato devuelto por GET /api/news/{id}.
 */
export interface NewsDTO extends NewsSummaryDTO {
  /** Contenido estructurado en segmentos (compatible con PageContentDTO) */
  content: PageContentDTO | null;
}

/**
 * Parámetros de filtrado para el listado de noticias.
 */
export interface NewsListParams {
  /** Filtrar por tipo de scope (1, 2 o 3) */
  scopeType?: number;
  /** Filtrar por ID de scope */
  scopeId?: number;
  /** Filtrar por juego */
  gameId?: number;
  /** Si true, incluye borradores (requiere permiso news.edit en el scope) */
  includeUnpublished?: boolean;
}

/**
 * Payload para crear una noticia.
 */
export interface NewsCreateDTO {
  scopeType: number;
  scopeId: number | null;
  gameId?: number | null;
  slug: string;
  title: string;
  text: string;
  content?: PageContentDTO | null;
  published: boolean;
  publishedAt?: string | null;
}

/**
 * Payload para actualizar una noticia (todos los campos opcionales).
 * scope_type y scope_id no son modificables tras la creación.
 */
export interface NewsUpdateDTO {
  gameId?: number | null;
  slug?: string;
  title?: string;
  text?: string;
  content?: PageContentDTO | null;
  published?: boolean;
  publishedAt?: string | null;
}
