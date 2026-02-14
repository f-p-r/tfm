/**
 * Modelo de datos para Asociaciones.
 */

export interface Association {
  id: number;
  name: string;
  shortname?: string;
  slug: string;
  description?: string;
  country_id?: string;
  region_id?: string;
  web?: string;
  disabled: boolean;
  management?: boolean;
  owner_id?: number;
  games?: Array<{
    id: number;
    name: string;
    slug: string;
    disabled: boolean;
    team_size?: number;
  }>;
  country?: {
    id: string;
    name: string;
  };
  region?: {
    id: string;
    name: string;
  };
  owner?: {
    id: number;
    username: string;
    name: string;
    email: string;
  };
  created_at?: string;
  updated_at?: string;
}
