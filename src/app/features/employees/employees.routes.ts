import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { EmployeesPageComponent } from './pages/employees-page.component';

export const EMPLOYEES_ROUTES: Routes = [
  {
    path: '',
    component: EmployeesPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['manager', 'admin', 'super_admin'] }
  }
];
