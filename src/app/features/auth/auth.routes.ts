import { Routes } from '@angular/router';
import { ForgotPasswordPageComponent } from './pages/forgot-password-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { RegisterPageComponent } from './pages/register-page.component';

export const AUTH_ROUTES: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
  { path: 'forgot-password', component: ForgotPasswordPageComponent },
  { path: '', pathMatch: 'full', redirectTo: 'login' }
];
