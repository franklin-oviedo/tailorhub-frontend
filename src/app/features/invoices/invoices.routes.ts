import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { InvoiceFiscalReportPageComponent } from './pages/invoice-fiscal-report-page.component';
import { InvoiceDetailPageComponent } from './pages/invoice-detail-page.component';
import { InvoicesPageComponent } from './pages/invoices-page.component';

export const INVOICES_ROUTES: Routes = [
  {
    path: '',
    component: InvoicesPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['super_admin', 'admin', 'manager', 'employee', 'client'] }
  },
  {
    path: 'fiscal-report',
    component: InvoiceFiscalReportPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['super_admin', 'admin', 'manager', 'employee'] }
  },
  {
    path: ':id',
    component: InvoiceDetailPageComponent,
    canActivate: [roleGuard],
    data: { roles: ['super_admin', 'admin', 'manager', 'employee', 'client'] }
  }
];
