/**
 * Servicio para gestionar las preferencias del sistema de ayuda.
 *
 * Controla la visibilidad de los iconos de ayuda (ⓘ) en toda la aplicación:
 * - Persiste el estado en localStorage
 * - Sincroniza la clase CSS 'help-icons-on' en el <body>
 * - Expone un Observable para reactividad
 *
 * La preferencia se guarda como "1" (activado) o "0" (desactivado).
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HelpPrefsService {
  private readonly STORAGE_KEY = 'helpIconsOn';
  readonly helpIconsOn$ = new BehaviorSubject<boolean>(false);

  constructor() {
    const storedValue = localStorage.getItem(this.STORAGE_KEY);
    const initialValue = storedValue === '1';
    this.helpIconsOn$.next(initialValue);

    if (typeof document !== 'undefined') {
      document.body.classList.toggle('help-icons-on', initialValue);
    }
  }

  setHelpIconsOn(on: boolean): void {
    this.helpIconsOn$.next(on);
    localStorage.setItem(this.STORAGE_KEY, on ? '1' : '0');

    if (typeof document !== 'undefined') {
      document.body.classList.toggle('help-icons-on', on);
    }
  }

  toggleHelpIcons(): void {
    const currentValue = this.helpIconsOn$.value;
    this.setHelpIconsOn(!currentValue);
  }
}
