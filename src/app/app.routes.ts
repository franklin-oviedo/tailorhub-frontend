import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
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
				loadComponent: () =>
					import('./features/dashboard/pages/dashboard-page.component').then(
						(m) => m.DashboardPageComponent
					)
			},
			{
				path: 'users',
				loadChildren: () => import('./features/users/users.routes').then((m) => m.USERS_ROUTES)
			},
			{
				path: 'stores',
				loadChildren: () => import('./features/stores/stores.routes').then((m) => m.STORES_ROUTES)
			},
			{
				path: 'products',
				loadChildren: () =>
					import('./features/products/products.routes').then((m) => m.PRODUCTS_ROUTES)
			},
			{
				path: 'orders',
				loadChildren: () => import('./features/orders/orders.routes').then((m) => m.ORDERS_ROUTES)
			},
			{
				path: 'appointments',
				loadChildren: () =>
					import('./features/appointments/appointments.routes').then((m) => m.APPOINTMENTS_ROUTES)
			},
			{ path: '', pathMatch: 'full', redirectTo: 'dashboard' }
		]
	},
	{ path: '**', redirectTo: 'dashboard' }
];
