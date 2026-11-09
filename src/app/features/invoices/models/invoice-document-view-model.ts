import { InvoiceStatus } from '../../../core/models/invoices/invoice-status.enum';
import { FiscalDocumentType } from '../../../core/models/invoices/fiscal-document-type.enum';

export interface InvoiceDocumentLineViewModel {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
}

export interface InvoiceDocumentViewModel {
  logoUrl: string | null;
  sealUrl: string | null;
  companyName: string;
  invoiceId: string;  
  invoiceNumber: string | null;
  fiscalNumber: string | null;
  orderId: string | null;
  orderReference: string | null;
  status: InvoiceStatus;
  statusLabel: string;
  issuedAt: string | null;
  dueDate: string | null;
  fiscalDocumentType: FiscalDocumentType | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerRnc: string | null;
  customerAddress: string | null;
  currencyCode: string;
  lines: InvoiceDocumentLineViewModel[];
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  exemptAmount: number;
  taxTotal: number;
  grandTotal: number;
  amountPaid: number;
  balance: number;
  notes: string | null;
  termsAndConditions: string | null;
}
