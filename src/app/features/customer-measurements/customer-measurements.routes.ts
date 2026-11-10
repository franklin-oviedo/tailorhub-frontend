import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { CustomerMeasurementsPageComponent } from './pages/customer-measurements-page.component';

export const CUSTOMER_MEASUREMENTS_ROUTES: Routes = [
  {
    path: '',
    component: CustomerMeasurementsPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['employee', 'manager'] },
  },
];
