import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Product } from '../../../core/models/domain.models';
import { ProductsService } from '../data-access/products.service';

@Component({
  selector: 'app-product-detail-page',
  imports: [
    CurrencyPipe,
    RouterLink
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);

  protected readonly product = signal<Product | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');

  constructor() {
    this.loadProduct();
  }

  private loadProduct(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading.set(false);
      this.errorMessage.set(
        'No se encontró el producto solicitado.'
      );
      return;
    }

    this.productsService.detail(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set(
          'No fue posible cargar la información del producto.'
        );
      }
    });
  }
}