import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ProfilePageComponent } from './features/users/pages/profile-page.component';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () =>
			import('./features/auth/pages/login-page.component').then((m) => m.LoginPageComponent)
	},
	{
		path: 'register',
		loadComponent: () =>
			import('./features/auth/pages/register-page.component').then((m) => m.RegisterPageComponent)
	},
	{
		path: 'forgot-password',
		loadComponent: () =>
			import('./features/auth/pages/forgot-password-page.component').then(
				(m) => m.ForgotPasswordPageComponent
			)
	},
	{
		path: 'auth/google/callback',
		loadComponent: () =>
			import('./features/auth/pages/google-calendar-callback-page.component').then(
				(m) => m.GoogleCalendarCallbackPageComponent
			)
	},
	{
		path: 'auth',
		pathMatch: 'full',
		redirectTo: 'login'
	},
	{
		path: '',
		component: ShellComponent,
		canActivate: [authGuard],
		children: [
			{
				path: 'dashboard',
				canActivate: [roleGuard],
				data: { roles: ['super_admin', 'admin', 'manager', 'employee'] },
				loadComponent: () =>
					import('./features/dashboard/dashboard-page.component').then(
						(m) => m.DashboardPageComponent
					)
			},
			{
				path: 'profile',
				canActivate: [roleGuard],
				data: { roles: ['super_admin', 'admin', 'manager', 'employee', 'client'] },
				component: ProfilePageComponent
			},
			{
				path: 'employees',
				canActivate: [roleGuard],
				data: { roles: ['manager', 'admin', 'super_admin'] },
				loadChildren: () =>
					import('./features/employees/employees.routes').then((m) => m.EMPLOYEES_ROUTES)
			},
			{
				path: 'customers',
				canActivate: [roleGuard],
				data: { roles: ['employee', 'manager', 'admin', 'super_admin'] },
				loadChildren: () =>
					import('./features/customers/customers.routes').then((m) => m.CUSTOMERS_ROUTES)
			},
			{
				path: 'stores',
				canActivate: [roleGuard],
				data: { roles: ['admin', 'super_admin'] },
				loadChildren: () => import('./features/stores/stores.routes').then((m) => m.STORES_ROUTES)
			},
			{
				path: 'services',
				canActivate: [roleGuard],
				data: { roles: ['employee', 'manager', 'admin', 'super_admin'] },
				loadChildren: () =>
					import('./features/products/products.routes').then((m) => m.PRODUCTS_ROUTES)
			},
			{
				path: 'orders',
				canActivate: [roleGuard],
				data: { roles: ['super_admin', 'admin', 'manager', 'employee', 'client'] },
				loadChildren: () => import('./features/orders/orders.routes').then((m) => m.ORDERS_ROUTES)
			},
			{
				path: 'invoices',
				canActivate: [roleGuard],
				data: { roles: ['employee', 'manager', 'admin', 'super_admin'] },
				loadChildren: () =>
					import('./features/invoices/invoices.routes').then((m) => m.INVOICES_ROUTES)
			},
			{
				path: 'appointments',
				canActivate: [roleGuard],
				data: { roles: ['super_admin', 'admin', 'manager', 'employee', 'client'] },
				loadChildren: () =>
					import('./features/appointments/appointments.routes').then((m) => m.APPOINTMENTS_ROUTES)
			},
			{ path: '', pathMatch: 'full', redirectTo: 'dashboard' }
		]
	},
	{ path: '**', redirectTo: 'dashboard' }
];
