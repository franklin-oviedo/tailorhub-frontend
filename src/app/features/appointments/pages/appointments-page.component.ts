import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Appointment, CreateAppointment, User } from '../../../core/models/domain.models';
import { AppointmentsService } from '../data-access/appointments.service';
import { UsersService } from '../../users/data-access/users.service';
import { SessionService } from '../../../core/services/session.service';
import { Calendar } from '../../calendar/calendar';

@Component({
  selector: 'app-appointments-page',
  imports: [ReactiveFormsModule, DatePipe, Calendar],
  templateUrl: './appointments-page.html',
  styleUrl: './appointments-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentsPageComponent {
  month: number = new Date().getMonth(); // mes actual
  year: number = new Date().getFullYear(); // año actual
  readonly today = new Date();

  onDateSelected(date: Date) {
    console.log('Fecha seleccionada:', date);
    // aquí puedes actualizar tu formulario o lógica de citas
  }
  private readonly fb = inject(FormBuilder);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly userService = inject(UsersService);
  private readonly session = inject(SessionService);

  readonly appointments = signal<Appointment[]>([]);
  readonly customers = signal<User[]>([]);

  readonly form = this.fb.nonNullable.group({
    clientId: ['', Validators.required],
    employeeId: [this.session.user()?.id || '', Validators.required],
    startsAt: ['', Validators.required],
    notes: ['', Validators.maxLength(500)]
  });

  isInvalid(field: 'clientId' | 'employeeId' | 'startsAt' | 'notes'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  isValid(field: 'clientId' | 'employeeId' | 'startsAt' | 'notes'): boolean {
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

    const raw = this.form.getRawValue();
    const payload: CreateAppointment = {
      clientId: raw.clientId,
      employeeId: this.session.user()?.id || '',
      startsAt: new Date(raw.startsAt),
      endsAt: new Date(new Date(raw.startsAt).getTime() + 30 * 60 * 1000), // Assuming a default duration of 30 minutes
      status: 'scheduled',
      notes: raw.notes.trim()
    };

    this.appointmentsService.create(payload).subscribe(() => {
      this.form.reset({ clientId: '', employeeId: this.session.user()?.id || '', startsAt: '', notes: '' });
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

      this.userService.list({ role: 'client' }).subscribe((response) => this.customers.set(response.data));
  }
}
