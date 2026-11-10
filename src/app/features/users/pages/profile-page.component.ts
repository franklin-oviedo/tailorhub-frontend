import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { SessionService } from '../../../core/services/session.service';
import {
  CreateCustomerMeasurementPayload,
  CustomerMeasurement,
  CustomersService
} from '../../customers/data-access/customers.service';
import { UpdateUserPayload, UsersService } from '../data-access/users.service';

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly customersService = inject(CustomersService);
  private readonly session = inject(SessionService);

  readonly loading = signal(false);
  readonly loadingMeasurements = signal(false);
  readonly savingMeasurements = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly measurementErrorMessage = signal('');
  readonly measurementSuccessMessage = signal('');
  readonly customerMeasurement = signal<CustomerMeasurement | null>(null);
  readonly hasCustomerProfile = computed(() => !!this.session.user()?.customer?.id?.trim());

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(7)]],
    password: ['']
  });
  readonly measurementsForm = this.fb.nonNullable.group({
    chest: [0, [Validators.required, Validators.min(0.1)]],
    waist: [0, [Validators.required, Validators.min(0.1)]],
    hips: [0, [Validators.required, Validators.min(0.1)]],
    neck: [0, [Validators.required, Validators.min(0.1)]],
    sleeve: [0, [Validators.required, Validators.min(0.1)]],
    inseam: [0, [Validators.required, Validators.min(0.1)]],
    notes: ['']
  });

  constructor() {
    this.populateForm();
    this.loadMeasurements();
  }

  isInvalid(field: 'fullName' | 'email' | 'phone' | 'password'): boolean {
    const control = this.form.controls[field];

    return control.invalid && (control.touched || control.dirty);
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    const currentUser = this.session.user();
    if (!currentUser) {
      this.errorMessage.set('No hay una sesión activa.');
      return;
    }

    const values = this.form.getRawValue();
    const payload: UpdateUserPayload = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim()
    };

    if (values.password.trim().length > 0) {
      payload.password = values.password.trim();
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.usersService
      .update(currentUser.id, payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (updatedUser) => {
          this.session.setUser(updatedUser);
          this.successMessage.set('Tu información personal fue actualizada correctamente.');
          this.populateForm();
        },
        error: () => {
          this.errorMessage.set('No se pudo actualizar tu información personal. Inténtalo nuevamente.');
        }
      });
  }

  saveMeasurements(): void {
    if (this.measurementsForm.invalid || this.savingMeasurements()) {
      this.measurementsForm.markAllAsTouched();
      return;
    }

    const customerId = this.session.user()?.customer?.id?.trim() ?? '';
    if (!customerId) {
      this.measurementErrorMessage.set('Tu cuenta no tiene un cliente asociado para registrar medidas.');
      return;
    }

    const values = this.measurementsForm.getRawValue();
    const payload: CreateCustomerMeasurementPayload = {
      customerId,
      chest: Number(values.chest),
      waist: Number(values.waist),
      hips: Number(values.hips),
      neck: Number(values.neck),
      sleeve: Number(values.sleeve),
      inseam: Number(values.inseam),
      notes: values.notes.trim()
    };

    this.savingMeasurements.set(true);
    this.measurementErrorMessage.set('');
    this.measurementSuccessMessage.set('');

    const currentMeasurement = this.customerMeasurement();
    const request$ = currentMeasurement
      ? this.customersService.updateMeasurement(customerId, payload)
      : this.customersService.createMeasurement(payload);

    request$
      .pipe(finalize(() => this.savingMeasurements.set(false)))
      .subscribe({
        next: (measurement) => {
          this.customerMeasurement.set(measurement);
          this.patchMeasurementsForm(measurement);
          this.measurementSuccessMessage.set(
            currentMeasurement
              ? 'Tus medidas fueron actualizadas correctamente.'
              : 'Tus medidas fueron registradas correctamente.'
          );
        },
        error: () => {
          this.measurementErrorMessage.set('No se pudieron guardar tus medidas. Inténtalo nuevamente.');
        }
      });
  }

  private populateForm(): void {
    const user = this.session.user();

    if (!user) {
      return;
    }

    this.form.reset({
      fullName: user.fullName ?? user.employee?.name ?? user.customer?.name ?? '',
      email: user.email ?? user.employee?.email ?? user.customer?.email ?? '',
      phone: user.phone ?? user.employee?.phone ?? user.customer?.phone ?? '',
      password: ''
    });
  }

  private loadMeasurements(): void {
    const customerId = this.session.user()?.customer?.id?.trim() ?? '';
    if (!customerId) {
      return;
    }

    this.loadingMeasurements.set(true);

    this.customersService
      .measurement(customerId)
      .pipe(finalize(() => this.loadingMeasurements.set(false)))
      .subscribe({
        next: (measurement) => {
          this.customerMeasurement.set(measurement);
          this.patchMeasurementsForm(measurement);
        },
        error: () => {
          this.customerMeasurement.set(null);
        }
      });
  }

  private patchMeasurementsForm(measurement: CustomerMeasurement): void {
    this.measurementsForm.reset({
      chest: measurement.chest ?? 0,
      waist: measurement.waist ?? 0,
      hips: measurement.hips ?? 0,
      neck: measurement.neck ?? 0,
      sleeve: measurement.sleeve ?? 0,
      inseam: measurement.inseam ?? 0,
      notes: measurement.notes ?? ''
    });
  }
}
