import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Appointment, CreateAppointment } from '../../../core/models/domain.models';
import { AppointmentsService } from '../data-access/appointments.service';
import { CustomersService, CustomerWithStore } from '../../customers/data-access/customers.service';
import { Calendar } from '../../calendar/calendar';

type AppointmentFormField = 'customerId' | 'date' | 'time' | 'notes';

@Component({
  selector: 'app-appointments-page',
  imports: [ReactiveFormsModule, DatePipe, Calendar],
  templateUrl: './appointments-page.html',
  styleUrl: './appointments-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentsPageComponent {
  readonly month = new Date().getMonth();
  readonly year = new Date().getFullYear();

  private readonly fb = inject(FormBuilder);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly customersService = inject(CustomersService);

  // =========================================================
  // State
  // =========================================================

  readonly selectedDate = signal<Date>(new Date());

  readonly allAppointments = signal<Appointment[]>([]);
  readonly appointments = signal<Appointment[]>([]);
  readonly customers = signal<CustomerWithStore[]>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showAppointmentForm = signal(false);

  readonly appointmentsScheduled = computed(() => {
    return this.appointments().filter((appointment) => appointment.status === 'scheduled').length;
  });

  readonly appointmentsCancelled = computed(() => {
    return this.appointments().filter((appointment) => appointment.status === 'cancelled').length;
  });

  // =========================================================
  // Pagination
  // =========================================================

  readonly pageSize = signal(8);

  readonly currentPage = signal(1);

  readonly totalPages = computed(() => {
    const totalAppointments = this.appointments().length;
    const pageSize = this.pageSize();

    return Math.max(1, Math.ceil(totalAppointments / pageSize));
  });

  readonly paginatedAppointments = computed(() => {
    const appointments = this.appointments();
    const currentPage = this.currentPage();
    const pageSize = this.pageSize();

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return appointments.slice(startIndex, endIndex);
  });

  readonly pages = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, index) => index + 1);
  });

  readonly paginationStart = computed(() => {
    const totalAppointments = this.appointments().length;

    if (totalAppointments === 0) {
      return 0;
    }

    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly paginationEnd = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.appointments().length);
  });

  // =========================================================
  // Form
  // =========================================================

  readonly form = this.fb.nonNullable.group({
    customerId: ['', Validators.required],
    date: [this.formatDateForInput(new Date()), Validators.required],
    time: ['', Validators.required],
    notes: ['', Validators.maxLength(500)],
  });

  // =========================================================
  // Lifecycle
  // =========================================================

  constructor() {
    this.load();
  }

  // =========================================================
  // Calendar
  // =========================================================

  onDateSelected(date: Date): void {
    this.selectedDate.set(date);

    this.form.controls.date.setValue(this.formatDateForInput(date));

    this.currentPage.set(1);

    this.filterAppointmentsBySelectedDate();
  }

  // =========================================================
  // Appointment form
  // =========================================================

  openAppointmentForm(): void {
    const selectedDate = this.selectedDate();

    this.form.reset({
      customerId: '',
      date: this.formatDateForInput(selectedDate),
      time: '',
      notes: '',
    });

    this.showAppointmentForm.set(true);
  }

  closeAppointmentForm(): void {
    if (this.saving()) {
      return;
    }

    this.form.reset({
      customerId: '',
      date: this.formatDateForInput(this.selectedDate()),
      time: '',
      notes: '',
    });

    this.showAppointmentForm.set(false);
  }

  // =========================================================
  // Validation
  // =========================================================

  isInvalid(field: AppointmentFormField): boolean {
    const control = this.form.controls[field];

    return control.invalid && (control.touched || control.dirty);
  }

  isValid(field: AppointmentFormField): boolean {
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
    const nextPage = this.currentPage() + 1;

    if (nextPage <= this.totalPages()) {
      this.currentPage.set(nextPage);
    }
  }

  previousPage(): void {
    const previousPage = this.currentPage() - 1;

    if (previousPage >= 1) {
      this.currentPage.set(previousPage);
    }
  }

  // =========================================================
  // Create appointment
  // =========================================================

  book(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const scheduledAt = this.buildScheduledAt(raw.date, raw.time);

    const payload: CreateAppointment = {
      customerId: raw.customerId,
      scheduledAt,
      status: 'scheduled',
      notes: raw.notes.trim(),
    };

    this.saving.set(true);

    this.appointmentsService.create(payload).subscribe({
      next: () => {
        const selectedDate = this.createLocalDate(raw.date);

        this.selectedDate.set(selectedDate);
        this.currentPage.set(1);
        this.showAppointmentForm.set(false);

        this.form.reset({
          customerId: '',
          date: raw.date,
          time: '',
          notes: '',
        });

        this.loadAppointments();
      },
      error: (error) => {
        console.error('Error al crear la cita:', error);

        this.saving.set(false);
      },
    });
  }

  // =========================================================
  // Remove
  // =========================================================

  remove(id: string): void {
    if (!id) {
      return;
    }

    this.appointmentsService.remove(id).subscribe({
      next: () => {
        this.currentPage.set(1);
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Error al eliminar la cita:', error);
      },
    });
  }

  // =========================================================
  // Data
  // =========================================================

  private load(): void {
    this.loadAppointments();
    this.loadCustomers();
  }

  private loadAppointments(): void {
    this.loading.set(true);

    this.appointmentsService
      .list({
        page: 1,
        limit: 100,
      })
      .subscribe({
        next: (response) => {
          this.allAppointments.set(response.data);
          this.appointments.set(response.data);

          this.currentPage.set(1);

          this.loading.set(false);
          this.saving.set(false);
        },
        error: (error) => {
          console.error('Error al cargar las citas:', error);

          this.allAppointments.set([]);
          this.appointments.set([]);

          this.loading.set(false);
          this.saving.set(false);
        },
      });
  }

  private loadCustomers(): void {
    this.customersService
      .listAll()
      .subscribe({
        next: (customers) => {
          this.customers.set(customers);
        },
        error: (error) => {
          console.error('Error al cargar los clientes:', error);

          this.customers.set([]);
        },
      });
  }

  // =========================================================
  // Filtering
  // =========================================================

  private filterAppointmentsBySelectedDate(): void {
    const selectedDate = this.selectedDate();

    const filteredAppointments = this.allAppointments()
      .filter((appointment) => {
        const scheduledAt = new Date(appointment.scheduledAt);

        return this.isSameDate(scheduledAt, selectedDate);
      })
      .sort((firstAppointment, secondAppointment) => {
        const firstDate = new Date(firstAppointment.scheduledAt).getTime();

        const secondDate = new Date(secondAppointment.scheduledAt).getTime();

        return firstDate - secondDate;
      });

    this.appointments.set(filteredAppointments);

    if (this.currentPage() > this.totalPages()) {
      this.currentPage.set(this.totalPages());
    }
  }

  private isSameDate(firstDate: Date, secondDate: Date): boolean {
    return (
      firstDate.getFullYear() === secondDate.getFullYear() &&
      firstDate.getMonth() === secondDate.getMonth() &&
      firstDate.getDate() === secondDate.getDate()
    );
  }

  // =========================================================
  // Date helpers
  // =========================================================

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private buildScheduledAt(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number);

    const [hours, minutes] = time.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  }

  private createLocalDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);

    return new Date(year, month - 1, day);
  }
}
