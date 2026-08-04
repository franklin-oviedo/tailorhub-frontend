import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Appointment } from '../../../core/models/domain.models';
import { AppointmentsService } from '../data-access/appointments.service';

@Component({
  selector: 'app-appointments-page',
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <div class="grid">
      <article class="th-card">
        <header class="th-card-head">
          <h2 class="th-card-title">Reservar cita</h2>
        </header>
        <div class="th-card-body">

        <form [formGroup]="form" (ngSubmit)="book()" class="th-form-grid">
          <div>
            <label class="form-label" for="appointment-customer">Nombre del cliente</label>
            <input id="appointment-customer" class="form-control th-input" formControlName="customerName" />
          </div>

          <div>
            <label class="form-label" for="appointment-phone">Telefono</label>
            <input id="appointment-phone" class="form-control th-input" formControlName="customerPhone" />
          </div>

          <div>
            <label class="form-label" for="appointment-date">Fecha y hora</label>
            <input
              id="appointment-date"
              class="form-control th-input"
              formControlName="scheduledAt"
              type="datetime-local"
            />
          </div>

          <div class="th-form-actions">
            <button class="btn th-btn-primary" type="submit" [disabled]="form.invalid">
              Crear cita
            </button>
          </div>
        </form>
        </div>
      </article>

      <article class="th-card">
        <header class="th-card-head">
          <h2 class="th-card-title">Citas</h2>
        </header>
        <div class="th-card-body">

        <div class="th-table-shell">
        <div class="th-table-scroll">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th scope="col">Cliente</th>
              <th scope="col">Fecha</th>
              <th scope="col">Estado</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (item of appointments(); track item.id) {
              <tr>
                <td>{{ item.customerName }}</td>
                <td>{{ item.scheduledAt | date:'short' }}</td>
                <td>
                  <span class="badge text-uppercase" [class]="appointmentStatusClass(item.status)">
                    {{ item.status }}
                  </span>
                </td>
                <td>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    type="button"
                    [disabled]="item.status === 'cancelled'"
                    (click)="remove(item.id)"
                  >
                    Cancelar
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        </div>
        </div>
        </div>
      </article>
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentsPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly appointmentsService = inject(AppointmentsService);

  readonly appointments = signal<Appointment[]>([]);

  readonly form = this.fb.nonNullable.group({
    customerName: ['', Validators.required],
    customerPhone: [''],
    scheduledAt: ['', Validators.required]
  });

  constructor() {
    this.load();
  }

  book(): void {
    if (this.form.invalid) {
      return;
    }

    this.appointmentsService.create(this.form.getRawValue()).subscribe(() => {
      this.form.reset({ customerName: '', customerPhone: '', scheduledAt: '' });
      this.load();
    });
  }

  remove(id: string): void {
    this.appointmentsService.remove(id).subscribe(() => this.load());
  }

  appointmentStatusClass(status: Appointment['status']): string {
    switch (status) {
      case 'booked':
        return 'bg-success-subtle text-success-emphasis border border-success-subtle';
      case 'cancelled':
        return 'bg-danger-subtle text-danger-emphasis border border-danger-subtle';
      default:
        return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
    }
  }

  private load(): void {
    this.appointmentsService
      .list({ page: 1, limit: 20 })
      .subscribe((response) => this.appointments.set(response.data));
  }
}
