import { InvoiceStatus } from './invoice-status.enum';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'Borrador',
  [InvoiceStatus.ISSUED]: 'Emitida',
  [InvoiceStatus.PARTIALLY_PAID]: 'Pago parcial',
  [InvoiceStatus.PAID]: 'Pagada',
  [InvoiceStatus.CANCELLED]: 'Anulada',
  [InvoiceStatus.CREDITED]: 'Acreditada'
};
