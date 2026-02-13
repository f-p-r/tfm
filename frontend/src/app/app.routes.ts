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
import { associationBySlugGuard } from './core/associations/association-by-slug.guard';
import { OwnerPagesAdminPage } from './pages/admin/pages/owner-pages/owner-pages-admin.page';
import { PageEditAdminPage } from './pages/admin/pages/owner-pages/page-edit-admin.page';
import { PageCreateAdminPage } from './pages/admin/pages/owner-pages/page-create-admin.page';
import { PagePreviewPage } from './pages/admin/pages/owner-pages/page-preview.page';
import { PageViewerPage } from './pages/page-viewer/page-viewer.page';
import { PageEntityResolver } from './core/pages/page-entity.resolver';
import { AdminPage } from './pages/admin/admin.page';
import { requirePermission } from './guards/permission.guard';
import { requireAuth } from './guards/auth.guard';

export const routes: Routes = [
  // Public page viewer routes (must be before admin routes)
  { path: '', pathMatch: 'full', component: PageViewerPage },
  { path: 'paginas/:slug', component: PageViewerPage , resolve: { entity: PageEntityResolver }},
  { path: 'login', component: LoginPage },
  { path: 'registro', component: RegistroPage },
  { path: 'auth/callback', component: AuthCallbackPage },
  { path: 'styleguide', component: StyleguidePage },

  // User profile
  { path: 'perfil', component: PerfilPage, canActivate: [requireAuth] },

  // Ruta de juegos con páginas
  { path: 'juegos/:slug', component: PageViewerPage },
  { path: 'juegos/:slug/asociaciones', component: GameAssociationsPage, canActivate: [gameBySlugGuard] },
  { path: 'juegos/:slug/:pagina', component: PageViewerPage, resolve:{ entity: PageEntityResolver } },

  // Rutas de asociaciones con páginas
  { path: 'asociaciones', component: AssociationsPage },
  { path: 'asociaciones/:slug', component: PageViewerPage },
  { path: 'asociaciones/:slug/:pagina', component: PageViewerPage, resolve:{ entity: PageEntityResolver } },
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
        // Prototipo admin-page-demo: layout completo de administración
        path: 'admin-page-demo',
        loadComponent: () =>
          import('./prototypes/admin-page-demo/admin-page-demo.page').then((m) => m.AdminPageDemoPage),
      },
      { path: '**', component: PrototypeHostPage },
    ],
  },

  // Admin: página principal
  {
    path: 'admin',
    component: AdminPage,
    canActivate: [requirePermission('admin')],
  },

  // Admin: gestión de páginas
  // Páginas globales (scopeType 1, sin scopeId)
  {
    path: 'admin/pages/1',
    component: OwnerPagesAdminPage,
    canActivate: [requirePermission('pages.edit')],
  },
  {
    path: 'admin/pages/1/create',
    component: PageCreateAdminPage,
    canActivate: [requirePermission('pages.edit')],
  },
  {
    path: 'admin/pages/1/edit/:pageId',
    component: PageEditAdminPage,
    canActivate: [requirePermission('pages.edit')],
  },
  // Páginas de owner (scopeType 2/3 con scopeId)
  {
    path: 'admin/pages/:ownerType/:ownerId',
    component: OwnerPagesAdminPage,
    canActivate: [requirePermission('pages.edit')],
  },
  {
    path: 'admin/pages/:ownerType/:ownerId/create',
    component: PageCreateAdminPage,
    canActivate: [requirePermission('pages.edit')],
  },
  {
    path: 'admin/pages/:ownerType/:ownerId/edit/:pageId',
    component: PageEditAdminPage,
    canActivate: [requirePermission('pages.edit')],
  },
  {
    path: 'admin/pages/preview',
    component: PagePreviewPage,
    canActivate: [requirePermission('pages.edit')],
  },

  { path: '**', redirectTo: '' },
];
