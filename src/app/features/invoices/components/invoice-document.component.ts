import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { InvoiceDocumentViewModel } from '../models/invoice-document-view-model';

@Component({
  selector: 'app-invoice-document',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './invoice-document.html',
  styleUrl: './invoice-document.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceDocumentComponent {
  readonly viewModel = input.required<InvoiceDocumentViewModel>();
}
