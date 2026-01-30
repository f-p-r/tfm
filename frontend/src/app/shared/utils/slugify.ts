/**
 * Convierte un texto a formato slug compatible con URLs.
 *
 * Proceso de normalización:
 * - Elimina acentos y diacríticos (ñ, á, ü, etc.)
 * - Convierte a minúsculas
 * - Reemplaza espacios por guiones
 * - Elimina caracteres no alfanuméricos excepto guiones
 * - Colapsa múltiples guiones consecutivos en uno solo
 * - Elimina guiones al inicio y final
 * - Limita la longitud máxima a 64 caracteres
 *
 * Ejemplos:
 * - "Siete y medio" → "siete-y-medio"
 * - "Guiñote" → "guinote"
 * - "Póker Texas Hold'em" → "poker-texas-hold-em"
 *
 * @param text Texto a convertir en slug.
 * @returns Slug generado (max 64 caracteres).
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD') // Descompone caracteres con acentos en base + diacrítico
    .replace(/\p{Diacritic}/gu, '') // Elimina diacríticos (acentos, tildes, diéresis)
    .toLowerCase() // Convierte a minúsculas
    .trim() // Elimina espacios al inicio y final
    .replace(/\s+/g, '-') // Reemplaza espacios por guiones
    .replace(/[^a-z0-9-]/g, '') // Elimina caracteres no permitidos
    .replace(/-+/g, '-') // Colapsa múltiples guiones en uno
    .replace(/^-|-$/g, '') // Elimina guiones al inicio/final
    .substring(0, 64); // Limita a 64 caracteres
}
