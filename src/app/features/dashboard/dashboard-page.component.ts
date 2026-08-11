import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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

  EmployeeTotal: number = 0; // total de empleados.
  CustomerTotal: number = 0; // total de clientes.
  AppointmentScheduleTotal: number = 0; // total de citas.
  OrdersTotal: number = 0; // total de pedidos.


  readonly session = inject(SessionService);
  readonly userService = inject(UsersService);
  readonly appointmentsService = inject(AppointmentsService);
  readonly ordersService = inject(OrdersService);


  constructor() {
    this.load();
  }

  private load(): void {
    this.userService.list().subscribe((response) => {
      this.CustomerTotal = response.data.filter(user => user.role === 'client').length;
      this.EmployeeTotal = response.data.filter(user => user.role === 'employee').length;
    });

    this.appointmentsService.list().subscribe((response) => {
      this.AppointmentScheduleTotal = response.data.length;
    });

    this.ordersService.list().subscribe((response) => {
      this.OrdersTotal = response.data.length;
    });
  }
}
