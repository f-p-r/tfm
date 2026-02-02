import { PageContentDTO } from './page-content.dto';

/**
 * Owner type viene del backend SIEMPRE como string.
 * - '1' => global (WebScope.GLOBAL)
 * - '2' => asociación (WebScope.ASSOCIATION)
 * - '3' => juego (WebScope.GAME)
 * - otros tipos futuros: 'news' | 'event' | 'page'
 *
 * NOTA: Para ownerType='1' (global), ownerId debe ser 0 (no null).
 * El backend no acepta null en ownerId, usa 0 como convención para páginas globales.
 */
export type PageOwnerType = '1' | '2' | '3' | 'news' | 'event' | 'page';

/** Constantes de ayuda para scopes */
export const PageOwnerScope = {
  GLOBAL: '1',
  ASSOCIATION: '2',
  GAME: '3',
} as const;

export interface PageDTO {
  id: number;

  /** Owner: string ('2'/'3' para scopes o 'news'/'event'/'page' en el futuro) */
  ownerType: PageOwnerType;

  /** Id numérico del owner */
  ownerId: number;

  /** Único dentro del owner (ownerType + ownerId) */
  slug: string;

  /** Título visible */
  title: string;

  /** Estado publicación (false=borrador, true=publicada) */
  published: boolean;

  /** Opcional, útil para ordenar/mostrar (backend puede setearla al publicar) */
  publishedAt?: string | null;

  /** Documento JSON de segmentos */
  content: PageContentDTO;

  /** Auditoría */
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface PageSummaryDTO {
  id: number;
  slug: string;
  title: string;
  published: boolean;
  updatedAt: string; // ISO
  publishedAt?: string | null; // ISO
}

export interface PageCreateDTO {
  ownerType: PageOwnerType;
  ownerId: number;
  slug: string;
  title: string;
  published: boolean; // default false
  publishedAt?: string | null;
  content: PageContentDTO;
}

export interface PageUpdateDTO {
  slug?: string;
  title?: string;
  published?: boolean;
  publishedAt?: string | null;
  content?: PageContentDTO;
}
