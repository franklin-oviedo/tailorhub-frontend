import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { OrdersPageComponent } from './pages/orders-page.component';

export const ORDERS_ROUTES: Routes = [
	{
		path: '',
		component: OrdersPageComponent,
		canActivate: [roleGuard],
		data: { roles: ['super_admin', 'admin', 'manager', 'employee', 'client'] }
	}
];
