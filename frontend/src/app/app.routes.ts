import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { LoginPage } from './pages/login/login.page';
import { AuthCallbackPage } from './pages/auth-callback/auth-callback.page';
import { StyleguidePage } from './styleguide/styleguide.page';
import { PrototypeHostPage } from './prototypes/prototype-host.page';
import { GamePage } from './pages/games/game/game.page';
import { gameBySlugGuard } from './guards/game-by-slug.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomePage },
  { path: 'login', component: LoginPage },
  { path: 'auth/callback', component: AuthCallbackPage },
  { path: 'styleguide', component: StyleguidePage },

  // Ruta de juegos (sin ID en URL)
  { path: 'juegos/:slug', component: GamePage, canActivate: [gameBySlugGuard] },
  {
    path: 'prototypes',
    children: [
      { path: '', component: PrototypeHostPage },
      {
        // Ruta lazy: Quill y estilos se cargan sólo en este chunk
        path: 'editor-demo',
        loadComponent: () => import('./prototypes/editor-demo/editor-demo.page').then((m) => m.EditorDemoPage),
      },
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
      { path: '**', component: PrototypeHostPage },
    ],
  },
  { path: '**', redirectTo: '' },
];
