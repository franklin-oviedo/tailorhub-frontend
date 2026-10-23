import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { InvoiceDocument, InvoiceListQuery } from '../../../core/models/invoices/invoice.models';
import { FiscalDocumentType } from '../../../core/models/invoices/fiscal-document-type.enum';
import { InvoiceStatus } from '../../../core/models/invoices/invoice-status.enum';
import { INVOICE_STATUS_LABELS } from '../../../core/models/invoices/invoice-status-labels.const';
import { StoreContextService } from '../../../core/services/store-context.service';
import { InvoicesService } from '../data-access/invoices.service';

@Component({
  selector: 'app-invoices-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, ReactiveFormsModule],
  templateUrl: './invoices-page.html',
  styleUrl: './invoices-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesPageComponent {
  private readonly invoicesService = inject(InvoicesService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly storeContext = inject(StoreContextService);

  private loadedStoreId: string | null = null;
  private requestId = 0;

  readonly invoices = signal<InvoiceDocument[]>([]);
  readonly loading = signal(true);
  readonly hasLoaded = signal(false);
  readonly errorMessage = signal('');
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly totalItems = signal(0);
  readonly pageSize = signal(10);

  readonly filtersForm = this.fb.nonNullable.group({
    customerId: [''],
    orderId: [''],
    invoiceNumber: [''],
    fiscalNumber: [''],
    status: [''],
    fiscalDocumentType: [''],
    dateFrom: [''],
    dateTo: [''],
  });

  readonly financialSummary = computed(() => {
    const source = this.invoices();

    return source.reduce(
      (accumulator, invoice) => {
        accumulator.total += Number(invoice.total) || 0;
        accumulator.paid += Number(invoice.amountPaid) || 0;
        accumulator.balance += Number(invoice.balance) || 0;
        return accumulator;
      },
      {
        total: 0,
        paid: 0,
        balance: 0,
        currency: source[0]?.currency ?? 'DOP',
      },
    );
  });

  readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  readonly paginationStart = computed(() => {
    if (this.totalItems() === 0) {
      return 0;
    }

    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly paginationEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.totalItems()),
  );

  constructor() {
    effect(() => {
      const storeId = this.storeContext.storeId();

      if (!storeId) {
        this.loading.set(true);
        this.hasLoaded.set(false);
        return;
      }

      if (this.loadedStoreId === storeId) {
        return;
      }

      this.loadedStoreId = storeId;

      untracked(() => {
        this.invoices.set([]);
        this.resetPagination();
        this.loadInvoices(1);
      });
    });
  }

  hasActiveFilters(): boolean {
    const raw = this.filtersForm.getRawValue();

    return Boolean(
      raw.customerId.trim() ||
      raw.orderId.trim() ||
      raw.invoiceNumber.trim() ||
      raw.fiscalNumber.trim() ||
      raw.status.trim() ||
      raw.fiscalDocumentType.trim() ||
      raw.dateFrom ||
      raw.dateTo,
    );
  }

  loadInvoices(page: number): void {
    const storeId = this.storeContext.storeId();

    if (!storeId) {
      this.loading.set(true);
      return;
    }

    const currentRequestId = ++this.requestId;

    this.loading.set(true);
    this.hasLoaded.set(false);
    this.errorMessage.set('');

    const query = this.buildQuery(page);

    this.invoicesService
      .list(query)
      .pipe(
        finalize(() => {
          if (currentRequestId !== this.requestId) {
            return;
          }

          this.loading.set(false);
          this.hasLoaded.set(true);
        }),
      )
      .subscribe({
        next: (response) => {
          if (currentRequestId !== this.requestId) {
            return;
          }

          const data = Array.isArray(response?.data) ? response.data : [];

          this.invoices.set(data);

          if (response?.meta) {
            this.currentPage.set(response.meta.page ?? page);
            this.pageSize.set(response.meta.limit ?? this.pageSize());
            this.totalItems.set(response.meta.totalItems ?? data.length);
            this.totalPages.set(response.meta.totalPages ?? 1);
          } else {
            this.currentPage.set(page);
            this.totalItems.set(data.length);
            this.totalPages.set(1);
          }
        },
        error: () => {
          if (currentRequestId !== this.requestId) {
            return;
          }

          this.invoices.set([]);
          this.resetPagination();
          this.errorMessage.set('No fue posible cargar las facturas.');
        },
      });
  }

  applyFilters(): void {
    if (this.loading()) {
      return;
    }

    this.resetPagination();
    this.loadInvoices(1);
  }

  clearFilters(): void {
    if (this.loading()) {
      return;
    }

    this.filtersForm.reset({
      customerId: '',
      orderId: '',
      invoiceNumber: '',
      fiscalNumber: '',
      status: '',
      fiscalDocumentType: '',
      dateFrom: '',
      dateTo: '',
    });

    this.resetPagination();
    this.loadInvoices(1);
  }

  openFiscalReport(): void {
    this.router.navigate(['/invoices/fiscal-report']);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage() || this.loading()) {
      return;
    }

    this.loadInvoices(page);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  statusLabel(status: InvoiceStatus): string {
    return INVOICE_STATUS_LABELS[status] ?? status;
  }

  statusClass(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'status-badge is-paid';
      case InvoiceStatus.PARTIALLY_PAID:
        return 'status-badge is-partial';
      case InvoiceStatus.ISSUED:
        return 'status-badge is-issued';
      case InvoiceStatus.DRAFT:
        return 'status-badge is-draft';
      case InvoiceStatus.CANCELLED:
        return 'status-badge is-cancelled';
      default:
        return 'status-badge is-credited';
    }
  }

  customerName(invoice: InvoiceDocument): string {
    const name = invoice.customerSnapshot?.name;

    return typeof name === 'string' && name.trim() ? name : '-';
  }

  orderReference(invoice: InvoiceDocument): string {
    const orderNumber = invoice.orderSnapshot?.orderNumber;
    const orderId = invoice.orderSnapshot?.id;

    if (typeof orderNumber === 'string' && orderNumber.trim()) {
      return orderNumber;
    }

    if (typeof orderId === 'string' && orderId.trim()) {
      return orderId;
    }

    return '-';
  }

  private resetPagination(): void {
    this.currentPage.set(1);
    this.totalPages.set(1);
    this.totalItems.set(0);
  }

  private buildQuery(page: number): InvoiceListQuery {
    const raw = this.filtersForm.getRawValue();

    const query: InvoiceListQuery = {
      page,
      limit: this.pageSize(),
    };

    const customerId = raw.customerId.trim();
    const orderId = raw.orderId.trim();
    const invoiceNumber = raw.invoiceNumber.trim();
    const fiscalNumber = raw.fiscalNumber.trim();
    const status = raw.status.trim();
    const fiscalDocumentType = raw.fiscalDocumentType.trim();

    if (customerId) {
      query.customerId = customerId;
    }

    if (orderId) {
      query.orderId = orderId;
    }

    if (invoiceNumber) {
      query.invoiceNumber = invoiceNumber;
    }

    if (fiscalNumber) {
      query.fiscalNumber = fiscalNumber;
    }

    if (status) {
      query.status = status as InvoiceStatus;
    }

    if (fiscalDocumentType) {
      query.fiscalDocumentType = fiscalDocumentType as FiscalDocumentType;
    }

    if (raw.dateFrom) {
      query.dateFrom = this.startOfDayIso(raw.dateFrom);
    }

    if (raw.dateTo) {
      query.dateTo = this.endOfDayIso(raw.dateTo);
    }

    return query;
  }

  private startOfDayIso(value: string): string {
    return new Date(`${value}T00:00:00`).toISOString();
  }

  private endOfDayIso(value: string): string {
    return new Date(`${value}T23:59:59.999`).toISOString();
  }
}
