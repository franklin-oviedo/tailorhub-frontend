import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Order } from '../../../core/models/domain.models';
import { OrdersService } from '../data-access/orders.service';

@Component({
  selector: 'app-orders-page',
  imports: [DatePipe],
  template: `
    <article class="th-card">
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
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersPageComponent {
  private readonly ordersService = inject(OrdersService);

  readonly orders = signal<Order[]>([]);

  constructor() {
    this.ordersService.list({ page: 1, limit: 20 }).subscribe((response) => this.orders.set(response.data));
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