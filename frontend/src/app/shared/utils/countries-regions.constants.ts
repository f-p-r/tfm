/**
 * Constantes de países y regiones.
 * Contiene los catálogos de países y regiones disponibles en el sistema.
 */

export interface Country {
  id: string;
  name: string;
}

export interface Region {
  id: string;
  name: string;
  countryId: string;
}

/**
 * Catálogo de países disponibles.
 */
export const COUNTRIES: Country[] = [
  { id: 'ES', name: 'España' }
];

/**
 * Catálogo de regiones disponibles.
 */
export const REGIONS: Region[] = [
  { id: 'ES-AN', name: 'Andalucía', countryId: 'ES' },
  { id: 'ES-AR', name: 'Aragón', countryId: 'ES' },
  { id: 'ES-AS', name: 'Asturias', countryId: 'ES' },
  { id: 'ES-IB', name: 'Baleares', countryId: 'ES' },
  { id: 'ES-CN', name: 'Canarias', countryId: 'ES' },
  { id: 'ES-CB', name: 'Cantabria', countryId: 'ES' },
  { id: 'ES-CL', name: 'Castilla y León', countryId: 'ES' },
  { id: 'ES-CM', name: 'Castilla-La Mancha', countryId: 'ES' },
  { id: 'ES-CT', name: 'Cataluña', countryId: 'ES' },
  { id: 'ES-VC', name: 'Comunitat Valenciana', countryId: 'ES' },
  { id: 'ES-EX', name: 'Extremadura', countryId: 'ES' },
  { id: 'ES-GA', name: 'Galicia', countryId: 'ES' },
  { id: 'ES-MD', name: 'Madrid', countryId: 'ES' },
  { id: 'ES-MC', name: 'Murcia', countryId: 'ES' },
  { id: 'ES-NC', name: 'Navarra', countryId: 'ES' },
  { id: 'ES-PV', name: 'País Vasco', countryId: 'ES' },
  { id: 'ES-RI', name: 'La Rioja', countryId: 'ES' },
  { id: 'ES-CE', name: 'Ceuta', countryId: 'ES' },
  { id: 'ES-ML', name: 'Melilla', countryId: 'ES' }
];

/**
 * Obtiene el nombre de un país por su ID.
 */
export function getCountryName(countryId: string | undefined | null): string | null {
  if (!countryId) return null;
  return COUNTRIES.find(c => c.id === countryId)?.name || null;
}

/**
 * Obtiene el nombre de una región por su ID.
 */
export function getRegionName(regionId: string | undefined | null): string | null {
  if (!regionId) return null;
  return REGIONS.find(r => r.id === regionId)?.name || null;
}

/**
 * Obtiene las regiones de un país específico.
 */
export function getRegionsByCountry(countryId: string | undefined | null): Region[] {
  if (!countryId) return [];
  return REGIONS.filter(r => r.countryId === countryId);
}
