import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CustomerWithStore, CustomersService } from '../data-access/customers.service';

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
  readonly editingCustomerId = signal<string | null>(null);
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
}
