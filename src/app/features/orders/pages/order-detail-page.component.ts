import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { Order } from '../../../core/models/domain.models';
import { InvoiceDocument } from '../../../core/models/invoices/invoice.models';
import { INVOICE_STATUS_LABELS } from '../../../core/models/invoices/invoice-status-labels.const';
import { InvoiceStatus } from '../../../core/models/invoices/invoice-status.enum';
import { ConfirmDialogComponent } from '../../../core/ui/confirm-dialog.component';
import { InvoicesService } from '../../invoices/data-access/invoices.service';
import { ProductsService } from '../../products/data-access/products.service';
import { OrdersService } from '../data-access/orders.service';
import { hasFiniteOrderValues } from '../utils/order-numeric-validation.util';

@Component({
  selector: 'app-order-detail-page',
  imports: [DatePipe, CurrencyPipe, RouterLink, MatDialogModule],
  templateUrl: './order-detail-page.html',
  styleUrl: './order-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);
  private readonly invoicesService = inject(InvoicesService);
  private readonly productsService = inject(ProductsService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly invoicesLoading = signal(false);
  readonly creatingInvoice = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly order = signal<Order | null>(null);
  readonly invoices = signal<InvoiceDocument[]>([]);
  readonly productNamesById = signal<Record<string, string>>({});

  constructor() {
    const orderId = this.route.snapshot.paramMap.get('id');

    if (!orderId) {
      this.errorMessage.set('No se encontró el pedido solicitado.');
      return;
    }

    this.loadProductNamesById();
    this.loadOrder(orderId);
    this.loadOrderInvoices(orderId);
  }

  loadOrder(orderId: string): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.ordersService
      .detail(orderId)
      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: (order) => {
          this.order.set(order);
        },
        error: () => {
          this.errorMessage.set('No fue posible cargar el detalle del pedido.');
        }
      });
  }

  loadOrderInvoices(orderId: string): void {
    this.invoicesLoading.set(true);

    this.invoicesService
      .list({ orderId, page: 1, limit: 50 })
      .pipe(
        finalize(() => {
          this.invoicesLoading.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.invoices.set(response.data ?? []);
        },
        error: () => {
          this.invoices.set([]);
        }
      });
  }

  generateInvoice(): void {
    const currentOrder = this.order();

    if (!currentOrder || this.creatingInvoice()) {
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        width: 'min(420px, calc(100vw - 2rem))',
        maxWidth: '95vw',
        data: {
          title: 'Generar factura',
          message: '¿Desea incluir ITBIS en la factura?',
          confirmText: 'Sí, incluir ITBIS',
          cancelText: 'No, sin ITBIS'
        }
      })
      .afterClosed()
      .subscribe((includeTax) => {
        if (typeof includeTax !== 'boolean') {
          return;
        }

        const sanitizedOrderId = currentOrder.id.trim();

        if (!sanitizedOrderId) {
          this.errorMessage.set('No fue posible identificar el pedido para facturar.');
          return;
        }

        this.creatingInvoice.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        this.ordersService.detail(sanitizedOrderId).subscribe({
          next: (order) => {
            if (!hasFiniteOrderValues(order)) {
              this.creatingInvoice.set(false);
              this.errorMessage.set(
                'Este pedido contiene cantidades o montos inválidos. Revísalo antes de facturar.'
              );
              return;
            }

            this.order.set(order);

            this.invoicesService.createDraftFromOrderMinimal(sanitizedOrderId).subscribe({
              next: (invoice) => {
                if (includeTax) {
                  this.creatingInvoice.set(false);
                  this.successMessage.set('Factura borrador generada correctamente.');
                  this.loadOrderInvoices(sanitizedOrderId);
                  return;
                }

                this.invoicesService
                  .updateDraft(invoice.id, {
                    items: invoice.items.map((item) => ({
                      id: item.id,
                      isTaxable: false,
                      taxRate: 0,
                    })),
                  })
                  .subscribe({
                    next: () => {
                      this.creatingInvoice.set(false);
                      this.successMessage.set('Factura borrador generada sin ITBIS.');
                      this.loadOrderInvoices(sanitizedOrderId);
                    },
                    error: (error) => {
                      this.creatingInvoice.set(false);
                      const backendMessage = this.parseApiErrorMessage(error);
                      this.errorMessage.set(
                        backendMessage ??
                          'No fue posible aplicar la opción fiscal sin ITBIS a la factura.',
                      );
                    },
                  });
              },
              error: (error) => {
                this.creatingInvoice.set(false);
                const backendMessage = this.parseApiErrorMessage(error);
                this.errorMessage.set(
                  backendMessage ?? 'No fue posible generar la factura para este pedido.'
                );
              }
            });
          },
          error: (error) => {
            this.creatingInvoice.set(false);
            const backendMessage = this.parseApiErrorMessage(error);
            this.errorMessage.set(
              backendMessage ?? 'No fue posible validar el pedido antes de facturar.'
            );
          }
        });
      });
  }

  statusLabel(status: InvoiceStatus): string {
    return INVOICE_STATUS_LABELS[status] ?? status;
  }

  invoiceStatusClass(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'status-badge is-paid';
      case InvoiceStatus.PARTIALLY_PAID:
        return 'status-badge is-partial';
      case InvoiceStatus.ISSUED:
        return 'status-badge is-issued';
      case InvoiceStatus.DRAFT:
        return 'status-badge is-draft';
      case InvoiceStatus.CANCELLED:
        return 'status-badge is-cancelled';
      default:
        return 'status-badge is-credited';
    }
  }

  orderStatusLabel(status: Order['status']): string {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      case 'in_progress':
        return 'En proceso';
      case 'confirmed':
        return 'Confirmado';
      default:
        return 'Pendiente';
    }
  }

  orderStatusClass(status: Order['status']): string {
    switch (status) {
      case 'completed':
        return 'order-status order-status-completed';
      case 'cancelled':
        return 'order-status order-status-cancelled';
      case 'in_progress':
        return 'order-status order-status-progress';
      case 'confirmed':
        return 'order-status order-status-confirmed';
      default:
        return 'order-status order-status-default';
    }
  }

  orderItemName(item: Order['items'][number]): string {
    if (typeof item.productName === 'string' && item.productName.trim().length > 0) {
      return item.productName;
    }

    const productId = typeof item.productId === 'string' ? item.productId.trim() : '';

    if (productId) {
      const mappedName = this.productNamesById()[productId];

      if (typeof mappedName === 'string' && mappedName.trim().length > 0) {
        return mappedName;
      }

      return productId;
    }

    return 'Servicio sin nombre';
  }

  invoiceOrderRef(invoice: InvoiceDocument): string {
    const orderNumber = invoice.orderSnapshot.orderNumber;

    if (typeof orderNumber === 'string' && orderNumber) {
      return orderNumber;
    }

    return invoice.orderSnapshot.id ?? '-';
  }

  private parseApiErrorMessage(error: unknown): string | null {
    if (!(error instanceof HttpErrorResponse)) {
      return null;
    }

    const message = error.error?.message;

    if (Array.isArray(message)) {
      const content = message.filter(
        (entry): entry is string =>
          typeof entry === 'string' && entry.trim().length > 0
      );

      return content.length > 0 ? content.join(', ') : null;
    }

    if (typeof message === 'string' && message.trim().length > 0) {
      if (message.toLowerCase().includes('numeric value must be finite')) {
        return 'El pedido tiene valores numéricos inválidos (cantidad, precio o impuesto). Revísalo e inténtalo nuevamente.';
      }

      return message;
    }

    return null;
  }

  private loadProductNamesById(): void {
    this.productsService.list({ page: 1, limit: 100 }).subscribe({
      next: (response) => {
        const mappedNames = response.data.reduce<Record<string, string>>((acc, product) => {
          if (typeof product.id === 'string' && typeof product.name === 'string') {
            const productId = product.id.trim();
            const productName = product.name.trim();

            if (productId && productName) {
              acc[productId] = productName;
            }
          }

          return acc;
        }, {});

        this.productNamesById.set(mappedNames);
      },
      error: () => {
        this.productNamesById.set({});
      }
    });
  }
}
