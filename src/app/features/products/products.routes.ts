import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { ProductDetailPageComponent } from './pages/product-detail-page.component';
import { ProductsPageComponent } from './pages/products-page.component';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    component: ProductsPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['super_admin', 'admin', 'manager', 'employee', 'client'] }
  },
  {
    path: ':id',
    component: ProductDetailPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['super_admin', 'admin', 'manager', 'employee', 'client'] }
  }
];
