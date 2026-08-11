import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { SessionService } from '../../core/services/session.service';
import { UsersService } from '../users/data-access/users.service';
import { AppointmentsService } from '../appointments/data-access/appointments.service';
import { OrdersService } from '../orders/data-access/orders.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [],
  templateUrl: 'dashboard-page.html',
  styleUrl: 'dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent {


  // =========================================================
  // Services
  // =========================================================

  readonly session = inject(SessionService);
  private readonly userService = inject(UsersService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly ordersService = inject(OrdersService);

  // =========================================================
  // Dashboard state
  // =========================================================

  /**
   * Total de empleados.
   */
  readonly EmployeeTotal = signal(0);

  /**
   * Total de clientes.
   */
  readonly CustomerTotal = signal(0);

  /**
   * Total de citas.
   */
  readonly AppointmentScheduleTotal = signal(0);

  /**
   * Total de pedidos.
   */
  readonly OrdersTotal = signal(0);

  // =========================================================
  // Lifecycle
  // =========================================================

  constructor() {
    this.load();
  }

  // =========================================================
  // Data
  // =========================================================

  private load(): void {

    this.userService.list().subscribe({
      next: (response) => {

        const users = response.data;

        this.CustomerTotal.set(
          users.filter(
            user => user.role === 'client'
          ).length
        );

        this.EmployeeTotal.set(
          users.filter(
            user => user.role === 'employee'
          ).length
        );
      },

      error: () => {
        this.CustomerTotal.set(0);
        this.EmployeeTotal.set(0);
      }
    });

    this.appointmentsService.list().subscribe({
      next: (response) => {
        this.AppointmentScheduleTotal.set(
          response.data.length
        );
      },

      error: () => {
        this.AppointmentScheduleTotal.set(0);
      }
    });

    this.ordersService.list().subscribe({
      next: (response) => {
        this.OrdersTotal.set(
          response.data.length
        );
      },

      error: () => {
        this.OrdersTotal.set(0);
      }
    });
  }


}
