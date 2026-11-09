import { describe, expect, it } from 'vitest';
import { FiscalDocumentType } from '../../../core/models/invoices/fiscal-document-type.enum';
import { InvoiceDocument } from '../../../core/models/invoices/invoice.models';
import { InvoiceStatus } from '../../../core/models/invoices/invoice-status.enum';
import { PaymentMethod } from '../../../core/models/invoices/payment-method.enum';
import { buildInvoiceDocumentViewModel } from './invoice-document-view-model.util';

const invoiceFixture: InvoiceDocument = {
  company: {
    name: 'TailorHub',
    logoUrl: 'https://cdn.tailorhub.com/logo.png'
  },
  id: 'inv-1',
  invoiceNumber: 'INV-000124',
  fiscalNumber: 'E3200000001',
  fiscalDocumentType: FiscalDocumentType.CONSUMER,
  status: InvoiceStatus.PARTIALLY_PAID,
  currency: 'DOP',
  subtotal: 1000,
  discountAmount: 100,
  taxableAmount: 900,
  exemptAmount: 0,
  taxAmount: 162,
  total: 1062,
  amountPaid: 600,
  balance: 462,
  issuedAt: '2026-09-09T00:00:00.000Z',
  dueAt: '2026-09-10T00:00:00.000Z',
  notes: 'nota',
  termsAndConditions: 'terminos',
  customerSnapshot: {
    id: 'c-1',
    name: 'Juan Perez',
    email: 'juan@example.com',
    phone: '8090000000',
    rnc: '101010101',
    address: 'Santo Domingo'
  },
  orderSnapshot: {
    id: 'o-1',
    orderNumber: 'ORD-0001'
  },
  items: [
    {
      id: 'line-1',
      orderItemId: 'oi-1',
      description: 'Traje',
      quantity: 1,
      unitPrice: 1000,
      discountType: null,
      discountValue: 0,
      discountAmount: 100,
      taxableBase: 900,
      taxRate: 18,
      taxAmount: 162,
      lineTotal: 1062
    }
  ],
  payments: [
    {
      id: 'pay-1',
      amount: 600,
      paymentMethod: PaymentMethod.CASH
    }
  ],
  creditNotes: [],
  debitNotes: []
};

describe('buildInvoiceDocumentViewModel', () => {
  it('uses backend financial values without recalculating totals', () => {
    const vm = buildInvoiceDocumentViewModel(invoiceFixture);

    expect(vm.subtotal).toBe(invoiceFixture.subtotal);
    expect(vm.discountTotal).toBe(invoiceFixture.discountAmount);
    expect(vm.taxableAmount).toBe(invoiceFixture.taxableAmount);
    expect(vm.taxTotal).toBe(invoiceFixture.taxAmount);
    expect(vm.grandTotal).toBe(invoiceFixture.total);
    expect(vm.amountPaid).toBe(invoiceFixture.amountPaid);
    expect(vm.balance).toBe(invoiceFixture.balance);
  });

  it('uses customer and order snapshots for document rendering', () => {
    const vm = buildInvoiceDocumentViewModel(invoiceFixture);

    expect(vm.customerName).toBe('Juan Perez');
    expect(vm.customerEmail).toBe('juan@example.com');
    expect(vm.orderId).toBe('o-1');
    expect(vm.orderReference).toBe('ORD-0001');
  });

  it('uses backend company logo field when logoUrl is empty', () => {
    const vm = buildInvoiceDocumentViewModel({
      ...invoiceFixture,
      company: {
        name: 'TailorHub',
        logoUrl: '',
        logo: 'https://cdn.tailorhub.com/logo-from-logo-field.png'
      }
    });

    expect(vm.logoUrl).toBe('https://cdn.tailorhub.com/logo-from-logo-field.png');
  });

  it('uses backend company seal field when available', () => {
    const vm = buildInvoiceDocumentViewModel({
      ...invoiceFixture,
      company: {
        name: 'TailorHub',
        logoUrl: 'https://cdn.tailorhub.com/logo.png',
        seal: 'https://cdn.tailorhub.com/seal.png'
      }
    });

    expect(vm.sealUrl).toBe('https://cdn.tailorhub.com/seal.png');
  });
});
