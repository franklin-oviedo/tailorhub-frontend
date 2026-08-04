import { Routes } from '@angular/router';
import { ProductDetailPageComponent } from './pages/product-detail-page.component';
import { ProductsPageComponent } from './pages/products-page.component';

export const PRODUCTS_ROUTES: Routes = [
  { path: '', component: ProductsPageComponent },
  { path: ':id', component: ProductDetailPageComponent }
];
