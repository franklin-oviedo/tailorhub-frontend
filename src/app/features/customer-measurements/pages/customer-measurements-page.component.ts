import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { CustomerMeasurement, CustomerWithStore, CustomersService } from '../../customers/data-access/customers.service';

const MEASUREMENT_STORAGE_PREFIX = '__TH_MEASUREMENTS_V1__';

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

interface MeasurementGroup {
  readonly title: string;
  readonly fields: ReadonlyArray<{ key: MeasurementFieldKey; label: string }>;
}

interface MeasurementDisplayGroup {
  readonly title: string;
  readonly values: ReadonlyArray<{ label: string; value: string }>;
}

const MEASUREMENT_GROUPS: readonly MeasurementGroup[] = [
  {
    title: 'Medidas de pantalón 👖 (damas)',
    fields: [
      { key: 'pantsWaist', label: 'Cintura' },
      { key: 'pantsBasinet', label: 'Bacinete' },
      { key: 'pantsTotalLength', label: 'Largo total' },
      { key: 'pantsKneeWidth', label: 'Ancho de rodilla' },
      { key: 'pantsHemWidth', label: 'Ancho de ruedo' },
      { key: 'pantsRiseHeight', label: 'Altura de tiro' },
    ],
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
      { key: 'shirtBackPart', label: 'Trasera' },
    ],
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
      { key: 'jacketSleeveOpeningWidth', label: 'Ancho boca manga' },
    ],
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
      { key: 'dressBustToNippleHeight', label: 'Altura de busto al pezon' },
      { key: 'dressFullBustHeight', label: 'Altura de busco completo' },
      { key: 'dressArmholeWidth', label: 'Ancho de sisa' },
    ],
  },
];

@Component({
  selector: 'app-customer-measurements-page',
  imports: [ReactiveFormsModule],
  templateUrl: './customer-measurements-page.html',
  styleUrl: './customer-measurements-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerMeasurementsPageComponent {
  private readonly customersService = inject(CustomersService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly loadingCustomers = signal(false);
  readonly loadingMeasurement = signal(false);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);
  readonly viewingSelectedCustomer = signal(false);
  readonly editing = signal(false);

  readonly errorMessage = signal('');
  readonly saveSuccessMessage = signal('');
  readonly saveErrorMessage = signal('');

  readonly customers = signal<CustomerWithStore[]>([]);
  readonly currentMeasurement = signal<CustomerMeasurement | null>(null);

  readonly measurementGroups = MEASUREMENT_GROUPS;

  readonly selectCustomerForm = this.fb.nonNullable.group({
    customerId: ['', Validators.required],
  });

  readonly measurementForm = this.fb.group({
    pantsWaist: [null as number | null, [Validators.min(0.1)]],
    pantsBasinet: [null as number | null, [Validators.min(0.1)]],
    pantsTotalLength: [null as number | null, [Validators.min(0.1)]],
    pantsKneeWidth: [null as number | null, [Validators.min(0.1)]],
    pantsHemWidth: [null as number | null, [Validators.min(0.1)]],
    pantsRiseHeight: [null as number | null, [Validators.min(0.1)]],
    shirtBackLength: [null as number | null, [Validators.min(0.1)]],
    shirtTorsoLength: [null as number | null, [Validators.min(0.1)]],
    shirtTotalLength: [null as number | null, [Validators.min(0.1)]],
    shirtChestWidth: [null as number | null, [Validators.min(0.1)]],
    shirtWaistWidth: [null as number | null, [Validators.min(0.1)]],
    shirtBasinetWidth: [null as number | null, [Validators.min(0.1)]],
    shirtSleeveTotalLength: [null as number | null, [Validators.min(0.1)]],
    shirtArmWidth: [null as number | null, [Validators.min(0.1)]],
    shirtCuffWidth: [null as number | null, [Validators.min(0.1)]],
    shirtFrontChest: [null as number | null, [Validators.min(0.1)]],
    shirtNeckWidth: [null as number | null, [Validators.min(0.1)]],
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
    notes: ['', [Validators.maxLength(3000)]],
  });

  readonly selectedCustomer = computed(() => {
    const customerId = this.selectCustomerForm.controls.customerId.value.trim();
    return this.customers().find((customer) => customer.id === customerId) ?? null;
  });

  readonly displayGroups = computed<MeasurementDisplayGroup[]>(() => {
    const measurement = this.currentMeasurement();

    if (!measurement) {
      return [];
    }

    return this.mapStructuredMeasurementsToDisplay(this.extractStructuredValuesFromMeasurement(measurement));
  });

  readonly measurementNotes = computed(() => {
    const measurement = this.currentMeasurement();
    if (!measurement) {
      return 'Sin notas registradas.';
    }

    const note = this.extractNote(measurement.notes);
    return note.length > 0 ? note : 'Sin notas registradas.';
  });

  constructor() {
    this.loadCustomers();
    const preselectedCustomerId = this.route.snapshot.queryParamMap.get('customerId')?.trim() ?? '';
    if (preselectedCustomerId.length > 0) {
      this.selectCustomerForm.controls.customerId.setValue(preselectedCustomerId);
      this.openSelectorModal();
    }
  }

  openSelectorModal(): void {
    this.modalOpen.set(true);
    this.viewingSelectedCustomer.set(false);
    this.editing.set(false);
    this.currentMeasurement.set(null);
    this.errorMessage.set('');
    this.saveErrorMessage.set('');
    this.saveSuccessMessage.set('');

    const customerId = this.selectCustomerForm.controls.customerId.value.trim();
    if (!customerId && this.customers().length > 0) {
      this.selectCustomerForm.controls.customerId.setValue(this.customers()[0].id);
    }
  }

  closeModal(): void {
    if (this.saving()) {
      return;
    }

    this.modalOpen.set(false);
  }

  viewSelectedCustomerMeasurements(): void {
    if (this.selectCustomerForm.invalid || this.loadingMeasurement()) {
      this.selectCustomerForm.markAllAsTouched();
      return;
    }

    const customerId = this.selectCustomerForm.controls.customerId.value.trim();
    if (!customerId) {
      return;
    }

    this.errorMessage.set('');
    this.saveErrorMessage.set('');
    this.saveSuccessMessage.set('');
    this.loadingMeasurement.set(true);

    this.customersService
      .measurement(customerId)
      .pipe(finalize(() => this.loadingMeasurement.set(false)))
      .subscribe({
        next: (measurement) => {
          this.currentMeasurement.set(measurement);
          this.viewingSelectedCustomer.set(true);
          this.editing.set(false);
        },
        error: () => {
          this.currentMeasurement.set(null);
          this.viewingSelectedCustomer.set(true);
          this.editing.set(false);
          this.errorMessage.set('Este cliente todavía no tiene medidas registradas.');
        },
      });
  }

  chooseAnotherCustomer(): void {
    this.viewingSelectedCustomer.set(false);
    this.editing.set(false);
    this.currentMeasurement.set(null);
    this.errorMessage.set('');
    this.saveErrorMessage.set('');
    this.saveSuccessMessage.set('');
  }

  startEditing(): void {
    const measurement = this.currentMeasurement();
    if (!measurement) {
      return;
    }

    this.measurementForm.reset({
      ...this.emptyFormValues(),
      ...this.extractStructuredValuesFromMeasurement(measurement),
      notes: this.extractNote(measurement.notes),
    });
    this.editing.set(true);
    this.saveErrorMessage.set('');
    this.saveSuccessMessage.set('');
  }

  cancelEditing(): void {
    if (this.saving()) {
      return;
    }

    this.editing.set(false);
    this.saveErrorMessage.set('');
  }

  updateMeasurement(): void {
    if (this.measurementForm.invalid || this.saving()) {
      this.measurementForm.markAllAsTouched();
      return;
    }

    const measurement = this.currentMeasurement();
    const customerId = this.selectCustomerForm.controls.customerId.value.trim();
    if (!measurement || !customerId) {
      return;
    }

    const payload = this.buildUpdatePayload(customerId);

    this.saving.set(true);
    this.saveErrorMessage.set('');
    this.saveSuccessMessage.set('');

    this.customersService
      .updateMeasurement(customerId, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updatedMeasurement) => {
          this.currentMeasurement.set(updatedMeasurement);
          this.editing.set(false);
          this.saveSuccessMessage.set('Medidas actualizadas correctamente.');
        },
        error: () => {
          this.saveErrorMessage.set('No fue posible actualizar las medidas del cliente.');
        },
      });
  }

  isSelectCustomerInvalid(): boolean {
    const control = this.selectCustomerForm.controls.customerId;
    return control.invalid && (control.touched || control.dirty);
  }

  isMeasurementInvalid(field: keyof typeof this.measurementForm.controls): boolean {
    const control = this.measurementForm.controls[field];
    return control.invalid && (control.touched || control.dirty);
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

  customerLabel(customer: CustomerWithStore): string {
    const storeName = customer.store?.name?.trim();
    return storeName ? `${customer.name} • ${storeName}` : customer.name;
  }

  private loadCustomers(): void {
    this.loadingCustomers.set(true);

    this.customersService
      .listAll()
      .pipe(finalize(() => this.loadingCustomers.set(false)))
      .subscribe({
        next: (customers) => {
          this.customers.set(customers);

          const currentValue = this.selectCustomerForm.controls.customerId.value.trim();
          const isValid = customers.some((customer) => customer.id === currentValue);

          if (!isValid && customers.length > 0) {
            this.selectCustomerForm.controls.customerId.setValue(customers[0].id);
          }
        },
        error: () => {
          this.customers.set([]);
        },
      });
  }

  private emptyFormValues(): Record<MeasurementFieldKey, number | null> {
    return {
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
    };
  }

  private buildUpdatePayload(customerId: string): {
    customerId: string;
    chest?: number | null;
    waist?: number | null;
    hips?: number | null;
    neck?: number | null;
    sleeve?: number | null;
    inseam?: number | null;
    notes?: string;
  } {
    const raw = this.measurementForm.getRawValue() as Record<string, unknown>;
    const structured = this.extractStructuredFromRaw(raw);

    const chest = this.asNullableNumber(structured.shirtChestWidth);
    const waist = this.asNullableNumber(structured.pantsWaist);
    const hips = this.asNullableNumber(structured.pantsBasinet);
    const neck = this.asNullableNumber(structured.shirtNeckWidth);
    const sleeve = this.asNullableNumber(structured.shirtSleeveTotalLength);
    const inseam = this.asNullableNumber(structured.pantsTotalLength);
    const rawNotes = raw['notes'];
    const noteText = typeof rawNotes === 'string' ? rawNotes.trim() : '';

    return {
      customerId,
      ...(chest !== null ? { chest } : {}),
      ...(waist !== null ? { waist } : {}),
      ...(hips !== null ? { hips } : {}),
      ...(neck !== null ? { neck } : {}),
      ...(sleeve !== null ? { sleeve } : {}),
      ...(inseam !== null ? { inseam } : {}),
      notes: this.serializeStructuredMeasurements(structured, noteText),
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

  private extractStructuredValuesFromMeasurement(
    measurement: CustomerMeasurement
  ): Record<MeasurementFieldKey, number | null> {
    const parsed = this.deserializeStructuredMeasurements(measurement.notes);

    if (parsed) {
      return parsed;
    }

    const fallback = this.emptyFormValues();
    fallback.shirtChestWidth = this.asNullableNumber(measurement.chest);
    fallback.pantsWaist = this.asNullableNumber(measurement.waist);
    fallback.pantsBasinet = this.asNullableNumber(measurement.hips);
    fallback.shirtNeckWidth = this.asNullableNumber(measurement.neck);
    fallback.shirtSleeveTotalLength = this.asNullableNumber(measurement.sleeve);
    fallback.pantsTotalLength = this.asNullableNumber(measurement.inseam);

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
              value: this.formatMeasurementValue(value),
            };
          })
          .filter((entry): entry is { label: string; value: string } => entry !== null);

        return {
          title: group.title,
          values,
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

  private extractNote(rawNotes: string | null): string {
    if (typeof rawNotes !== 'string') {
      return '';
    }

    if (!rawNotes.startsWith(MEASUREMENT_STORAGE_PREFIX)) {
      return rawNotes;
    }

    const serialized = rawNotes.slice(MEASUREMENT_STORAGE_PREFIX.length);

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
}
