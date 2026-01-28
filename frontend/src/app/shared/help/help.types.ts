/**
 * Tipos para el sistema de ayuda contextual (Help Packs)
 *
 * Este sistema permite centralizar los textos de ayuda en "paquetes"
 * en lugar de tenerlos hardcodeados en cada componente.
 */

/**
 * Item individual de ayuda con título y texto descriptivo
 */
export interface HelpItem {
  title: string;
  text: string;
}

/**
 * Sección dentro de una pantalla de ayuda
 */
export interface HelpScreenSection {
  title: string;
  items: string[];
}

/**
 * Pantalla completa de ayuda con título, introducción y secciones
 */
export interface HelpScreen {
  title: string;
  intro?: string;
  sections?: HelpScreenSection[];
}

/**
 * Paquete de ayuda completo que incluye:
 * - screen: información de pantalla de ayuda (opcional)
 * - items: diccionario de items de ayuda indexados por key
 */
export interface HelpPack {
  screen?: HelpScreen;
  items: Record<string, HelpItem>;
}
