import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { LoginPage } from './pages/login/login.page';
import { AuthCallbackPage } from './pages/auth-callback/auth-callback.page';
import { StyleguidePage } from './pages/styleguide/styleguide.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomePage },
  { path: 'login', component: LoginPage },
  { path: 'auth/callback', component: AuthCallbackPage },
  { path: 'styleguide', component: StyleguidePage },
  { path: '**', redirectTo: '' },
];
