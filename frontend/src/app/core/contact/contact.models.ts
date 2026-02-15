/**
 * Modelos TypeScript para el sistema de información de contacto.
 */

import { ContactType, ContactCategory } from './contact.constants';

/**
 * Información de contacto completa (desde API).
 */
export interface ContactInfo {
  id: number;
  owner_type: number;
  owner_id: number | null;
  contact_type: ContactType;
  value: string;
  category: ContactCategory | null;
  category_label: string | null;
  label: string | null;
  order: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * DTO para crear un nuevo contacto.
 */
export interface CreateContactInfo {
  owner_type: number;
  owner_id: number | null;
  contact_type: ContactType;
  value: string;
  category?: ContactCategory | null;
  label?: string | null;
  order?: number;
  is_public?: boolean;
}

/**
 * DTO para actualizar un contacto existente.
 */
export interface UpdateContactInfo {
  contact_type?: ContactType;
  value?: string;
  category?: ContactCategory | null;
  label?: string | null;
  order?: number;
  is_public?: boolean;
}

/**
 * Respuesta de error de la API.
 */
export interface ContactInfoErrorResponse {
  errors: true;
  errorsList: Record<string, string>;
}

/**
 * Parámetros de consulta para listar contactos.
 */
export interface ContactInfoQueryParams {
  owner_type?: number;
  owner_id?: number;
  contact_type?: ContactType;
  category?: ContactCategory;
  include_private?: boolean;
}

/**
 * Contactos agrupados por categoría (para vista pública).
 */
export interface GroupedContacts {
  category: ContactCategory | 'general';
  label: string;
  items: ContactInfo[];
}
