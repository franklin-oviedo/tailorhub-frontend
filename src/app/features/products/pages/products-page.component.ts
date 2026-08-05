import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../../../core/models/domain.models';
import { SessionService } from '../../../core/services/session.service';
import { ProductsService } from '../data-access/products.service';

@Component({
  selector: 'app-products-page',
  imports: [RouterLink, CurrencyPipe, ReactiveFormsModule],
  template: `
    <section class="catalog row g-3">
      @if (canCreate()) {
        <article class="col-12 col-lg-4">
          <div class="th-card h-100">
            <header class="th-card-head">
              <h2 class="th-card-title">Nuevo producto</h2>
            </header>

            <div class="th-card-body">
              <form [formGroup]="form" (ngSubmit)="createProduct()" class="th-form-grid">
                <div>
                  <label class="form-label" for="productName">Nombre</label>
                  <input
                    id="productName"
                    class="form-control th-input"
                    [class.is-invalid]="isInvalid('name')"
                    [class.is-valid]="isValid('name')"
                    formControlName="name"
                  />
                  @if (isInvalid('name')) {
                    <div class="invalid-feedback d-block">El nombre es obligatorio.</div>
                  }
                </div>

                <div>
                  <label class="form-label" for="productPrice">Precio</label>
                  <input
                    id="productPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    class="form-control th-input"
                    [class.is-invalid]="isInvalid('price')"
                    [class.is-valid]="isValid('price')"
                    formControlName="price"
                  />
                  @if (isInvalid('price')) {
                    <div class="invalid-feedback d-block">Ingresa un precio mayor a 0.</div>
                  }
                </div>

                <div>
                  <label class="form-label" for="productDescription">Descripcion</label>
                  <textarea
                    id="productDescription"
                    rows="3"
                    class="form-control th-input"
                    formControlName="description"
                  ></textarea>
                </div>

                <div class="form-check">
                  <input id="productActive" class="form-check-input" type="checkbox" formControlName="isActive" />
                  <label class="form-check-label" for="productActive">Producto activo</label>
                </div>

                @if (successMessage()) {
                  <div class="alert alert-success py-2 mb-0" role="status">{{ successMessage() }}</div>
                }

                @if (errorMessage()) {
                  <div class="alert alert-danger py-2 mb-0" role="alert">{{ errorMessage() }}</div>
                }

                <div class="th-form-actions">
                  <button class="btn th-btn-primary" type="submit" [disabled]="loading()">
                    {{ loading() ? 'Guardando...' : 'Crear producto' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </article>
      }

      <article [class]="canCreate() ? 'col-12 col-lg-8' : 'col-12'">
        <div class="th-card h-100">
          <header class="th-card-head">
            <h2 class="th-card-title">Catalogo de productos</h2>
          </header>

          <div class="th-card-body">
            <div class="row g-3">
              @for (product of products(); track product.id) {
                <article class="col-12 col-sm-6 col-xl-4">
                  <div class="card h-100 shadow-sm border-0 th-product-card">
                    <div class="card-header d-flex justify-content-between align-items-center gap-2">
                      <h3 class="h6 mb-0 text-uppercase fw-bold">{{ product.name }}</h3>
                      <span class="badge" [class]="product.isActive ? 'text-bg-success' : 'text-bg-secondary'">
                        {{ product.isActive ? 'Activo' : 'Inactivo' }}
                      </span>
                    </div>
                    <div class="card-body d-grid gap-2">
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

              @if (products().length === 0) {
                <p class="mb-0 text-secondary">No hay productos disponibles.</p>
              }
            </div>
          </div>
        </div>
      </article>
    </section>
  `,
  styles: `
    .th-product-card .card-header {
      border-bottom: 1px solid var(--th-stroke);
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    }

    textarea.th-input {
      min-height: 6.5rem;
      resize: vertical;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly session = inject(SessionService);
  private readonly productsService = inject(ProductsService);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly canCreate = computed(() => {
    const role = this.session.role();
    return role === 'super_admin' || role === 'admin' || role === 'manager';
  });

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    price: [null, [Validators.required, Validators.min(0.01)]],
    description: [''],
    isActive: [true]
  });

  constructor() {
    this.loadProducts();
  }

  isInvalid(field: 'name' | 'price' | 'description' | 'isActive'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  isValid(field: 'name' | 'price' | 'description' | 'isActive'): boolean {
    const control = this.form.controls[field];
    return control.valid && (control.touched || control.dirty);
  }

  createProduct(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const raw = this.form.getRawValue();
    const description = raw.description.trim();
    const payload: Omit<Product, 'id'> = {
      name: raw.name.trim(),
      price: raw.price,
      isActive: raw.isActive,
      ...(description ? { description } : {})
    };

    this.productsService.create(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Producto creado correctamente.');
        this.form.reset({ name: '', price: null, description: '', isActive: true });
        this.loadProducts();
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('No fue posible crear el producto.');
      }
    });
  }

  private loadProducts(): void {
    this.productsService.list({ page: 1, limit: 20 }).subscribe((response) => this.products.set(response.data));
  }
}
