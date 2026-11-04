import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  CreateCustomerMeasurementPayload,
  CustomerMeasurement,
  CustomerWithStore,
  CustomersService
} from '../data-access/customers.service';

type MeasurementFieldKey =
  | 'pantsWaist'
  | 'pantsBasinet'
  | 'pantsTotalLength'
  | 'pantsKneeWidth'
  | 'pantsHemWidth'
  | 'pantsRiseHeight'
  | 'shirtBackLength'
  | 'shirtTorsoLength'
  | 'shirtTotalLength'
  | 'shirtChestWidth'
  | 'shirtWaistWidth'
  | 'shirtBasinetWidth'
  | 'shirtSleeveTotalLength'
  | 'shirtArmWidth'
  | 'shirtCuffWidth'
  | 'shirtFrontChest'
  | 'shirtNeckWidth'
  | 'shirtFrontPart'
  | 'shirtBackPart'
  | 'jacketBackLength'
  | 'jacketTorsoLength'
  | 'jacketTotalLength'
  | 'jacketChestWidthBust'
  | 'jacketWaistWidth'
  | 'jacketBasinetWidthHip'
  | 'jacketSleeveTotalLength'
  | 'jacketSleeveWidth'
  | 'jacketSleeveOpeningWidth'
  | 'dressBackLength'
  | 'dressTorsoLength'
  | 'dressTotalLength'
  | 'dressBustCircumference'
  | 'dressWaistCircumference'
  | 'dressHipCircumference'
  | 'dressBustSeparation'
  | 'dressHipHeight'
  | 'dressBackHipHeight'
  | 'dressBustToNippleHeight'
  | 'dressFullBustHeight'
  | 'dressArmholeWidth';

interface MeasurementFieldDefinition {
  key: MeasurementFieldKey;
  label: string;
}

interface MeasurementGroupDefinition {
  title: string;
  fields: readonly MeasurementFieldDefinition[];
}

interface MeasurementDisplayGroup {
  title: string;
  values: Array<{ label: string; value: string }>;
}

const MEASUREMENT_STORAGE_PREFIX = 'TH_MEASUREMENTS_V2:';

const MEASUREMENT_GROUPS: readonly MeasurementGroupDefinition[] = [
  {
    title: 'Medidas de pantalón (damas)',
    fields: [
      { key: 'pantsWaist', label: 'Cintura' },
      { key: 'pantsBasinet', label: 'Bacinete' },
      { key: 'pantsTotalLength', label: 'Largo total' },
      { key: 'pantsKneeWidth', label: 'Ancho de rodilla' },
      { key: 'pantsHemWidth', label: 'Ancho de ruedo' },
      { key: 'pantsRiseHeight', label: 'Altura de tiro' }
    ]
  },
  {
    title: 'Medidas de camisas',
    fields: [
      { key: 'shirtBackLength', label: 'Largo de espalda' },
      { key: 'shirtTorsoLength', label: 'Largo de talle' },
      { key: 'shirtTotalLength', label: 'Largo total' },
      { key: 'shirtChestWidth', label: 'Ancho de pecho' },
      { key: 'shirtWaistWidth', label: 'Ancho de cintura' },
      { key: 'shirtBasinetWidth', label: 'Ancho de bacinete' },
      { key: 'shirtSleeveTotalLength', label: 'Largo total de manga' },
      { key: 'shirtArmWidth', label: 'Ancho de brazo' },
      { key: 'shirtCuffWidth', label: 'Ancho de puños' },
      { key: 'shirtFrontChest', label: 'Frente de pecho' },
      { key: 'shirtNeckWidth', label: 'Ancho de cuello' },
      { key: 'shirtFrontPart', label: 'Delantera' },
      { key: 'shirtBackPart', label: 'Trasera' }
    ]
  },
  {
    title: 'Medidas de chaquetas (masculinas y femeninas)',
    fields: [
      { key: 'jacketBackLength', label: 'Largo de espalda' },
      { key: 'jacketTorsoLength', label: 'Largo de talle' },
      { key: 'jacketTotalLength', label: 'Largo total' },
      { key: 'jacketChestWidthBust', label: 'Ancho de pecho (busto)' },
      { key: 'jacketWaistWidth', label: 'Ancho de cintura' },
      { key: 'jacketBasinetWidthHip', label: 'Ancho de bacinete (cadera)' },
      { key: 'jacketSleeveTotalLength', label: 'Largo total de manga' },
      { key: 'jacketSleeveWidth', label: 'Ancho de manga' },
      { key: 'jacketSleeveOpeningWidth', label: 'Ancho boca manga' }
    ]
  },
  {
    title: 'Medidas de vestidos',
    fields: [
      { key: 'dressBackLength', label: 'Largo de espalda' },
      { key: 'dressTorsoLength', label: 'Largo de talle' },
      { key: 'dressTotalLength', label: 'Largo total' },
      { key: 'dressBustCircumference', label: 'Contorno de busto' },
      { key: 'dressWaistCircumference', label: 'Contorno de cintura' },
      { key: 'dressHipCircumference', label: 'Contorno de cadera' },
      { key: 'dressBustSeparation', label: 'Separación de busto' },
      { key: 'dressHipHeight', label: 'Altura de cadera' },
      { key: 'dressBackHipHeight', label: 'Altura de cadera trasera' },
      { key: 'dressBustToNippleHeight', label: 'Altura de busto al pezón' },
      { key: 'dressFullBustHeight', label: 'Altura de busto completo' },
      { key: 'dressArmholeWidth', label: 'Ancho de sisa' }
    ]
  }
];

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
    pantsWaist: [null as number | null, [Validators.required, Validators.min(0.1)]],
    pantsBasinet: [null as number | null, [Validators.required, Validators.min(0.1)]],
    pantsTotalLength: [null as number | null, [Validators.required, Validators.min(0.1)]],
    pantsKneeWidth: [null as number | null, [Validators.min(0.1)]],
    pantsHemWidth: [null as number | null, [Validators.min(0.1)]],
    pantsRiseHeight: [null as number | null, [Validators.min(0.1)]],
    shirtBackLength: [null as number | null, [Validators.min(0.1)]],
    shirtTorsoLength: [null as number | null, [Validators.min(0.1)]],
    shirtTotalLength: [null as number | null, [Validators.min(0.1)]],
    shirtChestWidth: [null as number | null, [Validators.required, Validators.min(0.1)]],
    shirtWaistWidth: [null as number | null, [Validators.min(0.1)]],
    shirtBasinetWidth: [null as number | null, [Validators.min(0.1)]],
    shirtSleeveTotalLength: [null as number | null, [Validators.required, Validators.min(0.1)]],
    shirtArmWidth: [null as number | null, [Validators.min(0.1)]],
    shirtCuffWidth: [null as number | null, [Validators.min(0.1)]],
    shirtFrontChest: [null as number | null, [Validators.min(0.1)]],
    shirtNeckWidth: [null as number | null, [Validators.required, Validators.min(0.1)]],
    shirtFrontPart: [null as number | null, [Validators.min(0.1)]],
    shirtBackPart: [null as number | null, [Validators.min(0.1)]],
    jacketBackLength: [null as number | null, [Validators.min(0.1)]],
    jacketTorsoLength: [null as number | null, [Validators.min(0.1)]],
    jacketTotalLength: [null as number | null, [Validators.min(0.1)]],
    jacketChestWidthBust: [null as number | null, [Validators.min(0.1)]],
    jacketWaistWidth: [null as number | null, [Validators.min(0.1)]],
    jacketBasinetWidthHip: [null as number | null, [Validators.min(0.1)]],
    jacketSleeveTotalLength: [null as number | null, [Validators.min(0.1)]],
    jacketSleeveWidth: [null as number | null, [Validators.min(0.1)]],
    jacketSleeveOpeningWidth: [null as number | null, [Validators.min(0.1)]],
    dressBackLength: [null as number | null, [Validators.min(0.1)]],
    dressTorsoLength: [null as number | null, [Validators.min(0.1)]],
    dressTotalLength: [null as number | null, [Validators.min(0.1)]],
    dressBustCircumference: [null as number | null, [Validators.min(0.1)]],
    dressWaistCircumference: [null as number | null, [Validators.min(0.1)]],
    dressHipCircumference: [null as number | null, [Validators.min(0.1)]],
    dressBustSeparation: [null as number | null, [Validators.min(0.1)]],
    dressHipHeight: [null as number | null, [Validators.min(0.1)]],
    dressBackHipHeight: [null as number | null, [Validators.min(0.1)]],
    dressBustToNippleHeight: [null as number | null, [Validators.min(0.1)]],
    dressFullBustHeight: [null as number | null, [Validators.min(0.1)]],
    dressArmholeWidth: [null as number | null, [Validators.min(0.1)]],
    notes: ['', [Validators.maxLength(3000)]]
  });
  readonly measurementGroups = MEASUREMENT_GROUPS;
  readonly measurementDisplayGroups = computed<MeasurementDisplayGroup[]>(() => {
    const measurement = this.customerMeasurement();

    if (!measurement) {
      return [];
    }

    return this.mapStructuredMeasurementsToDisplay(
      this.extractStructuredMeasurementsFromRecord(measurement)
    );
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
      pantsWaist: null,
      pantsBasinet: null,
      pantsTotalLength: null,
      pantsKneeWidth: null,
      pantsHemWidth: null,
      pantsRiseHeight: null,
      shirtBackLength: null,
      shirtTorsoLength: null,
      shirtTotalLength: null,
      shirtChestWidth: null,
      shirtWaistWidth: null,
      shirtBasinetWidth: null,
      shirtSleeveTotalLength: null,
      shirtArmWidth: null,
      shirtCuffWidth: null,
      shirtFrontChest: null,
      shirtNeckWidth: null,
      shirtFrontPart: null,
      shirtBackPart: null,
      jacketBackLength: null,
      jacketTorsoLength: null,
      jacketTotalLength: null,
      jacketChestWidthBust: null,
      jacketWaistWidth: null,
      jacketBasinetWidthHip: null,
      jacketSleeveTotalLength: null,
      jacketSleeveWidth: null,
      jacketSleeveOpeningWidth: null,
      dressBackLength: null,
      dressTorsoLength: null,
      dressTotalLength: null,
      dressBustCircumference: null,
      dressWaistCircumference: null,
      dressHipCircumference: null,
      dressBustSeparation: null,
      dressHipHeight: null,
      dressBackHipHeight: null,
      dressBustToNippleHeight: null,
      dressFullBustHeight: null,
      dressArmholeWidth: null,
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

    const payload = this.buildCustomerMeasurementPayload(customer.id);

    if (!payload) {
      this.createMeasurementForm.markAllAsTouched();
      return;
    }

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

    const payload = this.buildCustomerMeasurementPayload(customer.id);

    if (!payload) {
      this.createMeasurementForm.markAllAsTouched();
      return;
    }

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
      pantsWaist: null,
      pantsBasinet: null,
      pantsTotalLength: null,
      pantsKneeWidth: null,
      pantsHemWidth: null,
      pantsRiseHeight: null,
      shirtBackLength: null,
      shirtTorsoLength: null,
      shirtTotalLength: null,
      shirtChestWidth: null,
      shirtWaistWidth: null,
      shirtBasinetWidth: null,
      shirtSleeveTotalLength: null,
      shirtArmWidth: null,
      shirtCuffWidth: null,
      shirtFrontChest: null,
      shirtNeckWidth: null,
      shirtFrontPart: null,
      shirtBackPart: null,
      jacketBackLength: null,
      jacketTorsoLength: null,
      jacketTotalLength: null,
      jacketChestWidthBust: null,
      jacketWaistWidth: null,
      jacketBasinetWidthHip: null,
      jacketSleeveTotalLength: null,
      jacketSleeveWidth: null,
      jacketSleeveOpeningWidth: null,
      dressBackLength: null,
      dressTorsoLength: null,
      dressTotalLength: null,
      dressBustCircumference: null,
      dressWaistCircumference: null,
      dressHipCircumference: null,
      dressBustSeparation: null,
      dressHipHeight: null,
      dressBackHipHeight: null,
      dressBustToNippleHeight: null,
      dressFullBustHeight: null,
      dressArmholeWidth: null,
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
    const structuredValues = this.extractStructuredMeasurementsFromRecord(measurement);
    this.createMeasurementForm.reset({
      ...structuredValues,
      notes: this.extractMeasurementNoteText(measurement.notes)
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

  isMeasurementCreateInvalid(field: string): boolean {
    const control = this.createMeasurementForm.get(field);

    if (!control) {
      return false;
    }

    return control.invalid && (control.touched || control.dirty);
  }

  measurementNotesText(measurement: CustomerMeasurement): string {
    const content = this.extractMeasurementNoteText(measurement.notes);

    return content || 'Sin notas registradas.';
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

  private buildCustomerMeasurementPayload(customerId: string): CreateCustomerMeasurementPayload | null {
    const raw = this.createMeasurementForm.getRawValue();
    const structured = this.extractStructuredFromRaw(raw);

    const chest = this.asPositiveNumber(structured.shirtChestWidth);
    const waist = this.asPositiveNumber(structured.pantsWaist);
    const hips = this.asPositiveNumber(structured.pantsBasinet);
    const neck = this.asPositiveNumber(structured.shirtNeckWidth);
    const sleeve = this.asPositiveNumber(structured.shirtSleeveTotalLength);
    const inseam = this.asPositiveNumber(structured.pantsTotalLength);

    if (
      chest === null ||
      waist === null ||
      hips === null ||
      neck === null ||
      sleeve === null ||
      inseam === null
    ) {
      this.measurementCreateErrorMessage.set(
        'Completa como mínimo: cintura, bacinete, largo total de pantalón, ancho de pecho, largo total de manga y ancho de cuello.'
      );
      return null;
    }

    return {
      customerId,
      chest,
      waist,
      hips,
      neck,
      sleeve,
      inseam,
      notes: this.serializeStructuredMeasurements(
        structured,
        typeof raw.notes === 'string' ? raw.notes.trim() : ''
      )
    };
  }

  private extractStructuredFromRaw(raw: Record<string, unknown>): Record<MeasurementFieldKey, number | null> {
    const values = {} as Record<MeasurementFieldKey, number | null>;

    for (const group of this.measurementGroups) {
      for (const field of group.fields) {
        values[field.key] = this.asNullableNumber(raw[field.key]);
      }
    }

    return values;
  }

  private extractStructuredMeasurementsFromRecord(
    measurement: CustomerMeasurement
  ): Record<MeasurementFieldKey, number | null> {
    const parsed = this.deserializeStructuredMeasurements(measurement.notes);

    if (parsed) {
      return parsed;
    }

    const fallback = {} as Record<MeasurementFieldKey, number | null>;
    for (const group of this.measurementGroups) {
      for (const field of group.fields) {
        fallback[field.key] = null;
      }
    }

    fallback.shirtChestWidth = measurement.chest;
    fallback.pantsWaist = measurement.waist;
    fallback.pantsBasinet = measurement.hips;
    fallback.shirtNeckWidth = measurement.neck;
    fallback.shirtSleeveTotalLength = measurement.sleeve;
    fallback.pantsTotalLength = measurement.inseam;

    return fallback;
  }

  private mapStructuredMeasurementsToDisplay(
    measurements: Record<MeasurementFieldKey, number | null>
  ): MeasurementDisplayGroup[] {
    return this.measurementGroups
      .map((group) => {
        const values = group.fields
          .map((field) => {
            const value = measurements[field.key];

            if (value === null) {
              return null;
            }

            return {
              label: field.label,
              value: this.formatMeasurementValue(value)
            };
          })
          .filter((entry): entry is { label: string; value: string } => entry !== null);

        return {
          title: group.title,
          values
        };
      })
      .filter((group) => group.values.length > 0);
  }

  private serializeStructuredMeasurements(
    measurements: Record<MeasurementFieldKey, number | null>,
    note: string
  ): string {
    return `${MEASUREMENT_STORAGE_PREFIX}${JSON.stringify({ measurements, note })}`;
  }

  private deserializeStructuredMeasurements(notes: string | null): Record<MeasurementFieldKey, number | null> | null {
    if (typeof notes !== 'string' || !notes.startsWith(MEASUREMENT_STORAGE_PREFIX)) {
      return null;
    }

    const serialized = notes.slice(MEASUREMENT_STORAGE_PREFIX.length);

    try {
      const parsed = JSON.parse(serialized) as {
        measurements?: Record<MeasurementFieldKey, number | null>;
      };

      if (!parsed.measurements) {
        return null;
      }

      const result = {} as Record<MeasurementFieldKey, number | null>;

      for (const group of this.measurementGroups) {
        for (const field of group.fields) {
          result[field.key] = this.asNullableNumber(parsed.measurements[field.key]);
        }
      }

      return result;
    } catch {
      return null;
    }
  }

  private extractMeasurementNoteText(notes: string | null): string {
    if (typeof notes !== 'string') {
      return '';
    }

    if (!notes.startsWith(MEASUREMENT_STORAGE_PREFIX)) {
      return notes;
    }

    const serialized = notes.slice(MEASUREMENT_STORAGE_PREFIX.length);

    try {
      const parsed = JSON.parse(serialized) as { note?: string };
      return typeof parsed.note === 'string' ? parsed.note : '';
    } catch {
      return '';
    }
  }

  private asNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const normalized = Number(value);

    return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
  }

  private asPositiveNumber(value: number | null): number | null {
    if (value === null) {
      return null;
    }

    return Number.isFinite(value) && value > 0 ? value : null;
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
