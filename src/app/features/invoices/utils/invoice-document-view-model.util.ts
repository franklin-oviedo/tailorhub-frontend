import { INVOICE_STATUS_LABELS } from '../../../core/models/invoices/invoice-status-labels.const';
import { InvoiceDocument } from '../../../core/models/invoices/invoice.models';
import { InvoiceDocumentViewModel } from '../models/invoice-document-view-model';

const readString = (value: unknown): string | null => (typeof value === 'string' && value ? value : null);

export const buildInvoiceDocumentViewModel = (invoice: InvoiceDocument): InvoiceDocumentViewModel => {
  const customer = invoice.customerSnapshot;
  const order = invoice.orderSnapshot;

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    fiscalNumber: invoice.fiscalNumber,
    orderId: readString(order.id),
    orderReference: readString(order.orderNumber) ?? readString(order.id),
    status: invoice.status,
    statusLabel: INVOICE_STATUS_LABELS[invoice.status],
    issuedAt: invoice.issuedAt,
    dueDate: invoice.dueAt,
    fiscalDocumentType: invoice.fiscalDocumentType,
    customerName: readString(customer.name),
    customerEmail: readString(customer.email),
    customerPhone: readString(customer.phone),
    customerRnc: readString(customer.rnc),
    customerAddress: readString(customer.address),
    currencyCode: invoice.currency,
    lines: invoice.items.map((line) => {
      return {
        id: line.id,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountAmount: line.discountAmount,
        taxAmount: line.taxAmount,
        lineTotal: line.lineTotal
      };
    }),
    subtotal: invoice.subtotal,
    discountTotal: invoice.discountAmount,
    taxableAmount: invoice.taxableAmount,
    exemptAmount: invoice.exemptAmount,
    taxTotal: invoice.taxAmount,
    grandTotal: invoice.total,
    amountPaid: invoice.amountPaid,
    balance: invoice.balance,
    notes: invoice.notes,
    termsAndConditions: invoice.termsAndConditions
  };
};
