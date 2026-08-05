import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { StoresPageComponent } from './pages/stores-page.component';

export const STORES_ROUTES: Routes = [
  {
    path: '',
    component: StoresPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['super_admin', 'admin'] }
  }
];
