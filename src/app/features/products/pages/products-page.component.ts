import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../../../core/models/domain.models';
import { ProductsService } from '../data-access/products.service';

@Component({
  selector: 'app-products-page',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <section class="catalog">
      <h2 class="catalog-title">Catalogo de productos</h2>

      <div class="cards row g-3">
        @for (product of products(); track product.id) {
          <article class="col-12 col-sm-6 col-xl-4">
            <div class="card h-100 shadow-sm border-0 th-product-card">
              <div class="card-header">
                <h3 class="h6 mb-0 text-uppercase fw-bold">{{ product.name }}</h3>
              </div>
              <div class="card-body d-grid gap-2">
                <p class="text-secondary mb-0">SKU: {{ product.sku }}</p>
                <p class="h5 mb-0">{{ product.price | currency:'USD' }}</p>
              </div>
              <div class="card-footer bg-transparent border-0 pt-0">
                <a class="btn btn-outline-secondary w-100" [routerLink]="['/products', product.id]">
                  Ver detalle
                </a>
              </div>
            </div>
          </article>
        }
      </div>
    </section>
  `,
  styles: `
    .catalog {
      display: grid;
      gap: 1rem;
    }

    .catalog-title {
      margin: 0;
      color: var(--th-primary);
    }

    .th-product-card .card-header {
      border-bottom: 1px solid var(--th-stroke);
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsPageComponent {
  private readonly productsService = inject(ProductsService);

  readonly products = signal<Product[]>([]);

  constructor() {
    this.productsService
      .list({ page: 1, limit: 20, isActive: true })
      .subscribe((response) => this.products.set(response.data));
  }
}
