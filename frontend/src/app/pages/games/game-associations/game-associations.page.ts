import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { GamesStore } from '../../../core/games/games.store';
import { slugify } from '../../../shared/utils/slugify';

@Component({
  selector: 'app-game-associations-page',
  imports: [NavbarComponent],
  templateUrl: './game-associations.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameAssociationsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly gamesStore = inject(GamesStore);

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
