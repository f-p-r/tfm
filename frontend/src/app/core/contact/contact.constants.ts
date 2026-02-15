/**
 * Constantes para el sistema de información de contacto.
 *
 * Define tipos de contacto, categorías, límites y configuración de URLs.
 */

import { WebScope } from '../web-scope.constants';

/** Tipos de propietario de contacto */
export const CONTACT_OWNER_TYPES = {
  GLOBAL: 1,
  ASSOCIATION: 2,
  GAME: 3,
} as const;

/** Categorías de contacto (solo para email, phone, whatsapp) */
export const CONTACT_CATEGORIES = {
  general: 'Información general',
  support: 'Soporte / Incidencias',
  membership: 'Membresía / Inscripciones',
  events: 'Eventos / Torneos',
  press: 'Prensa / Comunicación',
  admin: 'Administración / Gestión',
  other: 'Otro',
} as const;

export type ContactCategory = keyof typeof CONTACT_CATEGORIES;

/** Tipos de contacto disponibles */
export const CONTACT_TYPES = {
  // Básicos (requieren categoría)
  email: {
    label: 'Email',
    icon: 'envelope',
    iconType: 'heroicon' as const,
    urlPattern: 'mailto:',
    requiresCategory: true,
    maxLimit: -1, // Ilimitado
    placeholder: 'correo@ejemplo.com',
    validationPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  phone: {
    label: 'Teléfono',
    icon: 'phone',
    iconType: 'heroicon' as const,
    urlPattern: 'tel:',
    requiresCategory: true,
    maxLimit: 2,
    placeholder: '+34 912 345 678',
    validationPattern: /^\+?[0-9\s\-\(\)]+$/,
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: 'whatsapp',
    iconType: 'social' as const,
    urlPattern: 'https://wa.me/',
    requiresCategory: true,
    maxLimit: -1, // Ilimitado
    placeholder: '+34666555444',
    validationPattern: /^\+?[0-9\s\-\(\)]+$/,
  },

  // Redes sociales (no requieren categoría, límite 1)
  facebook: {
    label: 'Facebook',
    icon: 'facebook',
    iconType: 'social' as const,
    urlPattern: 'https://facebook.com/',
    requiresCategory: false,
    maxLimit: 1,
    placeholder: 'https://facebook.com/usuario o @usuario',
    validationPattern: null,
  },
  instagram: {
    label: 'Instagram',
    icon: 'instagram',
    iconType: 'social' as const,
    urlPattern: 'https://instagram.com/',
    requiresCategory: false,
    maxLimit: 1,
    placeholder: 'https://instagram.com/usuario o @usuario',
    validationPattern: null,
  },
  twitter: {
    label: 'X / Twitter',
    icon: 'twitter',
    iconType: 'social' as const,
    urlPattern: 'https://twitter.com/',
    requiresCategory: false,
    maxLimit: 1,
    placeholder: 'https://twitter.com/usuario o @usuario',
    validationPattern: null,
  },
  discord: {
    label: 'Discord',
    icon: 'discord',
    iconType: 'social' as const,
    urlPattern: 'https://discord.gg/',
    requiresCategory: false,
    maxLimit: 1,
    placeholder: 'https://discord.gg/codigo o codigo',
    validationPattern: null,
  },
  telegram: {
    label: 'Telegram',
    icon: 'telegram',
    iconType: 'social' as const,
    urlPattern: 'https://t.me/',
    requiresCategory: false,
    maxLimit: 1,
    placeholder: 'https://t.me/usuario o @usuario',
    validationPattern: null,
  },
  youtube: {
    label: 'YouTube',
    icon: 'youtube',
    iconType: 'social' as const,
    urlPattern: 'https://youtube.com/',
    requiresCategory: false,
    maxLimit: 1,
    placeholder: 'https://youtube.com/@canal',
    validationPattern: null,
  },
  twitch: {
    label: 'Twitch',
    icon: 'twitch',
    iconType: 'social' as const,
    urlPattern: 'https://twitch.tv/',
    requiresCategory: false,
    maxLimit: 1,
    placeholder: 'https://twitch.tv/canal o canal',
    validationPattern: null,
  },
  linkedin: {
    label: 'LinkedIn',
    icon: 'linkedin',
    iconType: 'social' as const,
    urlPattern: 'https://linkedin.com/',
    requiresCategory: false,
    maxLimit: 1,
    placeholder: 'https://linkedin.com/in/usuario',
    validationPattern: null,
  },
  tiktok: {
    label: 'TikTok',
    icon: 'tiktok',
    iconType: 'social' as const,
    urlPattern: 'https://tiktok.com/@',
    requiresCategory: false,
    maxLimit: 1,
    placeholder: 'https://tiktok.com/@usuario o @usuario',
    validationPattern: null,
  },

  // Otros
  web: {
    label: 'Sitio web',
    icon: 'globe-alt',
    iconType: 'heroicon' as const,
    urlPattern: 'https://',
    requiresCategory: false,
    maxLimit: 2,
    placeholder: 'https://www.ejemplo.com',
    validationPattern: null,
  },
  address: {
    label: 'Dirección física',
    icon: 'map-pin',
    iconType: 'heroicon' as const,
    urlPattern: null, // No tiene link
    requiresCategory: false,
    maxLimit: 1,
    placeholder: 'Calle Principal 123, Madrid',
    validationPattern: null,
  },
} as const;

export type ContactType = keyof typeof CONTACT_TYPES;

/**
 * Genera la URL de acción para un contacto según su tipo.
 *
 * @param type Tipo de contacto
 * @param value Valor del contacto
 * @returns URL completa o null si no aplica
 */
export function buildContactUrl(type: ContactType, value: string): string | null {
  const config = CONTACT_TYPES[type];

  if (!config.urlPattern) {
    return null; // address no tiene link
  }

  // Para WhatsApp, limpiar el valor (quitar espacios, guiones, paréntesis)
  if (type === 'whatsapp') {
    const cleanValue = value.replace(/[\s\-\(\)]/g, '');
    return `${config.urlPattern}${cleanValue}`;
  }

  // Para redes sociales, si ya es URL completa, devolver tal cual
  if (config.iconType === 'social' && value.startsWith('http')) {
    return value;
  }

  // Para handles que empiezan con @, quitarlo
  if (value.startsWith('@')) {
    value = value.substring(1);
  }

  // Si ya empieza con el pattern (ej: facebook.com/...), no duplicar
  if (value.includes(config.urlPattern.replace('https://', ''))) {
    return value.startsWith('http') ? value : `https://${value}`;
  }

  // Construir URL completa
  return `${config.urlPattern}${value}`;
}

/**
 * Obtiene el texto del botón de acción para un tipo de contacto.
 */
export function getContactActionLabel(type: ContactType): string {
  const actions: Record<ContactType, string> = {
    email: 'Enviar email',
    phone: 'Llamar',
    whatsapp: 'Abrir WhatsApp',
    facebook: 'Ver Facebook',
    instagram: 'Ver Instagram',
    twitter: 'Ver Twitter',
    discord: 'Unirse a Discord',
    telegram: 'Abrir Telegram',
    youtube: 'Ver YouTube',
    twitch: 'Ver Twitch',
    linkedin: 'Ver LinkedIn',
    tiktok: 'Ver TikTok',
    web: 'Visitar sitio',
    address: '',
  };

  return actions[type];
}

/**
 * Rangos de orden sugeridos para organizar contactos.
 */
export const ORDER_RANGES = {
  emailsAndWhatsapp: { min: 0, max: 99 },
  phones: { min: 100, max: 199 },
  socialMedia: { min: 200, max: 299 },
  websites: { min: 300, max: 399 },
  others: { min: 400, max: 499 },
} as const;

/**
 * Obtiene un orden por defecto sugerido para un tipo de contacto.
 */
export function getSuggestedOrder(type: ContactType): number {
  if (type === 'email' || type === 'whatsapp') return ORDER_RANGES.emailsAndWhatsapp.min;
  if (type === 'phone') return ORDER_RANGES.phones.min;
  if (type === 'web') return ORDER_RANGES.websites.min;
  if (type === 'address') return ORDER_RANGES.others.min;
  // Redes sociales
  return ORDER_RANGES.socialMedia.min;
}
