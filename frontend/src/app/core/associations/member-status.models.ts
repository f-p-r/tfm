/**
 * Modelos para estados de miembros de asociaciones
 */

export interface AssociationMemberStatus {
  id: number;
  association_id: number;
  type: number;
  order: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  association?: {
    id: number;
    name: string;
    slug: string;
  };
  status_type?: {
    id: number;
    name: string;
  };
}

export interface AssociationMemberStatusCreateData {
  association_id: number;
  type: number;
  order: number;
  name: string;
  description?: string | null;
}

export interface AssociationMemberStatusUpdateData {
  association_id?: number;
  type?: number;
  order?: number;
  name?: string;
  description?: string | null;
}

export interface AssociationMemberStatusResponse {
  errors: boolean;
  data?: AssociationMemberStatus;
  errorsList?: Record<string, string>;
}

export interface AssociationMemberStatusListResponse {
  errors: boolean;
  data?: AssociationMemberStatus[];
  errorsList?: Record<string, string>;
}
