import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { FiscalDocumentType } from '../../../core/models/invoices/fiscal-document-type.enum';
import { InvoiceStatus } from '../../../core/models/invoices/invoice-status.enum';
import { FiscalReportRecord } from '../../../core/models/invoices/invoice.models';
import { InvoicesService } from '../data-access/invoices.service';

@Component({
  selector: 'app-invoice-fiscal-report-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './invoice-fiscal-report-page.html',
  styleUrl: './invoice-fiscal-report-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceFiscalReportPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly invoicesService = inject(InvoicesService);

  readonly loading = signal(false);
  readonly hasSearched = signal(false);
  readonly errorMessage = signal('');
  readonly reportRows = signal<FiscalReportRecord[]>([]);
  readonly currentPage = signal(1);
  readonly pageSize = signal(15);

  readonly form = this.fb.nonNullable.group({
    dateFrom: ['', Validators.required],
    dateTo: ['', Validators.required],
    fiscalDocumentType: [''],
    status: [''],
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.reportRows().length / this.pageSize())),
  );

  readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  readonly paginatedRows = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();

    return this.reportRows().slice(start, start + this.pageSize());
  });

  readonly columns = computed(() => {
    const rows = this.reportRows();

    if (rows.length === 0) {
      return [];
    }

    return Object.keys(rows[0]);
  });

  readonly paginationStart = computed(() => {
    if (this.reportRows().length === 0) {
      return 0;
    }

    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly paginationEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.reportRows().length),
  );

  loadReport(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    if (new Date(raw.dateFrom) > new Date(raw.dateTo)) {
      this.errorMessage.set('La fecha inicial no puede ser mayor que la fecha final.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.hasSearched.set(true);
    this.currentPage.set(1);

    this.invoicesService
      .getFiscalReport({
        dateFrom: this.startOfDayIso(raw.dateFrom),
        dateTo: this.endOfDayIso(raw.dateTo),
        fiscalDocumentType: raw.fiscalDocumentType
          ? (raw.fiscalDocumentType as FiscalDocumentType)
          : undefined,
        status: raw.status ? (raw.status as InvoiceStatus) : undefined,
      })
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.reportRows.set(response.data ?? []);
        },
        error: () => {
          this.reportRows.set([]);
          this.errorMessage.set('No fue posible cargar el reporte fiscal.');
        },
      });
  }

  clearFilters(): void {
    if (this.loading()) {
      return;
    }

    this.form.reset({
      dateFrom: '',
      dateTo: '',
      fiscalDocumentType: '',
      status: '',
    });

    this.reportRows.set([]);
    this.currentPage.set(1);
    this.hasSearched.set(false);
    this.errorMessage.set('');
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }

    this.currentPage.set(page);
  }

  updatePageSize(size: string): void {
    const parsedSize = Number(size);

    if (!Number.isFinite(parsedSize) || parsedSize < 1) {
      return;
    }

    this.pageSize.set(parsedSize);
    this.currentPage.set(1);
  }

  columnLabel(column: string): string {
    const labels: Record<string, string> = {
      invoiceNumber: 'Factura',
      fiscalNumber: 'NCF / e-NCF',
      fiscalDocumentType: 'Tipo fiscal',
      status: 'Estado',
      customerName: 'Cliente',
      customerRnc: 'RNC / Cédula',
      issuedAt: 'Fecha',
      subtotal: 'Subtotal',
      taxAmount: 'ITBIS',
      total: 'Total',
      amountPaid: 'Pagado',
      balance: 'Pendiente',
      currency: 'Moneda',
    };

    return labels[column] ?? this.humanizeColumn(column);
  }

  formatCellValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  private humanizeColumn(column: string): string {
    return column
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/^\w/, (value) => value.toUpperCase());
  }

  private startOfDayIso(value: string): string {
    return new Date(`${value}T00:00:00`).toISOString();
  }

  private endOfDayIso(value: string): string {
    return new Date(`${value}T23:59:59.999`).toISOString();
  }
}
