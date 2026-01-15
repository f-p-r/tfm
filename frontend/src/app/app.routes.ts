import { Routes } from '@angular/router';
import { StyleguidePage } from './styleguide.page';
import { LoginPage } from './pages/login/login.page';
import { AuthCallbackPage } from './pages/auth-callback/auth-callback.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'styleguide' },
  { path: 'login', component: LoginPage },
  { path: 'auth/callback', component: AuthCallbackPage },
  { path: 'styleguide', component: StyleguidePage },
  { path: '**', redirectTo: 'styleguide' },
];
