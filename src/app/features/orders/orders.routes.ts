import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { OrderDetailPageComponent } from './pages/order-detail-page.component';
import { OrdersPageComponent } from './pages/orders-page.component';

export const ORDERS_ROUTES: Routes = [
	{
		path: '',
		component: OrdersPageComponent,
		canActivate: [roleGuard],
		data: { roles: ['super_admin', 'admin', 'manager', 'employee', 'client'] }
	},
	{
		path: ':id',
		component: OrderDetailPageComponent,
		canActivate: [roleGuard],
		data: { roles: ['super_admin', 'admin', 'manager', 'employee', 'client'] }
	}
];
