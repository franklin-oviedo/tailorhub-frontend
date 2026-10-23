import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Order } from '../../../core/models/domain.models';
import { InvoiceDocument } from '../../../core/models/invoices/invoice.models';
import { INVOICE_STATUS_LABELS } from '../../../core/models/invoices/invoice-status-labels.const';
import { InvoiceStatus } from '../../../core/models/invoices/invoice-status.enum';
import { InvoicesService } from '../../invoices/data-access/invoices.service';
import { OrdersService } from '../data-access/orders.service';
import { hasFiniteOrderValues } from '../utils/order-numeric-validation.util';

@Component({
  selector: 'app-order-detail-page',
  imports: [DatePipe, CurrencyPipe, RouterLink],
  templateUrl: './order-detail-page.html',
  styleUrl: './order-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);
  private readonly invoicesService = inject(InvoicesService);

  readonly loading = signal(false);
  readonly invoicesLoading = signal(false);
  readonly creatingInvoice = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly order = signal<Order | null>(null);
  readonly invoices = signal<InvoiceDocument[]>([]);

  constructor() {
    const orderId = this.route.snapshot.paramMap.get('id');

    if (!orderId) {
      this.errorMessage.set('No se encontró el pedido solicitado.');
      return;
    }

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
          next: () => {
            this.creatingInvoice.set(false);
            this.successMessage.set('Factura borrador generada correctamente.');
            this.loadOrderInvoices(sanitizedOrderId);
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
}
