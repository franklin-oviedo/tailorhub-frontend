import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiConfigService } from '../../../core/services/api-config.service';
import {
  CancelInvoicePayload,
  CreateCreditNotePayload,
  CreateInvoiceFromOrderItemPayload,
  CreateDebitNotePayload,
  CreateInvoiceFromOrderPayload,
  FiscalReportQuery,
  FiscalReportResponse,
  InvoiceCreditNote,
  InvoiceDebitNote,
  InvoiceDocument,
  InvoiceListQuery,
  InvoiceListResponse,
  InvoicePayment,
  IssueInvoicePayload,
  RegisterInvoicePaymentPayload,
  UpdateInvoiceDraftPayload
} from '../../../core/models/invoices/invoice.models';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  list(query: InvoiceListQuery): Observable<InvoiceListResponse> {
    return this.http.get<InvoiceListResponse>(`${this.config.baseUrl}/invoices`, {
      params: query as never
    });
  }

  detail(invoiceId: string): Observable<InvoiceDocument> {
    return this.http.get<InvoiceDocument>(`${this.config.baseUrl}/invoices/${invoiceId}`);
  }

  createDraftFromOrder(payload: CreateInvoiceFromOrderPayload): Observable<InvoiceDocument> {
    const sanitizedPayload = this.sanitizeCreateDraftFromOrderPayload(payload);
    return this.http.post<InvoiceDocument>(`${this.config.baseUrl}/invoices/from-order`, sanitizedPayload);
  }

  createDraftFromOrderMinimal(orderId: string): Observable<InvoiceDocument> {
    return this.http.post<InvoiceDocument>(`${this.config.baseUrl}/invoices/from-order`, {
      orderId: orderId.trim()
    });
  }

  updateDraft(invoiceId: string, payload: UpdateInvoiceDraftPayload): Observable<InvoiceDocument> {
    return this.http.patch<InvoiceDocument>(`${this.config.baseUrl}/invoices/${invoiceId}/draft`, payload);
  }

  issue(invoiceId: string, payload: IssueInvoicePayload): Observable<InvoiceDocument> {
    return this.http.post<InvoiceDocument>(`${this.config.baseUrl}/invoices/${invoiceId}/issue`, payload);
  }

  registerPayment(invoiceId: string, payload: RegisterInvoicePaymentPayload): Observable<InvoicePayment> {
    return this.http.post<InvoicePayment>(`${this.config.baseUrl}/invoices/${invoiceId}/payments`, payload);
  }

  createCreditNote(invoiceId: string, payload: CreateCreditNotePayload): Observable<InvoiceCreditNote> {
    return this.http.post<InvoiceCreditNote>(`${this.config.baseUrl}/invoices/${invoiceId}/credit-notes`, payload);
  }

  createDebitNote(invoiceId: string, payload: CreateDebitNotePayload): Observable<InvoiceDebitNote> {
    return this.http.post<InvoiceDebitNote>(`${this.config.baseUrl}/invoices/${invoiceId}/debit-notes`, payload);
  }

  cancel(invoiceId: string, payload: CancelInvoicePayload): Observable<InvoiceDocument> {
    return this.http.post<InvoiceDocument>(`${this.config.baseUrl}/invoices/${invoiceId}/cancel`, payload);
  }

  getFiscalReport(query: FiscalReportQuery): Observable<FiscalReportResponse> {
    return this.http.get<FiscalReportResponse>(`${this.config.baseUrl}/invoices/fiscal-report`, {
      params: query as never
    });
  }

  private sanitizeCreateDraftFromOrderPayload(payload: CreateInvoiceFromOrderPayload): CreateInvoiceFromOrderPayload {
    const sanitized: CreateInvoiceFromOrderPayload = {
      orderId: typeof payload.orderId === 'string' ? payload.orderId.trim() : ''
    };

    if (payload.currency?.trim()) sanitized.currency = payload.currency.trim().toUpperCase();
    if (payload.dueAt?.trim()) sanitized.dueAt = payload.dueAt.trim();
    if (payload.notes?.trim()) sanitized.notes = payload.notes.trim();
    if (payload.termsAndConditions?.trim()) sanitized.termsAndConditions = payload.termsAndConditions.trim();
    if (payload.discountType) sanitized.discountType = payload.discountType;
    if (this.isFiniteNumber(payload.discountValue)) sanitized.discountValue = payload.discountValue;

    const sanitizedItems = payload.items
      ?.map((item) => this.sanitizeCreateDraftFromOrderItem(item))
      .filter((item) => item.orderItemId.length > 0) ?? [];
    if (sanitizedItems.length > 0) sanitized.items = sanitizedItems;

    return sanitized;
  }

  private sanitizeCreateDraftFromOrderItem(item: CreateInvoiceFromOrderItemPayload): CreateInvoiceFromOrderItemPayload {
    const sanitized: CreateInvoiceFromOrderItemPayload = {
      orderItemId: typeof item.orderItemId === 'string' ? item.orderItemId.trim() : ''
    };

    if (this.isFiniteNumber(item.quantity)) sanitized.quantity = item.quantity;
    if (item.discountType) sanitized.discountType = item.discountType;
    if (this.isFiniteNumber(item.discountValue)) sanitized.discountValue = item.discountValue;
    if (typeof item.isTaxable === 'boolean') sanitized.isTaxable = item.isTaxable;
    if (this.isFiniteNumber(item.taxRate)) sanitized.taxRate = item.taxRate;

    return sanitized;
  }

  private isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }
}
