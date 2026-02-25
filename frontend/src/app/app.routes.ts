import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { LoginPage } from './pages/login/login.page';
import { RegistroPage } from './pages/registro/registro.page';
import { PerfilPage } from './pages/perfil/perfil.page';
import { AuthCallbackPage } from './pages/auth-callback/auth-callback.page';
import { StyleguidePage } from './styleguide/styleguide.page';
import { PrototypeHostPage } from './prototypes/prototype-host.page';
import { GamePage } from './pages/games/game/game.page';
import { GameAssociationsPage } from './pages/games/game-associations/game-associations.page';
import { gameBySlugGuard } from './guards/game-by-slug.guard';
import { AssociationsPage } from './pages/associations/associations.page';
import { AssociationPage } from './pages/associations/association/association.page';
import { AssociationMembersPage } from './pages/associations/association-members/association-members.page';
import { AssociationContactPage } from './pages/associations/association-contact/association-contact.page';
import { associationBySlugGuard } from './guards/association-by-slug.guard';
import { ContactPage } from './pages/contact/contact.page';
import { OwnerPagesAdminPage } from './pages/admin/pages/owner-pages/owner-pages-admin.page';
import { PageFormAdminPage } from './pages/admin/pages/owner-pages/page-form-admin.page';
import { PagePreviewPage } from './pages/admin/pages/owner-pages/page-preview.page';
import { PageViewerPage } from './pages/page-viewer/page-viewer.page';
import { PageEntityResolver } from './core/pages/page-entity.resolver';
import { AdminPage } from './pages/admin/admin.page';
import { AdminGamesPage } from './pages/admin/admin-games.page';
import { AdminAssociationsPage } from './pages/admin/admin-associations.page';
import { AdminUsersPage } from './pages/admin/admin-users.page';
import { AdminMemberStatusesPage } from './pages/admin/admin-member-statuses.page';
import { AdminContactPage } from './pages/admin/admin-contact.page';
import { AdminAssociationGamesPage } from './pages/admin/associations/admin-association-games.page';
import { AdminAssociationMembersPage } from './pages/admin/admin-association-members.page';
import { requirePermission, requireAnyPermission } from './guards/permission.guard';
import { requireAuth } from './guards/auth.guard';
import { resolveScopeGuard } from './guards/resolve-scope.guard';
import { NewsFormAdminPage } from './pages/admin/news/news-form-admin.page';
import { NewsListAdminPage } from './pages/admin/news/news-list-admin.page';
import { EventsListAdminPage } from './pages/admin/events/events-list-admin.page';
import { EventsFormAdminPage } from './pages/admin/events/events-form-admin.page';
import { EventAttendeesAdminPage } from './pages/admin/events/event-attendees-admin.page';
import { NewsListPage } from './pages/news/news-list.page';
import { NewsDetailPage } from './pages/news/news-detail.page';
import { EventsListPage } from './pages/events/events-list.page';
import { EventDetailPage } from './pages/events/event-detail.page';
import { PERM } from './core/authz/permissions.constants';

export const routes: Routes = [
  // Rutas del visor de páginas públicas (deben ir antes que las rutas de administración)
  { path: '', pathMatch: 'full', component: PageViewerPage, canActivate: [resolveScopeGuard] },
  { path: 'paginas/:slug', component: PageViewerPage, canActivate: [resolveScopeGuard], resolve: { entity: PageEntityResolver }},
  { path: 'login', component: LoginPage, canActivate: [resolveScopeGuard] },
  { path: 'registro', component: RegistroPage, canActivate: [resolveScopeGuard] },
  { path: 'auth/callback', component: AuthCallbackPage, canActivate: [resolveScopeGuard] },
  { path: 'styleguide', component: StyleguidePage, canActivate: [resolveScopeGuard] },

  // Perfil de usuario
  { path: 'perfil', component: PerfilPage, canActivate: [resolveScopeGuard, requireAuth] },

  // Página de contacto
  { path: 'contacto', component: ContactPage, canActivate: [resolveScopeGuard] },

  // Ruta de juegos con páginas
  { path: 'juegos/:slug', component: PageViewerPage, canActivate: [gameBySlugGuard] },
  { path: 'juegos/:slug/asociaciones', component: GameAssociationsPage, canActivate: [gameBySlugGuard] },
  { path: 'juegos/:slug/:pagina', component: PageViewerPage, canActivate: [gameBySlugGuard], resolve:{ entity: PageEntityResolver } },

  // Noticias públicas
  { path: 'noticias', component: NewsListPage, canActivate: [resolveScopeGuard] },
  { path: 'noticias/:id/:slug', component: NewsDetailPage, canActivate: [resolveScopeGuard] },

  // Eventos públicos
  { path: 'eventos', component: EventsListPage, canActivate: [resolveScopeGuard] },
  { path: 'eventos/:id/:slug', component: EventDetailPage, canActivate: [resolveScopeGuard] },

  // Rutas de asociaciones con páginas
  { path: 'asociaciones', component: AssociationsPage, canActivate: [resolveScopeGuard] },
  { path: 'asociaciones/:slug', component: PageViewerPage, canActivate: [associationBySlugGuard] },
  { path: 'asociaciones/:slug/socios', component: AssociationMembersPage, canActivate: [associationBySlugGuard, requireAuth] },
  { path: 'asociaciones/:slug/contacto', component: AssociationContactPage, canActivate: [associationBySlugGuard] },
  { path: 'asociaciones/:slug/:pagina', component: PageViewerPage, canActivate: [associationBySlugGuard], resolve:{ entity: PageEntityResolver } },
  {
    path: 'prototypes',
    children: [
      { path: '', component: PrototypeHostPage },

      {
        // Prototipo contentSegmentsDemo: esqueleto mínimo
        path: 'content-segments-demo',
        loadComponent: () =>
          import('./prototypes/content-segments-demo/content-segments-demo.page').then(
            (m) => m.ContentSegmentsDemoPage,
          ),
      },
      {
        // Prototipo contentSegmentsEditor: editor mínimo
        path: 'content-segments-editor',
        loadComponent: () =>
          import('./prototypes/content-segments-editor/content-segments-editor.page').then(
            (m) => m.ContentSegmentsEditorPage,
          ),
      },
      {
        // Prototipo contentSegmentsPreview: lee de sessionStorage
        path: 'content-segments-preview',
        loadComponent: () =>
          import('./prototypes/content-segments-preview/content-segments-preview.page').then(
            (m) => m.ContentSegmentsPreviewPage,
          ),
      },
      {
        // Prototipo help-demo: demostración del sistema de ayuda
        path: 'help-demo',
        loadComponent: () =>
          import('./prototypes/help-demo/help-demo.page').then((m) => m.HelpDemoPage),
      },
      {
        // Prototipo association-page-demo: páginas de asociación con segmentos
        path: 'association-page-demo',
        loadComponent: () =>
          import('./prototypes/association-page-demo/association-page-demo.page').then(
            (m) => m.AssociationPageDemoPage,
          ),
      },
      {
        // Prototipo color-demo: demostración de uso de colores
        path: 'color-demo',
        loadComponent: () =>
          import('./prototypes/color-demo/color-demo.page').then((m) => m.ColorDemoPage),
      },
      {
        // Prototipo theme-color-cards: combinaciones de colores de @theme
        path: 'theme-color-cards',
        loadComponent: () =>
          import('./prototypes/theme-color-cards/theme-color-cards.page').then(
            (m) => m.ThemeColorCardsPage,
          ),
      },
      {
        // Prototipo admin-page-demo: layout completo de administración
        path: 'admin-page-demo',
        loadComponent: () =>
          import('./prototypes/admin-page-demo/admin-page-demo.page').then((m) => m.AdminPageDemoPage),
      },
      {
        // Prototipo associations-cards: diseño de cards para listado de asociaciones
        path: 'associations-cards',
        loadComponent: () =>
          import('./prototypes/associations-cards/associations-cards.page').then(
            (m) => m.AssociationsCardsPrototypePage,
          ),
      },
      {
        // Prototipo event-detail-demo: equivalente a /eventos/{id}/{slug}
        path: 'event-detail-demo',
        loadComponent: () =>
          import('./prototypes/event-detail-demo/event-detail-demo.page').then(
            (m) => m.EventDetailDemoPage,
          ),
      },
      {
        // Prototipo association-form-demo: equivalente al formulario crear/editar asociación
        path: 'association-form-demo',
        loadComponent: () =>
          import('./prototypes/association-form-demo/association-form-demo.page').then(
            (m) => m.AssociationFormDemoPage,
          ),
      },
      {
        // Prototipo perfil-demo: equivalente a /perfil (página de perfil de usuario)
        path: 'perfil-demo',
        loadComponent: () =>
          import('./prototypes/perfil-demo/perfil-demo.page').then(
            (m) => m.PerfilDemoPage,
          ),
      },
      {
        // Prototipo registro-form-demo: equivalente a /registro (formulario de registro de usuario)
        path: 'registro-form-demo',
        loadComponent: () =>
          import('./prototypes/registro-form-demo/registro-form-demo.page').then(
            (m) => m.RegistroFormDemoPage,
          ),
      },
      {
        // Prototipo event-form-demo: equivalente al formulario crear/editar evento
        path: 'event-form-demo',
        loadComponent: () =>
          import('./prototypes/event-form-demo/event-form-demo.page').then(
            (m) => m.EventFormDemoPage,
          ),
      },
      { path: '**', component: PrototypeHostPage },
    ],
  },

  // Admin: página principal (requiere cualquier permiso en el scope actual)
  {
    path: 'admin',
    component: AdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requireAnyPermission()],
  },

  // Admin: gestión de juegos
  {
    path: 'admin/juegos',
    component: AdminGamesPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('admin')],
  },

  // Admin: gestión de asociaciones
  {
    path: 'admin/asociaciones',
    component: AdminAssociationsPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('admin')],
  },

  // Admin: gestión de usuarios
  {
    path: 'admin/usuarios',
    component: AdminUsersPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('admin')],
  },

  // Admin: gestión de estados de miembros de asociaciones
  {
    path: 'admin/asociacion/estados',
    component: AdminMemberStatusesPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('admin')],
  },

  // Admin: gestión de miembros de asociaciones
  {
    path: 'admin/asociacion/miembros',
    component: AdminAssociationMembersPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('admin')],
  },

  // Admin: gestión de contactos
  {
    path: 'admin/contactos',
    component: AdminContactPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('admin')],
  },
  {
    path: 'admin/asociacion/contactos',
    component: AdminContactPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('admin')],
  },

  // Admin: gestión de juegos relacionados con asociaciones
  {
    path: 'admin/asociacion/juegos_relacionados',
    component: AdminAssociationGamesPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('admin')],
  },

  // Admin: gestión de páginas
  // Páginas globales (scopeType 1, sin scopeId)
  {
    path: 'admin/pages/1',
    component: OwnerPagesAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('pages.edit')],
  },
  // Páginas contextuales (scopeType 2/3 sin scopeId explícito, usa scope del contexto)
  {
    path: 'admin/pages/2',
    component: OwnerPagesAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('pages.edit')],
  },
  {
    path: 'admin/pages/2/create',
    component: PageFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('pages.edit')],
  },
  {
    path: 'admin/pages/2/edit/:pageId',
    component: PageFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('pages.edit')],
  },
  {
    path: 'admin/pages/3',
    component: OwnerPagesAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('pages.edit')],
  },
  {
    path: 'admin/pages/3/create',
    component: PageFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('pages.edit')],
  },
  {
    path: 'admin/pages/3/edit/:pageId',
    component: PageFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('pages.edit')],
  },
  {
    path: 'admin/pages/1/create',
    component: PageFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('pages.edit')],
  },
  {
    path: 'admin/pages/1/edit/:pageId',
    component: PageFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('pages.edit')],
  },
  // Páginas de owner (scopeType 2/3 con scopeId)
  {
    path: 'admin/pages/:ownerType/:ownerId',
    component: OwnerPagesAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('pages.edit')],
  },
  {
    path: 'admin/pages/:ownerType/:ownerId/create',
    component: PageFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('pages.edit')],
  },
  {
    path: 'admin/pages/:ownerType/:ownerId/edit/:pageId',
    component: PageFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission('pages.edit')],
  },
  // Vista previa: sin guards porque solo lee sessionStorage del editor
  {
    path: 'admin/pages/preview',
    component: PagePreviewPage,
  },

  // Admin: gestión de noticias
  // Noticias globales
  {
    path: 'admin/noticias',
    component: NewsListAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.NEWS_EDIT)],
  },
  // Noticias contextuales de asociación (usa scope del contexto)
  {
    path: 'admin/asociacion/noticias',
    component: NewsListAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.NEWS_EDIT)],
  },
  // Noticias contextuales de juego (usa scope del contexto)
  {
    path: 'admin/juego/noticias',
    component: NewsListAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.NEWS_EDIT)],
  },

  // Formulario de noticias (crear / editar)
  {
    path: 'admin/noticias/nueva',
    component: NewsFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.NEWS_EDIT)],
  },
  {
    path: 'admin/noticias/:newsId/editar',
    component: NewsFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.NEWS_EDIT)],
  },
  {
    path: 'admin/asociacion/noticias/nueva',
    component: NewsFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.NEWS_EDIT)],
  },
  {
    path: 'admin/asociacion/noticias/:newsId/editar',
    component: NewsFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.NEWS_EDIT)],
  },
  {
    path: 'admin/juego/noticias/nueva',
    component: NewsFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.NEWS_EDIT)],
  },
  {
    path: 'admin/juego/noticias/:newsId/editar',
    component: NewsFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.NEWS_EDIT)],
  },

  // Admin: gestión de eventos
  // Eventos globales
  {
    path: 'admin/eventos',
    component: EventsListAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.EVENTS_EDIT)],
  },
  // Eventos contextuales de asociación
  {
    path: 'admin/asociacion/eventos',
    component: EventsListAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.EVENTS_EDIT)],
  },
  // Eventos contextuales de juego
  {
    path: 'admin/juego/eventos',
    component: EventsListAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.EVENTS_EDIT)],
  },

  // Formulario de eventos (crear / editar)
  {
    path: 'admin/eventos/nuevo',
    component: EventsFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.EVENTS_EDIT)],
  },
  {
    path: 'admin/eventos/:eventId/editar',
    component: EventsFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.EVENTS_EDIT)],
  },
  {
    path: 'admin/asociacion/eventos/nuevo',
    component: EventsFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.EVENTS_EDIT)],
  },
  {
    path: 'admin/asociacion/eventos/:eventId/editar',
    component: EventsFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.EVENTS_EDIT)],
  },
  {
    path: 'admin/juego/eventos/nuevo',
    component: EventsFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.EVENTS_EDIT)],
  },
  {
    path: 'admin/juego/eventos/:eventId/editar',
    component: EventsFormAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.EVENTS_EDIT)],
  },

  // Inscripciones de evento (admin)
  {
    path: 'admin/eventos/:eventId/inscripciones',
    component: EventAttendeesAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.EVENTS_EDIT)],
  },
  {
    path: 'admin/asociacion/eventos/:eventId/inscripciones',
    component: EventAttendeesAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.EVENTS_EDIT)],
  },
  {
    path: 'admin/juego/eventos/:eventId/inscripciones',
    component: EventAttendeesAdminPage,
    canActivate: [resolveScopeGuard, requireAuth, requirePermission(PERM.EVENTS_EDIT)],
  },

  { path: '**', redirectTo: '' },
];
