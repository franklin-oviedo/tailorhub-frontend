import { PaginatedResponse } from '../domain.models';
import { DiscountType } from './discount-type.enum';
import { FiscalDocumentType } from './fiscal-document-type.enum';
import { InvoiceStatus } from './invoice-status.enum';
import { PaymentMethod } from './payment-method.enum';

export interface InvoiceListQuery {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  orderId?: string;
  customerId?: string;
  invoiceNumber?: string;
  fiscalNumber?: string;
  fiscalDocumentType?: FiscalDocumentType;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateInvoiceFromOrderItemPayload {
  orderItemId: string;
  quantity?: number;
  discountType?: DiscountType;
  discountValue?: number;
  isTaxable?: boolean;
  taxRate?: number;
}

export interface CreateInvoiceFromOrderPayload {
  orderId: string;
  currency?: string;
  dueAt?: string;
  notes?: string;
  termsAndConditions?: string;
  discountType?: DiscountType;
  discountValue?: number;
  items?: CreateInvoiceFromOrderItemPayload[];
}

export interface UpdateInvoiceDraftItemPayload {
  id: string;
  quantity?: number;
  unitPrice?: number;
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  isTaxable?: boolean;
  taxRate?: number;
}

export interface UpdateInvoiceDraftPayload {
  currency?: string;
  dueAt?: string;
  notes?: string;
  termsAndConditions?: string;
  discountType?: DiscountType;
  discountValue?: number;
  items?: UpdateInvoiceDraftItemPayload[];
}

export interface IssueInvoicePayload {
  fiscalDocumentType?: FiscalDocumentType;
  fiscalNumber?: string;
  dueAt?: string;
}

export interface RegisterInvoicePaymentPayload {
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  paidAt?: string;
}

export interface CreateCreditNotePayload {
  reason: string;
  amount: number;
  fiscalNumber?: string;
  affectedItems?: unknown[];
}

export interface CreateDebitNotePayload {
  reason: string;
  amount: number;
  fiscalNumber?: string;
}

export interface CancelInvoicePayload {
  reason: string;
}

export interface InvoiceDocumentItem {
  id: string;
  orderItemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountType: DiscountType | null;
  discountValue: number;
  discountAmount: number;
  taxableBase: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

export interface InvoiceSnapshotCustomer {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  rnc?: string | null;
  address?: string | null;
  [key: string]: unknown;
}

export interface InvoiceSnapshotOrder {
  id?: string;
  orderNumber?: string | null;
  createdAt?: string | null;
  [key: string]: unknown;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  paidAt?: string | null;
  [key: string]: unknown;
}

export interface InvoiceCreditNote {
  id: string;
  reason: string;
  amount: number;
  fiscalNumber?: string | null;
  createdAt?: string | null;
  [key: string]: unknown;
}

export interface InvoiceDebitNote {
  id: string;
  reason: string;
  amount: number;
  fiscalNumber?: string | null;
  createdAt?: string | null;
  [key: string]: unknown;
}

export interface InvoiceDocument {
  id: string;
  invoiceNumber: string | null;
  fiscalNumber: string | null;
  fiscalDocumentType: FiscalDocumentType | null;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  exemptAmount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balance: number;
  issuedAt: string | null;
  dueAt: string | null;
  notes: string | null;
  termsAndConditions: string | null;
  customerSnapshot: InvoiceSnapshotCustomer;
  orderSnapshot: InvoiceSnapshotOrder;
  items: InvoiceDocumentItem[];
  payments: InvoicePayment[];
  creditNotes: InvoiceCreditNote[];
  debitNotes: InvoiceDebitNote[];
}

export interface InvoiceListResponse extends PaginatedResponse<InvoiceDocument> {}

export interface FiscalReportQuery {
  dateFrom: string;
  dateTo: string;
  fiscalDocumentType?: FiscalDocumentType;
  status?: InvoiceStatus;
}

export interface FiscalReportRecord {
  [key: string]: unknown;
}

export interface FiscalReportResponse {
  data: FiscalReportRecord[];
}
