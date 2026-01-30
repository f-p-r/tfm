import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { AssociationsResolveService } from '../../../core/associations/associations-resolve.service';
import { Association } from '../../../core/associations/associations.models';

/**
 * Página de detalle de una asociación (placeholder).
 *
 * Scope: ASSOCIATION
 * Muestra el nombre real de la asociación resolviendo el slug.
 */
@Component({
  selector: 'app-association-page',
  imports: [NavbarComponent],
  template: `
    <app-navbar />
    <main class="ds-main">
      <div class="ds-page">
        <div class="ds-container">
          @if (association(); as assoc) {
            <h1>{{ assoc.name }}</h1>
            <p>Slug: {{ assoc.slug }}</p>
            <p>ID: {{ assoc.id }}</p>
            @if (assoc.games && assoc.games.length > 0) {
              <p>Juegos asociados: {{ assoc.games.length }}</p>
            }
          } @else {
            <p>Cargando asociación...</p>
          }
        </div>
      </div>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationPage {
  private readonly route = inject(ActivatedRoute);
  private readonly resolveService = inject(AssociationsResolveService);

  readonly association = signal<Association | null>(null);

  constructor() {
    // Leer slug de la ruta y resolver asociación
    const slug = this.route.snapshot.paramMap.get('slug');

    if (slug) {
      // El guard ya habrá verificado que existe, pero reutilizamos el servicio
      // (normalmente estará en caché y no hará petición HTTP)
      this.resolveService
        .resolveBySlug(slug)
        .pipe(takeUntilDestroyed())
        .subscribe({
          next: (assoc) => this.association.set(assoc),
          error: () => {
            // En teoría no debería llegar aquí (el guard ya validó),
            // pero por seguridad no hacemos nada (el guard redirige)
          },
        });
    }
  }
}
