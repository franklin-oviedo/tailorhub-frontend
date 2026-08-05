import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { AppointmentsPageComponent } from './pages/appointments-page.component';

export const APPOINTMENTS_ROUTES: Routes = [
	{
		path: '',
		component: AppointmentsPageComponent,
		canActivate: [roleGuard],
		data: { roles: ['super_admin', 'admin', 'manager', 'employee', 'client'] }
	}
];
