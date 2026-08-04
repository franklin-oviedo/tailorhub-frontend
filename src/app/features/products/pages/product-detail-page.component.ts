import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../../../core/models/domain.models';
import { ProductsService } from '../data-access/products.service';

@Component({
  selector: 'app-product-detail-page',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <article class="th-card">
      <header class="th-card-head">
        <h2 class="th-card-title">Detalle del producto</h2>
      </header>
      <div class="th-card-body">
        @if (product(); as current) {
          <h3 class="h5 mb-1">{{ current.name }}</h3>
          <p class="mb-1"><strong>SKU:</strong> {{ current.sku }}</p>
          <p class="mb-1"><strong>Precio:</strong> {{ current.price | currency:'USD' }}</p>
          <p class="mb-3"><strong>Descripcion:</strong> {{ current.description || 'Sin descripcion.' }}</p>
        }

        <a class="btn btn-outline-secondary" routerLink="/products">Volver al catalogo</a>
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);

  readonly product = signal<Product | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.productsService.detail(id).subscribe((product) => this.product.set(product));
  }
}
