import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PaymentMethod } from '../../../core/models/invoices/payment-method.enum';
import { ApiConfigService } from '../../../core/services/api-config.service';
import { InvoicesService } from './invoices.service';

describe('InvoicesService', () => {
  const httpStub = {
    get: vi.fn(() => of({})),
    post: vi.fn(() => of({})),
    patch: vi.fn(() => of({}))
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        InvoicesService,
        { provide: HttpClient, useValue: httpStub },
        { provide: ApiConfigService, useValue: { baseUrl: 'http://localhost:3000/api' } }
      ]
    });
  });

  it('should call list endpoint with query params', () => {
    const service = TestBed.inject(InvoicesService);
    service.list({ page: 2, limit: 15, orderId: 'order-1' }).subscribe();

    expect(httpStub.get).toHaveBeenCalledWith('http://localhost:3000/api/invoices', {
      params: { page: 2, limit: 15, orderId: 'order-1' }
    });
  });

  it('should call draft update endpoint with /draft suffix', () => {
    const service = TestBed.inject(InvoicesService);
    service.updateDraft('inv-1', { notes: 'ok' }).subscribe();

    expect(httpStub.patch).toHaveBeenCalledWith('http://localhost:3000/api/invoices/inv-1/draft', { notes: 'ok' });
  });

  it('should call issue, payment, credit, debit and cancel endpoints', () => {
    const service = TestBed.inject(InvoicesService);

    service.issue('inv-1', {}).subscribe();
    service.registerPayment('inv-1', { amount: 10, paymentMethod: PaymentMethod.CASH }).subscribe();
    service.createCreditNote('inv-1', { reason: 'Ajuste', amount: 5 }).subscribe();
    service.createDebitNote('inv-1', { reason: 'Cargo', amount: 6 }).subscribe();
    service.cancel('inv-1', { reason: 'Anulación autorizada' }).subscribe();

    expect(httpStub.post).toHaveBeenCalledWith('http://localhost:3000/api/invoices/inv-1/issue', {});
    expect(httpStub.post).toHaveBeenCalledWith('http://localhost:3000/api/invoices/inv-1/payments', {
      amount: 10,
      paymentMethod: 'cash'
    });
    expect(httpStub.post).toHaveBeenCalledWith('http://localhost:3000/api/invoices/inv-1/credit-notes', {
      reason: 'Ajuste',
      amount: 5
    });
    expect(httpStub.post).toHaveBeenCalledWith('http://localhost:3000/api/invoices/inv-1/debit-notes', {
      reason: 'Cargo',
      amount: 6
    });
    expect(httpStub.post).toHaveBeenCalledWith('http://localhost:3000/api/invoices/inv-1/cancel', {
      reason: 'Anulación autorizada'
    });
  });

  it('should sanitize from-order payload to avoid non-finite numeric values', () => {
    const service = TestBed.inject(InvoicesService);

    service
      .createDraftFromOrder({
        orderId: ' order-1 ',
        currency: ' dop ',
        discountValue: Number.NaN,
        items: [
          {
            orderItemId: ' item-1 ',
            quantity: Number.POSITIVE_INFINITY,
            discountValue: Number.NaN,
            taxRate: Number.NaN
          }
        ]
      })
      .subscribe();

    expect(httpStub.post).toHaveBeenCalledWith('http://localhost:3000/api/invoices/from-order', {
      orderId: 'order-1',
      currency: 'DOP',
      items: [
        {
          orderItemId: 'item-1'
        }
      ]
    });
  });

  it('should call minimal from-order endpoint with string orderId only', () => {
    const service = TestBed.inject(InvoicesService);

    service.createDraftFromOrderMinimal(' order-99 ').subscribe();

    expect(httpStub.post).toHaveBeenCalledWith('http://localhost:3000/api/invoices/from-order', {
      orderId: 'order-99'
    });
  });
});
