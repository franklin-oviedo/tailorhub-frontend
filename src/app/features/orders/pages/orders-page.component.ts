import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { CreateOrder, Order, Product } from '../../../core/models/domain.models';
import { ConfirmDialogComponent } from '../../../core/ui/confirm-dialog.component';

import { OrdersService } from '../data-access/orders.service';
import { ProductsService } from '../../products/data-access/products.service';
import { CustomersService, CustomerWithStore } from '../../customers/data-access/customers.service';
import { InvoicesService } from '../../invoices/data-access/invoices.service';
import { hasFiniteOrderValues } from '../utils/order-numeric-validation.util';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-orders-page',
  imports: [DatePipe, CurrencyPipe, RouterLink, ReactiveFormsModule, MatDialogModule],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ordersService = inject(OrdersService);
  private readonly productsService = inject(ProductsService);
  private readonly customersService = inject(CustomersService);
  private readonly invoicesService = inject(InvoicesService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  // =========================================================
  // State
  // =========================================================

  readonly orders = signal<Order[]>([]);
  readonly products = signal<Product[]>([]);
  readonly customers = signal<CustomerWithStore[]>([]);

  readonly loading = signal(false);
  readonly generatingInvoiceOrderId = signal<string | null>(null);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');
  readonly isClient = computed(() => this.session.role() === 'client');
  readonly clientCustomerId = computed(() => this.session.user()?.customer?.id?.trim() ?? '');

  // =========================================================
  // Pagination
  // =========================================================

  /**
   * Número de pedidos visibles por página.
   *
   * La paginación es client-side:
   * los pedidos cargados se dividen mediante slice().
   */
  readonly pageSize = signal(8);

  /**
   * Página actualmente seleccionada.
   */
  readonly currentPage = signal(1);

  /**
   * Cantidad total de páginas.
   */
  readonly totalPages = computed(() => {
    const totalOrders = this.orders().length;
    const pageSize = this.pageSize();

    return Math.max(1, Math.ceil(totalOrders / pageSize));
  });

  /**
   * Pedidos que deben mostrarse en la página actual.
   */
  readonly paginatedOrders = computed(() => {
    const orders = this.orders();
    const currentPage = this.currentPage();
    const pageSize = this.pageSize();

    const startIndex = (currentPage - 1) * pageSize;

    return orders.slice(startIndex, startIndex + pageSize);
  });

  /**
   * Números de página disponibles.
   *
   * Ejemplo:
   * 20 pedidos → [1, 2, 3]
   */
  readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  /**
   * Primer registro visible.
   */
  readonly paginationStart = computed(() => {
    const totalOrders = this.orders().length;

    if (totalOrders === 0) {
      return 0;
    }

    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  /**
   * Último registro visible.
   */
  readonly paginationEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.orders().length),
  );

  // =========================================================
  // Form
  // =========================================================

  readonly form = this.fb.nonNullable.group({
    customerId: ['', Validators.required],
    items: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    notes: ['', Validators.maxLength(500)],
  });

  // =========================================================
  // Lifecycle
  // =========================================================

  constructor() {
    this.loadOrders();

    if (this.isClient()) {
      this.form.controls.customerId.clearValidators();
      this.form.controls.customerId.setValue(this.clientCustomerId());
      this.form.controls.customerId.disable();
      this.form.controls.customerId.updateValueAndValidity({ emitEvent: false });
      return;
    }

    this.customersService.listAll().subscribe((customers) => {
      this.customers.set(customers);
    });
  }

  // =========================================================
  // Form validation
  // =========================================================

  isInvalid(field: 'customerId' | 'items' | 'quantity' | 'notes'): boolean {
    const control = this.form.controls[field];

    return control.invalid && (control.touched || control.dirty);
  }

  isValid(field: 'customerId' | 'items' | 'quantity' | 'notes'): boolean {
    const control = this.form.controls[field];

    return control.valid && (control.touched || control.dirty);
  }

  // =========================================================
  // Pagination actions
  // =========================================================

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }

    this.currentPage.set(page);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((page) => page + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((page) => page - 1);
    }
  }

  // =========================================================
  // Create order
  // =========================================================

  createOrder(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const raw = this.form.getRawValue();
    const selectedProduct = this.products().find((product) => product.id === raw.items);
    const quantity = Number(raw.quantity);
    const customerId = this.isClient() ? this.clientCustomerId() : raw.customerId.trim();

    if (!selectedProduct || !Number.isFinite(quantity) || quantity < 1) {
      this.loading.set(false);
      this.errorMessage.set('Selecciona un servicio válido y una cantidad mayor o igual a 1.');
      this.form.controls.quantity.markAsTouched();
      return;
    }

    if (!customerId) {
      this.loading.set(false);
      this.errorMessage.set(
        'No se encontró un cliente asociado a tu cuenta. Contacta al administrador.',
      );
      return;
    }

    const payload: CreateOrder = {
      customerId,
      items: [
        {
          productId: selectedProduct.id,
          quantity,
        },
      ],

      notes: raw.notes.trim(),
    };

    this.ordersService.create(payload).subscribe({
      next: () => {
        this.loading.set(false);

        this.successMessage.set('Orden creada correctamente.');

        this.form.reset({
          customerId: this.isClient() ? this.clientCustomerId() : '',
          items: '',
          quantity: 1,
          notes: '',
        });

        // Mostramos la primera página después de crear.
        this.currentPage.set(1);

        this.loadOrders();
      },

      error: () => {
        this.loading.set(false);

        this.errorMessage.set('No fue posible crear la orden.');
      },
    });
  }

  generateInvoice(orderId: string): void {
    if (this.generatingInvoiceOrderId() !== null) {
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

        const sanitizedOrderId = orderId.trim();
        if (!sanitizedOrderId) {
          this.errorMessage.set('No fue posible identificar el pedido para facturar.');
          return;
        }

        this.generatingInvoiceOrderId.set(sanitizedOrderId);
        this.errorMessage.set('');
        this.successMessage.set('');

        this.ordersService.detail(sanitizedOrderId).subscribe({
          next: (order) => {
            if (!hasFiniteOrderValues(order)) {
              this.generatingInvoiceOrderId.set(null);
              this.errorMessage.set(
                'Este pedido contiene cantidades o montos inválidos. Revísalo antes de facturar.',
              );
              return;
            }

            this.invoicesService.createDraftFromOrderMinimal(sanitizedOrderId).subscribe({
              next: (invoice) => {
                if (includeTax) {
                  this.generatingInvoiceOrderId.set(null);
                  this.successMessage.set('Factura borrador generada correctamente.');
                  this.router.navigate(['/invoices', invoice.id]);
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
                      this.generatingInvoiceOrderId.set(null);
                      this.successMessage.set('Factura borrador generada sin ITBIS.');
                      this.router.navigate(['/invoices', invoice.id]);
                    },
                    error: (error) => {
                      this.generatingInvoiceOrderId.set(null);
                      const backendMessage = this.parseApiErrorMessage(error);
                      this.errorMessage.set(
                        backendMessage ??
                          'No fue posible aplicar la opción fiscal sin ITBIS a la factura.',
                      );
                    },
                  });
              },
              error: (error) => {
                this.generatingInvoiceOrderId.set(null);
                const backendMessage = this.parseApiErrorMessage(error);
                this.errorMessage.set(
                  backendMessage ?? 'No fue posible generar la factura para el pedido.',
                );
              },
            });
          },
          error: (error) => {
            this.generatingInvoiceOrderId.set(null);
            const backendMessage = this.parseApiErrorMessage(error);
            this.errorMessage.set(
              backendMessage ?? 'No fue posible validar el pedido antes de facturar.',
            );
          },
        });
      },
      );
  }

  private parseApiErrorMessage(error: unknown): string | null {
    if (!(error instanceof HttpErrorResponse)) {
      return null;
    }

    const message = error.error?.message;
    if (Array.isArray(message)) {
      const content = message.filter(
        (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
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

  // =========================================================
  // Data
  // =========================================================

  private loadOrders(): void {
    const customerId = this.clientCustomerId();

    if (this.isClient() && !customerId) {
      this.orders.set([]);
    } else {
      this.ordersService
        .list({
          page: 1,
          limit: 20,
          customerId: this.isClient() ? customerId : undefined,
        })
        .subscribe((response) => {
          this.orders.set(response.data);

          // Evita quedar en una página inexistente
          // cuando cambia la cantidad de pedidos.
          if (this.currentPage() > this.totalPages()) {
            this.currentPage.set(this.totalPages());
          }
        });
    }

    this.productsService
      .list({
        page: 1,
        limit: 20,
      })
      .subscribe((response) => {
        this.products.set(response.data);
      });
  }

  // =========================================================
  // Order status
  // =========================================================

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
        return 'bg-success-subtle text-success-emphasis border border-success-subtle';

      case 'cancelled':
        return 'bg-danger-subtle text-danger-emphasis border border-danger-subtle';

      case 'in_progress':
        return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';

      case 'confirmed':
        return 'bg-info-subtle text-info-emphasis border border-info-subtle';

      default:
        return 'bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle';
    }
  }
}
