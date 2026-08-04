import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { UsersPageComponent } from './pages/users-page.component';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    component: UsersPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['admin'] }
  }
];
