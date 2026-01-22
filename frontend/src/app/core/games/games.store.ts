import { inject, Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GamesStore {
  readonly games = signal<string[]>([]);
  readonly loaded = signal(false);
  readonly selectedGame = signal<string | null>(null);

  readonly sortedGames = computed(() => {
    const list = this.games();
    return [...list].sort((a, b) => a.localeCompare(b));
  });

  loadOnce(): void {
    if (this.loaded()) return;
    const fixed = [
      'Brisca',
      'Mus',
      'Guiñote',
      'Cinquillo',
      'Escoba',
      'Burro',
      'Siete y medio',
    ];
    // Ensure sorted
    this.games.set([...fixed].sort((a, b) => a.localeCompare(b)));
    this.loaded.set(true);
  }

  setSelected(name: string | null): void {
    this.selectedGame.set(name);
  }

  slugify(name: string): string {
    return name
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
}
