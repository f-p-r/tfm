import { PageContentDTO } from './page-content.dto';
import { WebScope } from '../../core/web-scope.constants';

export type PageOwnerType =
   WebScope.ASSOCIATION
  | WebScope.GAME
  | 'news'
  | 'event'
  | 'page';

export interface PageDTO {
  id: number;

  /** Owner: scope numérico (association/game) o string (news/event/page) */
  ownerType: PageOwnerType;

  /** Id numérico del owner */
  ownerId: number;

  /** Único dentro del owner (ownerType + ownerId) */
  slug: string;

  title: string;

  /** Estado publicación (false=draft, true=published) */
  published: boolean;

  /** Opcional, útil para ordenar/mostrar */
  publishedAt?: string | null;

  /** Documento JSON de segmentos */
  content: PageContentDTO;

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
