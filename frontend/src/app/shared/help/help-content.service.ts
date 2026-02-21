import { Injectable, signal } from '@angular/core';
import { HelpPack, HelpItem } from './help.types';

/**
 * Servicio para gestionar paquetes de ayuda contextual.
 *
 * Soporta múltiples packs activos simultáneamente (uno por componente en pantalla).
 * El pool se almacena en un signal para que los computed() de las directivas
 * reaccionen automáticamente cuando cambie el pack activo.
 *
 * Uso:
 *   - setPack()    → página raíz: limpia el pool y añade el pack base.
 *   - mergePack()  → componentes hijos: añade su pack sin borrar los existentes.
 *   - removePack() → ngOnDestroy del componente hijo que llamó a mergePack().
 */
@Injectable({
  providedIn: 'root',
})
export class HelpContentService {
  /** Pool de packs activos. Signal para que computed() en directivas reaccione. */
  private readonly packs = signal<HelpPack[]>([]);

  /**
   * Establece el pack base de la página, descartando todos los packs anteriores.
   * Llamar en el constructor de la página/ruta raíz.
   */
  setPack(pack: HelpPack | null): void {
    this.packs.set(pack ? [pack] : []);
  }

  /**
   * Añade un pack al pool sin borrar los existentes.
   * Los items de este pack tienen prioridad sobre los registrados antes.
   * Llamar en el constructor del componente hijo.
   */
  mergePack(pack: HelpPack): void {
    this.packs.update(current => [...current, pack]);
  }

  /**
   * Elimina un pack del pool por referencia de objeto.
   * Llamar en ngOnDestroy del componente que llamó a mergePack().
   */
  removePack(pack: HelpPack): void {
    this.packs.update(current => current.filter(p => p !== pack));
  }

  /**
   * Obtiene un item de ayuda por su key.
   * Recorre el pool en orden inverso (el último pack añadido tiene prioridad).
   * @param packOverride - Pack alternativo a usar en lugar del pool (retrocompatible)
   */
  getItem(key: string, packOverride?: HelpPack): HelpItem | null {
    if (packOverride) return packOverride.items[key] ?? null;
    const pool = this.packs();
    for (let i = pool.length - 1; i >= 0; i--) {
      const item = pool[i].items[key];
      if (item) return item;
    }
    return null;
  }

  /**
   * Devuelve el pack base (el primero del pool, establecido por setPack).
   * Útil para que el panel de ayuda muestre la sección screen de la pantalla actual.
   */
  getBasePack(): HelpPack | null {
    const pool = this.packs();
    return pool.length > 0 ? pool[0] : null;
  }
}
