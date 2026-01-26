export type MediaScopeType = 'global' | 'association' | 'game';

export interface MediaItem {
  id: number;
  url: string;
  createdAt: string;
  scopeType: MediaScopeType;
  scopeId: number | null;
}

export interface MediaListResponse {
  page: number;
  pageSize: number;
  total: number;
  items: MediaItem[];
}

export interface MediaListParams {
  scopeType: MediaScopeType;
  scopeId?: number | null;
  includeGlobal?: boolean;
  page?: number;
  pageSize?: number;
}
