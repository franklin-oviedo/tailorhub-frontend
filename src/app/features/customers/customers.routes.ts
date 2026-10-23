import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { CustomersPageComponent } from './pages/customers-page.component';

export const CUSTOMERS_ROUTES: Routes = [
  {
    path: '',
    component: CustomersPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['employee', 'manager', 'admin', 'super_admin'] }
  }
];
