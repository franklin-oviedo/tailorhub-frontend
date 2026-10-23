import { InvoiceStatus } from '../../../core/models/invoices/invoice-status.enum';

export interface InvoiceActionsAvailability {
  canEditDraft: boolean;
  canIssue: boolean;
  canRegisterPayment: boolean;
  canCreateCreditNote: boolean;
  canCreateDebitNote: boolean;
  canCancel: boolean;
  canExport: boolean;
}

export const getInvoiceActionsAvailability = (status: InvoiceStatus): InvoiceActionsAvailability => {
  if (status === InvoiceStatus.DRAFT) {
    return {
      canEditDraft: true,
      canIssue: true,
      canRegisterPayment: false,
      canCreateCreditNote: false,
      canCreateDebitNote: false,
      canCancel: true,
      canExport: false
    };
  }

  if (status === InvoiceStatus.ISSUED) {
    return {
      canEditDraft: false,
      canIssue: false,
      canRegisterPayment: true,
      canCreateCreditNote: true,
      canCreateDebitNote: true,
      canCancel: true,
      canExport: true
    };
  }

  if (status === InvoiceStatus.PARTIALLY_PAID) {
    return {
      canEditDraft: false,
      canIssue: false,
      canRegisterPayment: true,
      canCreateCreditNote: true,
      canCreateDebitNote: true,
      canCancel: true,
      canExport: true
    };
  }

  if (status === InvoiceStatus.PAID) {
    return {
      canEditDraft: false,
      canIssue: false,
      canRegisterPayment: false,
      canCreateCreditNote: true,
      canCreateDebitNote: true,
      canCancel: false,
      canExport: true
    };
  }

  return {
    canEditDraft: false,
    canIssue: false,
    canRegisterPayment: false,
    canCreateCreditNote: false,
    canCreateDebitNote: false,
    canCancel: false,
    canExport: true
  };
};
