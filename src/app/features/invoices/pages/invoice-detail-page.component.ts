import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import {
  CancelInvoicePayload,
  CreateCreditNotePayload,
  CreateDebitNotePayload,
  InvoiceDocument,
  IssueInvoicePayload,
  RegisterInvoicePaymentPayload,
  UpdateInvoiceDraftPayload,
} from '../../../core/models/invoices/invoice.models';
import { InvoiceStatus } from '../../../core/models/invoices/invoice-status.enum';
import { PaymentMethod } from '../../../core/models/invoices/payment-method.enum';
import { FiscalDocumentType } from '../../../core/models/invoices/fiscal-document-type.enum';
import { INVOICE_STATUS_LABELS } from '../../../core/models/invoices/invoice-status-labels.const';
import { InvoicesService } from '../data-access/invoices.service';
import { InvoiceDocumentComponent } from '../components/invoice-document.component';
import { buildInvoiceDocumentViewModel } from '../utils/invoice-document-view-model.util';
import { getInvoiceActionsAvailability } from '../utils/invoice-actions.util';

@Component({
  selector: 'app-invoice-detail-page',
  imports: [
    DatePipe,
    CurrencyPipe,
    RouterLink,
    InvoiceDocumentComponent,
    ReactiveFormsModule,
    MatDialogModule,
  ],
  templateUrl: './invoice-detail-page.html',
  styleUrl: './invoice-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceDetailPageComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly invoicesService = inject(InvoicesService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);

  @ViewChild('previewDocument')
  private readonly previewDocument?: ElementRef<HTMLElement>;

  @ViewChild('issueDialogTemplate')
  private readonly issueDialogTemplate?: TemplateRef<unknown>;

  @ViewChild('paymentDialogTemplate')
  private readonly paymentDialogTemplate?: TemplateRef<unknown>;

  @ViewChild('cancelDialogTemplate')
  private readonly cancelDialogTemplate?: TemplateRef<unknown>;

  private activeDialogRef: MatDialogRef<unknown> | null = null;

  readonly invoice = signal<InvoiceDocument | null>(null);
  readonly loading = signal(true);
  readonly previewVisible = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly savingDraft = signal(false);
  readonly issuing = signal(false);
  readonly registeringPayment = signal(false);
  readonly creatingCreditNote = signal(false);
  readonly creatingDebitNote = signal(false);
  readonly cancelling = signal(false);

  readonly draftEditVisible = signal(false);
  readonly creditFormVisible = signal(false);
  readonly debitFormVisible = signal(false);

  readonly itemsPage = signal(1);
  readonly paymentsPage = signal(1);
  readonly creditNotesPage = signal(1);
  readonly debitNotesPage = signal(1);

  readonly itemsPageSize = 8;
  readonly historyPageSize = 5;

  readonly draftForm = this.fb.nonNullable.group({
    currency: ['DOP', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
    dueAt: [''],
    notes: [''],
    termsAndConditions: [''],
  });

  readonly issueForm = this.fb.nonNullable.group({
    fiscalDocumentType: [FiscalDocumentType.CONSUMER, Validators.required],
    fiscalNumber: [''],
    dueAt: [''],
  });

  readonly paymentForm = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: [PaymentMethod.CASH, Validators.required],
    reference: [''],
    notes: [''],
    paidAt: [''],
  });

  readonly creditNoteForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(3)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    fiscalNumber: [''],
  });

  readonly debitNoteForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(3)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    fiscalNumber: [''],
  });

  readonly cancelForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(3)]],
  });

  readonly actions = computed(() => {
    const currentInvoice = this.invoice();

    if (!currentInvoice) {
      return getInvoiceActionsAvailability(InvoiceStatus.CANCELLED);
    }

    return getInvoiceActionsAvailability(currentInvoice.status);
  });

  readonly documentViewModel = computed(() => {
    const currentInvoice = this.invoice();

    if (!currentInvoice) {
      return null;
    }

    return buildInvoiceDocumentViewModel(currentInvoice);
  });

  readonly paymentProgress = computed(() => {
    const currentInvoice = this.invoice();

    if (!currentInvoice || currentInvoice.total <= 0) {
      return 0;
    }

    const progress = (currentInvoice.amountPaid / currentInvoice.total) * 100;

    return Math.min(100, Math.max(0, Math.round(progress)));
  });

  readonly paginatedItems = computed(() => {
    const items = this.invoice()?.items ?? [];

    return this.slicePage(items, this.itemsPage(), this.itemsPageSize);
  });

  readonly paginatedPayments = computed(() => {
    const payments = this.invoice()?.payments ?? [];

    return this.slicePage(payments, this.paymentsPage(), this.historyPageSize);
  });

  readonly paginatedCreditNotes = computed(() => {
    const notes = this.invoice()?.creditNotes ?? [];

    return this.slicePage(notes, this.creditNotesPage(), this.historyPageSize);
  });

  readonly paginatedDebitNotes = computed(() => {
    const notes = this.invoice()?.debitNotes ?? [];

    return this.slicePage(notes, this.debitNotesPage(), this.historyPageSize);
  });

  readonly itemsTotalPages = computed(() =>
    this.totalPages(this.invoice()?.items.length ?? 0, this.itemsPageSize),
  );

  readonly itemsPaginationStart = computed(() => {
    const total = this.invoice()?.items.length ?? 0;

    if (total === 0) {
      return 0;
    }

    return (this.itemsPage() - 1) * this.itemsPageSize + 1;
  });

  readonly itemsPaginationEnd = computed(() =>
    Math.min(
      this.itemsPage() * this.itemsPageSize,
      this.invoice()?.items.length ?? 0,
    ),
  );

  readonly paymentsTotalPages = computed(() =>
    this.totalPages(this.invoice()?.payments.length ?? 0, this.historyPageSize),
  );

  readonly creditNotesTotalPages = computed(() =>
    this.totalPages(this.invoice()?.creditNotes.length ?? 0, this.historyPageSize),
  );

  readonly debitNotesTotalPages = computed(() =>
    this.totalPages(this.invoice()?.debitNotes.length ?? 0, this.historyPageSize),
  );

  constructor() {
    const invoiceId = this.route.snapshot.paramMap.get('id');

    if (!invoiceId) {
      this.loading.set(false);
      this.errorMessage.set('No se encontró el identificador de factura.');
      return;
    }

    this.loadInvoice(invoiceId);
  }

  loadInvoice(invoiceId: string): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.invoicesService
      .detail(invoiceId)
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (invoice) => {
          this.invoice.set(invoice);
          this.patchForms(invoice);
        },
        error: (error) => {
          this.invoice.set(null);
          this.errorMessage.set(this.resolveLoadInvoiceError(error));
        },
      });
  }

  openDraftForm(): void {
    this.closeActiveDialog();
    this.closeInlineForms();

    this.draftEditVisible.set(true);
  }

  openIssueForm(): void {
    if (!this.issueDialogTemplate) {
      return;
    }

    this.closeInlineForms();
    this.openDialog(this.issueDialogTemplate);
  }

  openPaymentForm(): void {
    if (!this.paymentDialogTemplate) {
      return;
    }

    const currentInvoice = this.invoice();

    if (!currentInvoice) {
      return;
    }

    this.paymentForm.patchValue({
      amount: currentInvoice.balance > 0 ? currentInvoice.balance : 0,
    });

    this.closeInlineForms();
    this.openDialog(this.paymentDialogTemplate);
  }

  openCreditNoteForm(): void {
    this.closeActiveDialog();
    this.closeInlineForms();

    this.creditFormVisible.set(true);
  }

  openDebitNoteForm(): void {
    this.closeActiveDialog();
    this.closeInlineForms();

    this.debitFormVisible.set(true);
  }

  openCancelForm(): void {
    if (!this.cancelDialogTemplate) {
      return;
    }

    this.closeInlineForms();
    this.openDialog(this.cancelDialogTemplate);
  }

  saveDraft(): void {
    const currentInvoice = this.invoice();

    if (!currentInvoice || this.draftForm.invalid || this.savingDraft()) {
      this.draftForm.markAllAsTouched();
      return;
    }

    const raw = this.draftForm.getRawValue();

    const payload: UpdateInvoiceDraftPayload = {};

    const currency = raw.currency.trim().toUpperCase();

    if (currency) {
      payload.currency = currency;
    }

    if (raw.dueAt) {
      payload.dueAt = new Date(raw.dueAt).toISOString();
    }

    if (raw.notes.trim()) {
      payload.notes = raw.notes.trim();
    }

    if (raw.termsAndConditions.trim()) {
      payload.termsAndConditions = raw.termsAndConditions.trim();
    }

    this.savingDraft.set(true);
    this.clearMessages();

    this.invoicesService
      .updateDraft(currentInvoice.id, payload)
      .pipe(
        finalize(() => {
          this.savingDraft.set(false);
        }),
      )
      .subscribe({
        next: (invoice) => {
          this.invoice.set(invoice);
          this.patchForms(invoice);
          this.draftEditVisible.set(false);

          this.showSuccess('Borrador actualizado correctamente.');
        },
        error: () => {
          this.showError('No fue posible actualizar el borrador.');
        },
      });
  }

  issueInvoice(): void {
    const currentInvoice = this.invoice();

    if (!currentInvoice || this.issueForm.invalid || this.issuing()) {
      this.issueForm.markAllAsTouched();
      return;
    }

    const raw = this.issueForm.getRawValue();

    const payload: IssueInvoicePayload = {
      fiscalDocumentType: raw.fiscalDocumentType,
    };

    if (raw.fiscalNumber.trim()) {
      payload.fiscalNumber = raw.fiscalNumber.trim();
    }

    if (raw.dueAt) {
      payload.dueAt = new Date(raw.dueAt).toISOString();
    }

    this.issuing.set(true);
    this.clearMessages();

    this.invoicesService
      .issue(currentInvoice.id, payload)
      .pipe(
        finalize(() => {
          this.issuing.set(false);
        }),
      )
      .subscribe({
        next: (invoice) => {
          this.invoice.set(invoice);
          this.patchForms(invoice);
          this.closeActiveDialog();

          this.showSuccess('Factura emitida correctamente.');
        },
        error: () => {
          this.showError('No fue posible emitir la factura.');
        },
      });
  }

  registerPayment(): void {
    const currentInvoice = this.invoice();

    if (!currentInvoice || this.paymentForm.invalid || this.registeringPayment()) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const raw = this.paymentForm.getRawValue();

    const amount = this.toFinitePositiveNumber(raw.amount);

    if (amount === null) {
      this.showError('Ingresa un monto válido mayor que cero.');
      return;
    }

    if (amount > currentInvoice.balance) {
      this.showError('El monto del pago no puede superar el balance actual.');
      return;
    }

    const payload: RegisterInvoicePaymentPayload = {
      amount,
      paymentMethod: raw.paymentMethod,
    };

    if (raw.reference.trim()) {
      payload.reference = raw.reference.trim();
    }

    if (raw.notes.trim()) {
      payload.notes = raw.notes.trim();
    }

    if (raw.paidAt) {
      payload.paidAt = new Date(raw.paidAt).toISOString();
    }

    this.registeringPayment.set(true);
    this.clearMessages();

    this.invoicesService
      .registerPayment(currentInvoice.id, payload)
      .pipe(
        finalize(() => {
          this.registeringPayment.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.closeActiveDialog();

          this.notify('Pago registrado correctamente.');

          this.reloadAfterOperation(currentInvoice.id, 'Pago registrado correctamente.');
        },
        error: () => {
          this.showError('No fue posible registrar el pago.');
        },
      });
  }

  createCreditNote(): void {
    const currentInvoice = this.invoice();

    if (!currentInvoice || this.creditNoteForm.invalid || this.creatingCreditNote()) {
      this.creditNoteForm.markAllAsTouched();
      return;
    }

    const raw = this.creditNoteForm.getRawValue();

    const amount = this.toFinitePositiveNumber(raw.amount);

    if (amount === null) {
      this.showError('Ingresa un monto válido mayor que cero.');
      return;
    }

    const payload: CreateCreditNotePayload = {
      reason: raw.reason.trim(),
      amount,
    };

    if (raw.fiscalNumber.trim()) {
      payload.fiscalNumber = raw.fiscalNumber.trim();
    }

    this.creatingCreditNote.set(true);
    this.clearMessages();

    this.invoicesService
      .createCreditNote(currentInvoice.id, payload)
      .pipe(
        finalize(() => {
          this.creatingCreditNote.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.creditFormVisible.set(false);

          this.notify('Nota de crédito creada correctamente.');

          this.reloadAfterOperation(currentInvoice.id, 'Nota de crédito creada correctamente.');
        },
        error: () => {
          this.showError('No fue posible crear la nota de crédito.');
        },
      });
  }

  createDebitNote(): void {
    const currentInvoice = this.invoice();

    if (!currentInvoice || this.debitNoteForm.invalid || this.creatingDebitNote()) {
      this.debitNoteForm.markAllAsTouched();
      return;
    }

    const raw = this.debitNoteForm.getRawValue();

    const amount = this.toFinitePositiveNumber(raw.amount);

    if (amount === null) {
      this.showError('Ingresa un monto válido mayor que cero.');
      return;
    }

    const payload: CreateDebitNotePayload = {
      reason: raw.reason.trim(),
      amount,
    };

    if (raw.fiscalNumber.trim()) {
      payload.fiscalNumber = raw.fiscalNumber.trim();
    }

    this.creatingDebitNote.set(true);
    this.clearMessages();

    this.invoicesService
      .createDebitNote(currentInvoice.id, payload)
      .pipe(
        finalize(() => {
          this.creatingDebitNote.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.debitFormVisible.set(false);

          this.notify('Nota de débito creada correctamente.');

          this.reloadAfterOperation(currentInvoice.id, 'Nota de débito creada correctamente.');
        },
        error: () => {
          this.showError('No fue posible crear la nota de débito.');
        },
      });
  }

  cancelInvoice(): void {
    const currentInvoice = this.invoice();

    if (!currentInvoice || this.cancelForm.invalid || this.cancelling()) {
      this.cancelForm.markAllAsTouched();
      return;
    }

    const payload: CancelInvoicePayload = {
      reason: this.cancelForm.getRawValue().reason.trim(),
    };

    this.cancelling.set(true);
    this.clearMessages();

    this.invoicesService
      .cancel(currentInvoice.id, payload)
      .pipe(
        finalize(() => {
          this.cancelling.set(false);
        }),
      )
      .subscribe({
        next: (invoice) => {
          this.invoice.set(invoice);
          this.patchForms(invoice);
          this.closeActiveDialog();

          this.showSuccess('Factura cancelada correctamente.');
        },
        error: () => {
          this.showError('No fue posible cancelar la factura.');
        },
      });
  }

  showPreview(): void {
    this.previewVisible.set(true);

    queueMicrotask(() => {
      this.previewDocument?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  primaryActionLabel(): string {
    const currentInvoice = this.invoice();

    if (!currentInvoice) {
      return 'Previsualizar';
    }

    switch (currentInvoice.status) {
      case InvoiceStatus.DRAFT:
        return 'Emitir factura';

      case InvoiceStatus.ISSUED:
      case InvoiceStatus.PARTIALLY_PAID:
        return 'Registrar pago';

      default:
        return 'Previsualizar';
    }
  }

  runPrimaryAction(): void {
    const currentInvoice = this.invoice();

    if (!currentInvoice) {
      return;
    }

    switch (currentInvoice.status) {
      case InvoiceStatus.DRAFT:
        this.openIssueForm();
        return;

      case InvoiceStatus.ISSUED:
      case InvoiceStatus.PARTIALLY_PAID:
        this.openPaymentForm();
        return;

      default:
        this.showPreview();
    }
  }

  printInvoice(): void {
    this.printDocumentOnly();
  }

  exportPdf(): void {
    this.printDocumentOnly();

    this.notify('Selecciona "Guardar como PDF" en la ventana de impresión.');
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

  previousItemsPage(): void {
    this.itemsPage.update((page) => Math.max(1, page - 1));
  }

  nextItemsPage(): void {
    this.itemsPage.update((page) => Math.min(this.itemsTotalPages(), page + 1));
  }

  previousPaymentsPage(): void {
    this.paymentsPage.update((page) => Math.max(1, page - 1));
  }

  nextPaymentsPage(): void {
    this.paymentsPage.update((page) => Math.min(this.paymentsTotalPages(), page + 1));
  }

  previousCreditNotesPage(): void {
    this.creditNotesPage.update((page) => Math.max(1, page - 1));
  }

  nextCreditNotesPage(): void {
    this.creditNotesPage.update((page) => Math.min(this.creditNotesTotalPages(), page + 1));
  }

  previousDebitNotesPage(): void {
    this.debitNotesPage.update((page) => Math.max(1, page - 1));
  }

  nextDebitNotesPage(): void {
    this.debitNotesPage.update((page) => Math.min(this.debitNotesTotalPages(), page + 1));
  }

  closeAllForms(): void {
    this.closeInlineForms();
    this.closeActiveDialog();
  }

  closeActiveDialog(): void {
    this.activeDialogRef?.close();
    this.activeDialogRef = null;
  }

  ngOnDestroy(): void {
    this.closeActiveDialog();
  }

  private closeInlineForms(): void {
    this.draftEditVisible.set(false);
    this.creditFormVisible.set(false);
    this.debitFormVisible.set(false);
  }

  private openDialog(template: TemplateRef<unknown>): void {
    this.closeActiveDialog();

    this.activeDialogRef = this.dialog.open(template, {
      panelClass: 'th-dialog-panel',
      width: 'min(560px, calc(100vw - 2rem))',
      maxWidth: '95vw',
      autoFocus: true,
      restoreFocus: true,
      disableClose: false,
    });
  }

  private reloadAfterOperation(invoiceId: string, successMessage: string): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.invoicesService
      .detail(invoiceId)
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (invoice) => {
          this.invoice.set(invoice);
          this.patchForms(invoice);
          this.successMessage.set(successMessage);
        },
        error: (error) => {
          this.errorMessage.set(this.resolveLoadInvoiceError(error));
        },
      });
  }

  private printDocumentOnly(): void {
    if (!this.previewVisible()) {
      this.previewVisible.set(true);
    }

    setTimeout(() => {
      const previewElement = this.previewDocument?.nativeElement;

      if (!previewElement) {
        this.notify('No fue posible preparar el documento.');
        return;
      }

      const popup = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768');

      if (!popup) {
        this.notify('Tu navegador bloqueó la ventana de impresión.');
        return;
      }

      const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((node) => node.outerHTML)
        .join('\n');

      popup.document.open();

      popup.document.write(
        `<!doctype html>


<html lang="es">
<head>
<meta charset="utf-8">
<title>Factura</title>
${headStyles}
<style>
html,body{margin:0;padding:0;background:white}
body{padding:16px}
@media print{body{padding:0}}
</style>
</head>
<body>
${previewElement.innerHTML}
</body>
</html>`,
      );

      popup.document.close();

      const doPrint = () => {
        popup.focus();
        popup.print();
      };

      if (popup.document.readyState === 'complete') {
        setTimeout(doPrint, 60);
      } else {
        popup.addEventListener('load', () => setTimeout(doPrint, 60), {
          once: true,
        });
      }

      popup.addEventListener('afterprint', () => popup.close(), {
        once: true,
      });
    });
  }

  private notify(message: string): void {
    this.snackbar.open(message, 'Cerrar', {
      duration: 3200,
    });
  }

  private showSuccess(message: string): void {
    this.errorMessage.set('');
    this.successMessage.set(message);
    this.notify(message);
  }

  private showError(message: string): void {
    this.successMessage.set('');
    this.errorMessage.set(message);
    this.notify(message);
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private totalPages(totalItems: number, pageSize: number): number {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }

  private slicePage<T>(source: readonly T[], currentPage: number, pageSize: number): T[] {
    const page = Math.max(1, currentPage);

    const start = (page - 1) * pageSize;

    return source.slice(start, start + pageSize);
  }

  private resolveLoadInvoiceError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible cargar la factura.';
    }

    const backendMessage = error.error?.message;

    const message = Array.isArray(backendMessage) ? backendMessage.join(', ') : backendMessage;

    if (
      typeof message === 'string' &&
      message.toLowerCase().includes('numeric value must be finite')
    ) {
      return 'No se puede mostrar esta factura porque contiene números inválidos en origen. Revisa el pedido relacionado y vuelve a intentar.';
    }

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    return 'No fue posible cargar la factura.';
  }

  private toFinitePositiveNumber(value: unknown): number | null {
    const parsed = typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }

  private patchForms(invoice: InvoiceDocument): void {
    this.resetPagination();

    this.draftForm.reset({
      currency: invoice.currency || 'DOP',
      dueAt: this.toDateTimeLocal(invoice.dueAt),
      notes: invoice.notes ?? '',
      termsAndConditions: invoice.termsAndConditions ?? '',
    });

    this.issueForm.reset({
      fiscalDocumentType: invoice.fiscalDocumentType ?? FiscalDocumentType.CONSUMER,
      fiscalNumber: invoice.fiscalNumber ?? '',
      dueAt: this.toDateTimeLocal(invoice.dueAt),
    });

    this.paymentForm.reset({
      amount: invoice.balance > 0 ? invoice.balance : 0,
      paymentMethod: PaymentMethod.CASH,
      reference: '',
      notes: '',
      paidAt: '',
    });

    this.creditNoteForm.reset({
      reason: '',
      amount: 0,
      fiscalNumber: '',
    });

    this.debitNoteForm.reset({
      reason: '',
      amount: 0,
      fiscalNumber: '',
    });

    this.cancelForm.reset({
      reason: '',
    });
  }

  private resetPagination(): void {
    this.itemsPage.set(1);
    this.paymentsPage.set(1);
    this.creditNotesPage.set(1);
    this.debitNotesPage.set(1);
  }

  private toDateTimeLocal(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const offset = date.getTimezoneOffset();

    const localDate = new Date(date.getTime() - offset * 60_000);

    return localDate.toISOString().slice(0, 16);
  }
}