import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  CreateCustomerMeasurementPayload,
  CustomerMeasurement,
  CustomerWithStore,
  CustomersService
} from '../data-access/customers.service';

@Component({
  selector: 'app-customers-page',
  imports: [ReactiveFormsModule],
  templateUrl: './customers-page.html',
  styleUrl: './customers-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomersPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly customersService = inject(CustomersService);

  readonly customers = signal<CustomerWithStore[]>([]);
  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly updating = signal(false);
  readonly createModalOpen = signal(false);
  readonly editModalOpen = signal(false);
  readonly detailsModalOpen = signal(false);
  readonly editingCustomerId = signal<string | null>(null);
  readonly selectedCustomer = signal<CustomerWithStore | null>(null);
  readonly customerMeasurement = signal<CustomerMeasurement | null>(null);
  readonly detailsLoading = signal(false);
  readonly creatingMeasurement = signal(false);
  readonly updatingMeasurement = signal(false);
  readonly measurementFormOpen = signal(false);
  readonly canCreateMeasurement = signal(false);
  readonly detailsErrorMessage = signal('');
  readonly measurementCreateSuccessMessage = signal('');
  readonly measurementCreateErrorMessage = signal('');
  readonly errorMessage = signal('');
  readonly createErrorMessage = signal('');
  readonly createSuccessMessage = signal('');
  readonly updateErrorMessage = signal('');
  readonly updateSuccessMessage = signal('');
  readonly isEmpty = computed(() => !this.loading() && this.customers().length === 0);

  readonly pageSize = signal(8);
  readonly currentPage = signal(1);
  readonly totalPages = computed(() => {
    const totalCustomers = this.customers().length;
    const pageSize = this.pageSize();

    return Math.max(1, Math.ceil(totalCustomers / pageSize));
  });
  readonly paginatedCustomers = computed(() => {
    const customers = this.customers();
    const currentPage = this.currentPage();
    const pageSize = this.pageSize();
    const startIndex = (currentPage - 1) * pageSize;

    return customers.slice(startIndex, startIndex + pageSize);
  });
  readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1)
  );
  readonly paginationStart = computed(() => {
    const totalCustomers = this.customers().length;

    if (totalCustomers === 0) {
      return 0;
    }

    return (this.currentPage() - 1) * this.pageSize() + 1;
  });
  readonly paginationEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.customers().length)
  );

  readonly createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(7)]]
  });

  readonly updateForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(7)]]
  });

  readonly createMeasurementForm = this.fb.group({
    chest: [null as number | null, [Validators.required, Validators.min(0.1)]],
    waist: [null as number | null, [Validators.required, Validators.min(0.1)]],
    hips: [null as number | null, [Validators.required, Validators.min(0.1)]],
    neck: [null as number | null, [Validators.required, Validators.min(0.1)]],
    sleeve: [null as number | null, [Validators.required, Validators.min(0.1)]],
    inseam: [null as number | null, [Validators.required, Validators.min(0.1)]],
    notes: ['', [Validators.maxLength(500)]]
  });

  constructor() {
    this.loadCustomers();
  }

  openCreateModal(): void {
    this.createModalOpen.set(true);
    this.createErrorMessage.set('');
  }

  closeCreateModal(): void {
    if (this.creating()) {
      return;
    }

    this.createModalOpen.set(false);
    this.createForm.reset({
      name: '',
      email: '',
      phone: ''
    });
    this.createErrorMessage.set('');
  }

  createCustomer(): void {
    if (this.createForm.invalid || this.creating()) {
      this.createForm.markAllAsTouched();
      return;
    }

    const raw = this.createForm.getRawValue();

    this.creating.set(true);
    this.createErrorMessage.set('');
    this.createSuccessMessage.set('');

    this.customersService
      .create({
        name: raw.name.trim(),
        email: raw.email.trim(),
        phone: raw.phone.trim()
      })
      .subscribe({
        next: (customer) => {
          this.customers.update((customers) => [customer, ...customers]);
          this.currentPage.set(1);
          this.createForm.reset({
            name: '',
            email: '',
            phone: ''
          });
          this.createSuccessMessage.set('Cliente creado correctamente.');
          this.updateSuccessMessage.set('');
          this.createModalOpen.set(false);
          this.creating.set(false);
        },
        error: () => {
          this.createErrorMessage.set('No fue posible crear el cliente.');
          this.creating.set(false);
        }
      });
  }

  startEdit(customer: CustomerWithStore): void {
    this.editingCustomerId.set(customer.id);
    this.editModalOpen.set(true);
    this.updateForm.setValue({
      name: customer.name,
      email: customer.email,
      phone: customer.phone
    });
    this.updateErrorMessage.set('');
    this.updateSuccessMessage.set('');
  }

  openCustomerDetails(customer: CustomerWithStore): void {
    this.selectedCustomer.set(customer);
    this.customerMeasurement.set(null);
    this.canCreateMeasurement.set(false);
    this.measurementCreateSuccessMessage.set('');
    this.measurementCreateErrorMessage.set('');
    this.measurementFormOpen.set(false);
    this.detailsErrorMessage.set('');
    this.createMeasurementForm.reset({
      chest: null,
      waist: null,
      hips: null,
      neck: null,
      sleeve: null,
      inseam: null,
      notes: ''
    });
    this.detailsModalOpen.set(true);
    this.detailsLoading.set(true);

    this.customersService.measurement(customer.id).subscribe({
      next: (measurement) => {
        this.customerMeasurement.set(measurement);
        this.canCreateMeasurement.set(false);
        this.detailsLoading.set(false);
      },
      error: (error: unknown) => {
        const message = this.resolveErrorMessage(
          error,
          'No fue posible cargar las medidas del cliente.'
        );

        if (this.isMeasurementNotFoundError(message)) {
          this.canCreateMeasurement.set(true);
          this.detailsErrorMessage.set('');
        } else {
          this.detailsErrorMessage.set(message);
        }

        this.detailsLoading.set(false);
      }
    });
  }

  editSelectedCustomer(): void {
    const customer = this.selectedCustomer();

    if (!customer) {
      return;
    }

    this.closeCustomerDetails();
    this.startEdit(customer);
  }

  closeCustomerDetails(): void {
    this.detailsModalOpen.set(false);
    this.detailsLoading.set(false);
    this.creatingMeasurement.set(false);
    this.updatingMeasurement.set(false);
    this.measurementFormOpen.set(false);
    this.canCreateMeasurement.set(false);
    this.detailsErrorMessage.set('');
    this.measurementCreateSuccessMessage.set('');
    this.measurementCreateErrorMessage.set('');
    this.selectedCustomer.set(null);
    this.customerMeasurement.set(null);
  }

  createCustomerMeasurement(): void {
    const customer = this.selectedCustomer();

    if (!customer || this.createMeasurementForm.invalid || this.creatingMeasurement()) {
      this.createMeasurementForm.markAllAsTouched();
      return;
    }

    const raw = this.createMeasurementForm.getRawValue();

    if (
      raw.chest === null ||
      raw.waist === null ||
      raw.hips === null ||
      raw.neck === null ||
      raw.sleeve === null ||
      raw.inseam === null
    ) {
      this.createMeasurementForm.markAllAsTouched();
      return;
    }

    const payload: CreateCustomerMeasurementPayload = {
      customerId: customer.id,
      chest: Number(raw.chest),
      waist: Number(raw.waist),
      hips: Number(raw.hips),
      neck: Number(raw.neck),
      sleeve: Number(raw.sleeve),
      inseam: Number(raw.inseam),
      notes: raw.notes.trim()
    };

    this.creatingMeasurement.set(true);
    this.measurementCreateSuccessMessage.set('');
    this.measurementCreateErrorMessage.set('');

    this.customersService.createMeasurement(payload).subscribe({
      next: (measurement) => {
        this.customerMeasurement.set(measurement);
        this.canCreateMeasurement.set(false);
        this.measurementFormOpen.set(false);
        this.detailsErrorMessage.set('');
        this.measurementCreateSuccessMessage.set('Medidas registradas correctamente.');
        this.creatingMeasurement.set(false);
      },
      error: (error: unknown) => {
        this.measurementCreateErrorMessage.set(
          this.resolveErrorMessage(error, 'No fue posible registrar las medidas del cliente.')
        );
        this.creatingMeasurement.set(false);
      }
    });
  }

  updateCustomerMeasurement(): void {
    const customer = this.selectedCustomer();

    if (!customer || this.createMeasurementForm.invalid || this.updatingMeasurement()) {
      this.createMeasurementForm.markAllAsTouched();
      return;
    }

    const raw = this.createMeasurementForm.getRawValue();
    const payload: CreateCustomerMeasurementPayload = {
      customerId: customer.id,
      chest: Number(raw.chest),
      waist: Number(raw.waist),
      hips: Number(raw.hips),
      neck: Number(raw.neck),
      sleeve: Number(raw.sleeve),
      inseam: Number(raw.inseam),
      notes: raw.notes.trim()
    };

    this.updatingMeasurement.set(true);
    this.measurementCreateSuccessMessage.set('');
    this.measurementCreateErrorMessage.set('');

    this.customersService.updateMeasurement(customer.id, payload).subscribe({
      next: (measurement) => {
        this.customerMeasurement.set(measurement);
        this.measurementFormOpen.set(false);
        this.measurementCreateSuccessMessage.set('Medidas actualizadas correctamente.');
        this.updatingMeasurement.set(false);
      },
      error: (error: unknown) => {
        this.measurementCreateErrorMessage.set(
          this.resolveErrorMessage(error, 'No fue posible actualizar las medidas del cliente.')
        );
        this.updatingMeasurement.set(false);
      }
    });
  }

  openCreateMeasurementForm(): void {
    this.measurementCreateErrorMessage.set('');
    this.measurementCreateSuccessMessage.set('');
    this.createMeasurementForm.reset({
      chest: null,
      waist: null,
      hips: null,
      neck: null,
      sleeve: null,
      inseam: null,
      notes: ''
    });
    this.measurementFormOpen.set(true);
  }

  openEditMeasurementForm(): void {
    const measurement = this.customerMeasurement();

    if (!measurement) {
      return;
    }

    this.measurementCreateErrorMessage.set('');
    this.measurementCreateSuccessMessage.set('');
    this.createMeasurementForm.reset({
      chest: measurement.chest,
      waist: measurement.waist,
      hips: measurement.hips,
      neck: measurement.neck,
      sleeve: measurement.sleeve,
      inseam: measurement.inseam,
      notes: measurement.notes ?? ''
    });
    this.measurementFormOpen.set(true);
  }

  closeMeasurementForm(): void {
    if (this.creatingMeasurement() || this.updatingMeasurement()) {
      return;
    }

    this.measurementFormOpen.set(false);
    this.measurementCreateErrorMessage.set('');
  }

  formatMeasurementValue(value: number): string {
    const normalized = Number(value);

    if (!Number.isFinite(normalized)) {
      return String(value);
    }

    return Number.isInteger(normalized)
      ? normalized.toString()
      : normalized.toString().replace(/(\.\d*?[1-9])0+$/, '$1');
  }

  isMeasurementCreateInvalid(
    field: 'chest' | 'waist' | 'hips' | 'neck' | 'sleeve' | 'inseam' | 'notes'
  ): boolean {
    const control = this.createMeasurementForm.controls[field];

    return control.invalid && (control.touched || control.dirty);
  }

  cancelEdit(): void {
    this.editingCustomerId.set(null);
    this.editModalOpen.set(false);
    this.updateForm.reset({
      name: '',
      email: '',
      phone: ''
    });
    this.updating.set(false);
    this.updateErrorMessage.set('');
  }

  updateCustomer(): void {
    const customerId = this.editingCustomerId();

    if (!customerId || this.updateForm.invalid || this.updating()) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const raw = this.updateForm.getRawValue();

    this.updating.set(true);
    this.updateErrorMessage.set('');
    this.updateSuccessMessage.set('');

    this.customersService
      .update(customerId, {
        name: raw.name.trim(),
        email: raw.email.trim(),
        phone: raw.phone.trim()
      })
      .subscribe({
        next: (updatedCustomer) => {
          this.customers.update((customers) =>
            customers.map((customer) =>
              customer.id === updatedCustomer.id ? updatedCustomer : customer
            )
          );
          this.editingCustomerId.set(null);
          this.updateForm.reset({
            name: '',
            email: '',
            phone: ''
          });
          this.updateSuccessMessage.set('Cliente actualizado correctamente.');
          this.createSuccessMessage.set('');
          this.editModalOpen.set(false);
          this.updating.set(false);
        },
        error: () => {
          this.updateErrorMessage.set('No fue posible actualizar el cliente.');
          this.updating.set(false);
        }
      });
  }

  isInvalid(field: 'name' | 'email' | 'phone'): boolean {
    const control = this.createForm.controls[field];

    return control.invalid && (control.touched || control.dirty);
  }

  isUpdateInvalid(field: 'name' | 'email' | 'phone'): boolean {
    const control = this.updateForm.controls[field];

    return control.invalid && (control.touched || control.dirty);
  }

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

  private loadCustomers(): void {
    this.customersService.listAll().subscribe({
      next: (customers) => {
        this.customers.set(customers);

        if (this.currentPage() > this.totalPages()) {
          this.currentPage.set(this.totalPages());
        }

        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('No fue posible cargar los clientes.');
        this.loading.set(false);
      }
    });
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = error.error?.message;

      if (Array.isArray(backendMessage) && backendMessage.length > 0) {
        return String(backendMessage[0]);
      }

      if (typeof backendMessage === 'string' && backendMessage.trim()) {
        return backendMessage;
      }
    }

    return fallback;
  }

  private isMeasurementNotFoundError(message: string): boolean {
    return message.toLowerCase().includes('customer measurement not found');
  }
}
