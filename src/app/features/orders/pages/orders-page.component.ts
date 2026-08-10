import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateOrder, Order, Product, User } from '../../../core/models/domain.models';
import { OrdersService } from '../data-access/orders.service';
import { ProductsService } from '../../products/data-access/products.service';
import { SessionService } from '../../../core/services/session.service';
import { UsersService } from '../../users/data-access/users.service';

@Component({
  selector: 'app-orders-page',
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <section class="catalog row g-3">
      <article class="col-12 col-lg-4">
        <div class="th-card h-100">
          <header class="th-card-head">
            <h2 class="th-card-title">Nuevo pedido</h2>
          </header>
          <div class="th-card-body">
            <form [formGroup]="form" (ngSubmit)="createOrder()" class="th-form-grid">
              <div>
                <label class="form-label" for="order-customer">Cliente</label>
                <select
                  id="order-customer"
                  class="form-select th-input"
                  [class.is-invalid]="isInvalid('customerId')"
                  [class.is-valid]="isValid('customerId')"
                  formControlName="customerId"
                >
                  @for (customer of customers(); track customer.id) {
                  <option [value]="customer.id">{{customer.customer?.name}}</option>
                  }
                </select>
                @if (isInvalid('customerId')) {
                  <div class="invalid-feedback d-block">El cliente es obligatorio.</div>
                }
              </div>
              <div>
                <label class="form-label" for="order-employee">Empleado</label>
                <input
                  id="order-employee"
                  class="form-control th-input"
                  [class.is-invalid]="isInvalid('employeeId')"
                  [class.is-valid]="isValid('employeeId')"
                  formControlName="employeeId"
                  readonly
                />
                @if (isInvalid('employeeId')) {
                  <div class="invalid-feedback d-block">El empleado es obligatorio.</div>
                }
              </div>
              <div>
                <label class="form-label" for="order-items">Items</label>
                <select
                  id="order-items"
                  class="form-select th-input"
                  [class.is-invalid]="isInvalid('items')"
                  [class.is-valid]="isValid('items')"
                  formControlName="items"
                >
                  @for (product of products(); track product.id) {
                  <option [value]="product.id">
                    {{product.name}} - DOP$ {{product.price}}
                  </option>
                  }
                </select>
                @if (isInvalid('items')) {
                  <div class="invalid-feedback d-block">Los items son obligatorios.</div>
                }
              </div>
              <div>
                <label class="form-label" for="order-notes">Notas</label>
                <textarea
                  id="order-notes"
                  rows="3"
                  class="form-control th-input"
                  [class.is-invalid]="isInvalid('notes')"
                  [class.is-valid]="isValid('notes')"
                  formControlName="notes"
                ></textarea>
                @if (isInvalid('notes')) {
                  <div class="invalid-feedback d-block">Las notas no pueden exceder los 500 caracteres.</div>
                }
              </div>
              <div class="th-form-actions">
                <button class="btn th-btn-primary" type="submit" [disabled]="form.invalid">
                  Crear pedido
                </button>
              </div>
            </form>
            @if (successMessage()) {
              <div class="alert alert-success py-2 mt-2" role="status">{{ successMessage() }}</div>
            }
            @if (errorMessage()) {
              <div class="alert alert-danger py-2 mt-2" role="alert">{{ errorMessage() }}</div>
            }
          </div>
        </div>
      </article>

    <article class="th-card col-12 col-lg-8">
      <header class="th-card-head">
        <h2 class="th-card-title">Pedidos</h2>
      </header>
      <div class="th-card-body">

      <div class="th-table-shell">
      <div class="th-table-scroll">
      <table class="table table-hover align-middle">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Cliente</th>
            <th scope="col">Estado</th>
            <th scope="col">Fecha</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          @for (order of orders(); track order.id) {
            <tr>
              <td>{{ order.id }}</td>
              <td>{{ order.customer.fullName }}</td>
              <td>
                <span class="badge text-uppercase" [class]="orderStatusClass(order.status)">
                  {{ order.status }}
                </span>
              </td>
              <td>{{ order.createdAt | date:'short' }}</td>
              <td>{{ order.totalAmount }}</td>
            </tr>
          }
        </tbody>
      </table>
      </div>
      </div>
      </div>
    </article>
    </section>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ordersService = inject(OrdersService);
  private readonly productsService = inject(ProductsService);
  private readonly userService = inject(UsersService);
  private readonly session = inject(SessionService);


  readonly orders = signal<Order[]>([]);
  readonly products = signal<Product[]>([]);
  readonly customers = signal<User[]>([]);
  readonly loading = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    customerId: ['', Validators.required],
    employeeId: [this.session.user()?.employee?.name || '', Validators.required],
    items: ['', Validators.required],
    notes: ['', Validators.maxLength(500)]
  });

  isInvalid(field: 'customerId' | 'employeeId' | 'items' | 'notes'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  isValid(field: 'customerId' | 'employeeId' | 'items' | 'notes'): boolean {
    const control = this.form.controls[field];
    return control.valid && (control.touched || control.dirty);
  }

  constructor() {
    this.loadOrders();
    this.userService.list({ role: 'client' }).subscribe((response) => this.customers.set(response.data));
  }

  createOrder(): void {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }
  
      this.loading.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');
  
      const raw = this.form.getRawValue();
      const payload: CreateOrder = {
        customerId: raw.customerId.trim(),
        employeeId: this.session.user()?.id || '',
        items: raw.items.split(',').map((itemId) => {
          const product = this.products().find((p) => p.id === itemId);
          return product ? { productId: product.id, quantity: 1 } : null;
        }).filter(item => item !== null),
        notes: raw.notes.trim()
      };
  
      this.ordersService.create(payload).subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set('Orden creada correctamente.');
          this.form.reset({ customerId: '', employeeId: this.session.user()?.employee?.name || '', items: '', notes: '' });
          this.loadOrders();
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('No fue posible crear la orden.');
        }
      });
    }
  
    private loadOrders(): void {
      this.ordersService.list({ page: 1, limit: 20 }).subscribe((response) => this.orders.set(response.data));
      this.productsService.list({ page: 1, limit: 20 }).subscribe((response) => this.products.set(response.data));
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