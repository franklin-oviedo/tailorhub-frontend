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
            <input
              id="appointment-customer"
              class="form-control th-input"
              [class.is-invalid]="isInvalid('customerName')"
              [class.is-valid]="isValid('customerName')"
              formControlName="customerName"
            />
            @if (isInvalid('customerName')) {
              <div class="invalid-feedback d-block">El nombre del cliente es obligatorio.</div>
            }
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
              [class.is-invalid]="isInvalid('scheduledAt')"
              [class.is-valid]="isValid('scheduledAt')"
              formControlName="scheduledAt"
              type="datetime-local"
            />
            @if (isInvalid('scheduledAt')) {
              <div class="invalid-feedback d-block">Selecciona una fecha y hora valida.</div>
            }
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
                <td>{{ item.client.fullName }}</td>
                <td>{{ item.startsAt | date:'short' }}</td>
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
    h2 {
      color: white;
      margin-top: 0;
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

  isInvalid(field: 'customerName' | 'customerPhone' | 'scheduledAt'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  isValid(field: 'customerName' | 'customerPhone' | 'scheduledAt'): boolean {
    const control = this.form.controls[field];
    return control.valid && (control.touched || control.dirty);
  }

  constructor() {
    this.load();
  }

  book(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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
