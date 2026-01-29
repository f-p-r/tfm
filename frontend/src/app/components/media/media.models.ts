export interface MediaItem {
  id: number;
  url: string;
  createdAt: string;
  scopeType: number;
  scopeId: number | null;
}

export interface MediaListResponse {
  page: number;
  pageSize: number;
  total: number;
  items: MediaItem[];
}

export interface MediaListParams {
  scopeType: number;
  scopeId?: number | null;
  includeGlobal?: boolean;
  page?: number;
  pageSize?: number;
}
