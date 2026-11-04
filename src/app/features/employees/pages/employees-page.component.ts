import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { Store } from '../../../core/models/domain.models';
import { SessionService } from '../../../core/services/session.service';
import { StoresService } from '../../stores/data-access/stores.service';
import {
  CreateEmployeePayload,
  EmployeeRecord,
  EmployeesService
} from '../data-access/employees.service';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-employees-page',
  imports: [ReactiveFormsModule, MatDialogModule],
  templateUrl: './employees-page.html',
  styleUrl: './employees-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeesPageComponent implements OnDestroy {
  private static readonly PAGE_SIZE = 10;

  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly employeesService = inject(EmployeesService);
  private readonly storesService = inject(StoresService);
  private readonly session = inject(SessionService);

  @ViewChild('employeeDialogTemplate')
  private readonly employeeDialogTemplate?: TemplateRef<unknown>;

  private activeDialogRef: MatDialogRef<unknown> | null = null;

  readonly employees = signal<EmployeeRecord[]>([]);
  readonly stores = signal<Store[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly removingId = signal<string | null>(null);
  readonly loadingStores = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly searchTerm = signal('');
  readonly activeFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly currentPage = signal(1);
  readonly formMode = signal<FormMode>('create');
  readonly editingEmployeeId = signal<string | null>(null);

  readonly currentRole = computed(() => this.session.role());
  readonly currentStoreId = computed(() => this.resolveCurrentStoreId());
  readonly isManager = computed(() => this.currentRole() === 'manager');
  readonly filteredEmployees = computed(() => {
    const normalizedSearch = this.searchTerm().toLowerCase();

    return this.employees()
      .filter((employee) => {
        if (this.activeFilter() === 'active') {
          return employee.active;
        }

        if (this.activeFilter() === 'inactive') {
          return !employee.active;
        }

        return true;
      })
      .filter((employee) => {
        if (!normalizedSearch) {
          return true;
        }

        return [employee.name, employee.email, employee.phone]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      });
  });
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredEmployees().length / EmployeesPageComponent.PAGE_SIZE))
  );
  readonly paginatedEmployees = computed(() => {
    const start = (this.currentPage() - 1) * EmployeesPageComponent.PAGE_SIZE;

    return this.filteredEmployees().slice(start, start + EmployeesPageComponent.PAGE_SIZE);
  });
  readonly isEmpty = computed(() => !this.loading() && this.filteredEmployees().length === 0);
  readonly dialogTitle = computed(() =>
    this.formMode() === 'edit' ? 'Editar empleado' : 'Crear empleado'
  );

  readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    active: ['all' as 'all' | 'active' | 'inactive']
  });

  readonly employeeForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.email]],
    phone: [''],
    notes: [''],
    active: [true],
    storeId: ['', Validators.required],
    userId: ['']
  });

  constructor() {
    this.resetForm();
    this.loadStores();
    this.loadEmployees();
  }

  ngOnDestroy(): void {
    this.closeActiveDialog();
  }

  isInvalid(field: keyof typeof this.employeeForm.controls): boolean {
    const control = this.employeeForm.controls[field];

    return control.invalid && (control.touched || control.dirty);
  }

  applyFilters(): void {
    const values = this.filterForm.getRawValue();
    this.searchTerm.set(values.search.trim());
    this.activeFilter.set(values.active);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', active: 'all' });
    this.searchTerm.set('');
    this.activeFilter.set('all');
    this.currentPage.set(1);
  }

  nextPage(): void {
    if (this.currentPage() >= this.totalPages()) {
      return;
    }

    this.currentPage.update((page) => page + 1);
  }

  previousPage(): void {
    if (this.currentPage() <= 1) {
      return;
    }

    this.currentPage.update((page) => page - 1);
  }

  storeName(employee: EmployeeRecord): string {
    const storeId = employee.store?.id;

    if (!storeId) {
      return '-';
    }

    const mappedStore = this.stores().find((store) => store.id === storeId);

    return mappedStore?.name ?? storeId;
  }

  openCreateDialog(): void {
    this.formMode.set('create');
    this.editingEmployeeId.set(null);
    this.resetForm();
    this.errorMessage.set('');
    this.openDialog();
  }

  openEditDialog(employee: EmployeeRecord): void {
    this.formMode.set('edit');
    this.editingEmployeeId.set(employee.id);
    this.employeeForm.reset({
      name: employee.name,
      email: employee.email ?? '',
      phone: employee.phone ?? '',
      notes: employee.notes ?? '',
      active: employee.active,
      storeId: employee.store?.id ?? this.currentStoreId() ?? '',
      userId: employee.user?.id ?? ''
    });
    this.configureStoreControl();
    this.errorMessage.set('');
    this.openDialog();
  }

  closeDialog(): void {
    if (this.saving()) {
      return;
    }

    this.resetForm();
    this.closeActiveDialog();
  }

  submitEmployee(): void {
    if (this.employeeForm.invalid || this.saving()) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const raw = this.employeeForm.getRawValue();
    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload: CreateEmployeePayload = {
      name: raw.name.trim(),
      ...(raw.email.trim().length > 0 ? { email: raw.email.trim() } : {}),
      ...(raw.phone.trim().length > 0 ? { phone: raw.phone.trim() } : {}),
      ...(raw.notes.trim().length > 0 ? { notes: raw.notes.trim() } : {}),
      active: raw.active,
      ...(raw.storeId.trim().length > 0 ? { storeId: raw.storeId.trim() } : {}),
      ...(raw.userId.trim().length > 0 ? { userId: raw.userId.trim() } : {})
    };

    if (this.formMode() === 'edit') {
      const employeeId = this.editingEmployeeId();

      if (!employeeId) {
        this.saving.set(false);
        this.errorMessage.set('No fue posible identificar el empleado a editar.');
        return;
      }

      this.employeesService
        .update(employeeId, payload)
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({
          next: () => {
            this.successMessage.set('Empleado actualizado correctamente.');
            this.closeDialog();
            this.loadEmployees();
          },
          error: () => {
            this.errorMessage.set('No fue posible actualizar el empleado.');
          }
        });

      return;
    }

    this.employeesService
      .create(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Empleado creado correctamente.');
          this.closeDialog();
          this.loadEmployees();
        },
        error: () => {
          this.errorMessage.set('No fue posible crear el empleado.');
        }
      });
  }

  removeEmployee(employee: EmployeeRecord): void {
    if (this.removingId() !== null) {
      return;
    }

    if (!window.confirm(`¿Eliminar empleado ${employee.name}?`)) {
      return;
    }

    this.removingId.set(employee.id);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.employeesService
      .remove(employee.id)
      .pipe(finalize(() => this.removingId.set(null)))
      .subscribe({
        next: () => {
          this.successMessage.set('Empleado eliminado correctamente.');
          this.loadEmployees();
        },
        error: () => {
          this.errorMessage.set('No fue posible eliminar el empleado.');
        }
      });
  }

  private openDialog(): void {
    if (!this.employeeDialogTemplate) {
      return;
    }

    this.closeActiveDialog();
    this.activeDialogRef = this.dialog.open(this.employeeDialogTemplate, {
      panelClass: ['th-dialog-panel', 'th-employees-dialog-panel'],
      width: 'min(760px, calc(100vw - 2rem))',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: true,
      restoreFocus: true,
      disableClose: false
    });
  }

  private closeActiveDialog(): void {
    this.activeDialogRef?.close();
    this.activeDialogRef = null;
  }

  private resetForm(): void {
    this.employeeForm.reset({
      name: '',
      email: '',
      phone: '',
      notes: '',
      active: true,
      storeId: this.currentStoreId() ?? '',
      userId: ''
    });
    this.configureStoreControl();
  }

  private configureStoreControl(): void {
    if (this.isManager()) {
      this.employeeForm.controls.storeId.setValue(this.currentStoreId() ?? '');
      this.employeeForm.controls.storeId.disable({ emitEvent: false });
      return;
    }

    this.employeeForm.controls.storeId.enable({ emitEvent: false });
  }

  private loadEmployees(): void {
    this.loading.set(true);
    this.employeesService
      .listAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (employees) => {
          this.employees.set(employees);
          this.currentPage.set(1);
        },
        error: () => {
          this.employees.set([]);
          this.errorMessage.set('No fue posible cargar los empleados.');
        }
      });
  }

  private loadStores(): void {
    if (this.isManager()) {
      this.stores.set([]);
      return;
    }

    this.loadingStores.set(true);
    this.storesService
      .list({ page: 1, limit: 200 })
      .pipe(finalize(() => this.loadingStores.set(false)))
      .subscribe({
        next: (response) => {
          this.stores.set(response.data);
        },
        error: () => {
          this.stores.set([]);
        }
      });
  }

  private resolveCurrentStoreId(): string | null {
    const currentUser = this.session.user();

    if (!currentUser) {
      return null;
    }

    if (typeof currentUser.store?.id === 'string' && currentUser.store.id.trim().length > 0) {
      return currentUser.store.id.trim();
    }

    if (typeof currentUser.storeId === 'string' && currentUser.storeId.trim().length > 0) {
      return currentUser.storeId.trim();
    }

    return null;
  }
}
