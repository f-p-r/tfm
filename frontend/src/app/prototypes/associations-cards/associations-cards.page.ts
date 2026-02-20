import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';

interface AssociationCard {
  id: number;
  name: string;
  slug: string;
  region?: string;
  country: string;
  description: string;
  homePage?: string;
  externalWeb?: string;
  userStatus?: 1 | 2 | 3; // 1: solicitud, 2: aprobado, 3: otro
}

@Component({
  selector: 'app-associations-cards-prototype',
  imports: [CommonModule, RouterLink, NavbarComponent],
  template: `
    <app-navbar />
    <div class="ds-page">
      <div class="ds-container pt-6">
        <p class="text-sm text-neutral-medium mb-4">Prototipo de visualización de listas de asociaciones</p>
        <h1 class="h1 mb-6">Asociaciones de Mus</h1>

        <!-- Mis asociaciones -->
        @if (myAssociations().length > 0) {
          <section class="mb-8">
            <h3 class="h3 mb-4">Mis asociaciones</h3>
            <div class="ds-cards-container">
              @for (assoc of myAssociations(); track assoc.id) {
                <article class="ds-card">
                  <div class="bg-brand-primary px-4 sm:px-6 py-3 -m-4 sm:-m-6 mb-4 sm:mb-6 rounded-t-lg">
                    <a [routerLink]="['/asociaciones', assoc.slug]" class="text-lg sm:text-xl font-semibold text-neutral-light hover:text-brand-secondary transition-colors">
                      {{ assoc.name }}
                    </a>
                  </div>
                  <div class="ds-card-body">
                    <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span class="ds-card-label">Ámbito:</span>
                      <span class="ds-card-text">
                        @if (assoc.region) {
                          {{ assoc.region }}, {{ assoc.country }}
                        } @else {
                          {{ assoc.country }}
                        }
                      </span>
                      @if (assoc.externalWeb) {
                        <span class="ds-card-text text-neutral-medium">•</span>
                        <a [href]="assoc.externalWeb" target="_blank" rel="noopener" class="ds-card-link">
                          Web externa ↗
                        </a>
                      }
                    </div>
                    <div class="ds-card-section">
                      <p class="ds-card-text">{{ assoc.description }}</p>
                    </div>
                    @if (assoc.userStatus === 1) {
                      <div class="mt-2">
                        <span class="ds-badge ds-badge-request">Ingreso solicitado</span>
                      </div>
                    }
                  </div>
                </article>
              }
            </div>
          </section>

          <div class="ds-section-separator"></div>
        }

        <!-- Otras asociaciones -->
        <section>
          @if (myAssociations().length > 0) {
            <h3 class="h3 mb-4">Otras asociaciones</h3>
          }
          <div class="ds-cards-container">
            @for (assoc of otherAssociations(); track assoc.id) {
              <article class="ds-card">
                <div class="bg-brand-primary px-4 sm:px-6 py-3 -m-4 sm:-m-6 mb-4 sm:mb-6 rounded-t-lg">
                  <a [routerLink]="['/asociaciones', assoc.slug]" class="text-lg sm:text-xl font-semibold text-neutral-light hover:text-brand-secondary transition-colors">
                    {{ assoc.name }}
                  </a>
                </div>
                <div class="ds-card-body">
                  <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span class="ds-card-label">Ámbito:</span>
                    <span class="ds-card-text">
                      @if (assoc.region) {
                        {{ assoc.region }}, {{ assoc.country }}
                      } @else {
                        {{ assoc.country }}
                      }
                    </span>
                    @if (assoc.externalWeb) {
                      <span class="ds-card-text text-neutral-medium">•</span>
                      <a [href]="assoc.externalWeb" target="_blank" rel="noopener" class="ds-card-link">
                        Web externa ↗
                      </a>
                    }
                  </div>
                  <div class="ds-card-section">
                    <p class="ds-card-text">{{ assoc.description }}</p>
                  </div>
                </div>
              </article>
            }
          </div>
        </section>
      </div>
    </div>
  `,
})
export class AssociationsCardsPrototypePage {
  // Asociaciones del usuario (2: una aprobada, una con solicitud pendiente)
  readonly myAssociations = signal<AssociationCard[]>([
    {
      id: 1,
      name: 'Club de Mus La Baraja',
      slug: 'club-mus-baraja',
      region: 'Navarra',
      country: 'España',
      description: 'Club centenario dedicado a la promoción y práctica del mus tradicional navarro. Organizamos torneos mensuales y campeonatos regionales.',
      homePage: 'inicio',
      userStatus: 2
    },
    {
      id: 2,
      name: 'Asociación Cultural El Naipe',
      slug: 'naipe-cultural',
      country: 'España',
      description: 'Asociación enfocada en la difusión de juegos de naipes tradicionales y su valor cultural en la sociedad contemporánea.',
      externalWeb: 'https://ejemplo.com/naipe',
      userStatus: 1
    }
  ]);

  // Otras asociaciones (10 para generar scroll)
  readonly otherAssociations = signal<AssociationCard[]>([
    {
      id: 3,
      name: 'Federación Vasca de Mus',
      slug: 'federacion-vasca-mus',
      region: 'País Vasco',
      country: 'España',
      description: 'Entidad que agrupa a todos los clubes de mus del País Vasco, coordinando competiciones y eventos de ámbito autonómico.',
      homePage: 'bienvenida',
    },
    {
      id: 4,
      name: 'Peña Musera de Pamplona',
      slug: 'pena-musera-pamplona',
      region: 'Navarra',
      country: 'España',
      description: 'Grupo de aficionados que se reúne semanalmente para disfrutar del mus en un ambiente distendido y familiar.',
    },
    {
      id: 5,
      name: 'Club Mus Riojano',
      slug: 'club-mus-riojano',
      region: 'La Rioja',
      country: 'España',
      description: 'Asociación con más de 200 socios activos que organiza el campeonato de mus más antiguo de la comunidad, celebrado desde 1975.',
      externalWeb: 'https://ejemplo.com/rioja-mus',
    },
    {
      id: 6,
      name: 'Mus Santander',
      slug: 'mus-santander',
      region: 'Cantabria',
      country: 'España',
      description: 'Club ubicado en el centro de Santander que promueve el mus entre jóvenes mediante programas educativos y torneos escolares.',
    },
    {
      id: 7,
      name: 'Asociación Internacional de Mus',
      slug: 'internacional-mus',
      country: 'Internacional',
      description: 'Organización global que coordina eventos internacionales de mus, estableciendo reglamentos unificados y promoviendo el juego en todos los continentes.',
      homePage: 'inicio',
      externalWeb: 'https://ejemplo.com/international-mus',
    },
    {
      id: 8,
      name: 'Círculo Musero de Madrid',
      slug: 'circulo-musero-madrid',
      region: 'Madrid',
      country: 'España',
      description: 'Prestigioso club con sede en el barrio de Chamberí que ofrece clases magistrales de mus impartidas por campeones nacionales.',
      homePage: 'portada',
    },
    {
      id: 9,
      name: 'Mus Burgalés',
      slug: 'mus-burgales',
      region: 'Castilla y León',
      country: 'España',
      description: 'Asociación que preserva las variantes tradicionales del mus burgalés, organizando encuentros de veteranos y actividades de memoria histórica.',
    },
    {
      id: 10,
      name: 'Museros de Zaragoza',
      slug: 'museros-zaragoza',
      region: 'Aragón',
      country: 'España',
      description: 'Comunidad activa de jugadores que promueve torneos benéficos, destinando los fondos recaudados a causas sociales de la ciudad.',
      externalWeb: 'https://ejemplo.com/zaragoza-mus',
    },
    {
      id: 11,
      name: 'Peña El Órdago',
      slug: 'pena-ordago',
      region: 'Guipúzcoa',
      country: 'España',
      description: 'Grupo tradicional que mantiene vivas las costumbres del mus vasco, organizando partidas nocturnas todos los viernes en su sede histórica.',
      homePage: 'principal',
    },
    {
      id: 12,
      name: 'Club Universitario de Mus',
      slug: 'universitario-mus',
      region: 'Valladolid',
      country: 'España',
      description: 'Asociación estudiantil que introduce el mus a nuevas generaciones mediante competiciones universitarias interregionales.',
    },
  ]);
}
