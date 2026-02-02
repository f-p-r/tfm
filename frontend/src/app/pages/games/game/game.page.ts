import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { GamesStore } from '../../../core/games/games.store';
import { ContextStore } from '../../../core/context/context.store';
import { WebScope } from '../../../core/web-scope.constants';
import { slugify } from '../../../shared/utils/slugify';

@Component({
  selector: 'app-game-page',
  templateUrl: './game.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamePage {
  private readonly route = inject(ActivatedRoute);
  private readonly gamesStore = inject(GamesStore);
  readonly contextStore = inject(ContextStore);

  // Exponer WebScope para el template
  readonly WebScope = WebScope;

  // Leer slug de la ruta
  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => slugify(params.get('slug') ?? ''))),
    { initialValue: '' }
  );

  // Obtener el juego desde el store usando el slug
  readonly game = computed(() => {
    const currentSlug = this.slug();
    return currentSlug ? this.gamesStore.getBySlug(currentSlug) : undefined;
  });

  // Nombre para mostrar en el navbar
  readonly gameName = computed(() => this.game()?.name ?? 'Juego');
}
