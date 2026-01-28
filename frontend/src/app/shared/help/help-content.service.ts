import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HelpPack, HelpItem } from './help.types';

/**
 * Servicio repositorio para gestionar paquetes de ayuda contextual.
 * Permite establecer un pack activo y resolver items de ayuda por key.
 */
@Injectable({
  providedIn: 'root',
})
export class HelpContentService {
  private readonly packSubject = new BehaviorSubject<HelpPack | null>(null);

  /**
   * Observable del pack de ayuda actual
   */
  readonly pack$: Observable<HelpPack | null> = this.packSubject.asObservable();

  /**
   * Establece el pack de ayuda actual
   * @param pack - Pack de ayuda a establecer, o null para limpiar
   */
  setPack(pack: HelpPack | null): void {
    this.packSubject.next(pack);
  }

  /**
   * Obtiene un item de ayuda por su key
   * @param key - Key del item de ayuda
   * @param packOverride - Pack alternativo a usar en lugar del actual (opcional)
   * @returns El item de ayuda si existe, o null si no se encuentra
   */
  getItem(key: string, packOverride?: HelpPack): HelpItem | null {
    const pack = packOverride ?? this.packSubject.value;
    if (!pack) return null;
    return pack.items[key] ?? null;
  }
}
