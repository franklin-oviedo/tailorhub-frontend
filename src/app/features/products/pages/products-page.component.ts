import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import {
  CurrencyPipe
} from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Product } from '../../../core/models/domain.models';
import { SessionService } from '../../../core/services/session.service';
import { ProductsService } from '../data-access/products.service';

@Component({
  selector: 'app-products-page',
  imports: [
    RouterLink,
    CurrencyPipe,
    ReactiveFormsModule
  ],
  templateUrl: './product-page.html',
  styleUrl: './product-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly session = inject(SessionService);
  private readonly productsService = inject(ProductsService);

  readonly products = signal<Product[]>([]);

  readonly loading = signal(false);
  readonly loadingProducts = signal(false);

  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly canCreate = computed(() => {
    const role = this.session.role();

    return (
      role === 'super_admin' ||
      role === 'admin' ||
      role === 'manager'
    );
  });

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    price: [
      null as number | null,
      [
        Validators.required,
        Validators.min(0.01)
      ]
    ],
    description: [''],
    isActive: [true]
  });

  constructor() {
    this.loadProducts();
  }

  isInvalid(
    field: 'name' | 'price' | 'description' | 'isActive'
  ): boolean {
    const control = this.form.controls[field];

    return control.invalid &&
      (control.touched || control.dirty);
  }

  isValid(
    field: 'name' | 'price' | 'description' | 'isActive'
  ): boolean {
    const control = this.form.controls[field];

    return control.valid &&
      (control.touched || control.dirty);
  }

  createProduct(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const raw = this.form.getRawValue();

    const name = raw.name.trim();
    const description = raw.description.trim();

    const payload: Omit<Product, 'id'> = {
      name,
      price: raw.price!,
      isActive: raw.isActive,
      ...(description ? { description } : {})
    };

    this.productsService
      .create(payload)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.successMessage.set(
            'Producto creado correctamente.'
          );

          this.resetForm();
          this.loadProducts();
        },
        error: () => {
          this.errorMessage.set(
            'No fue posible crear el producto. Inténtalo nuevamente.'
          );
        }
      });
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      price: null,
      description: '',
      isActive: true
    });
  }

  private loadProducts(): void {
    this.loadingProducts.set(true);
    this.errorMessage.set('');

    this.productsService
      .list({
        page: 1,
        limit: 20
      })
      .pipe(
        finalize(() => this.loadingProducts.set(false))
      )
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
        },
        error: () => {
          this.products.set([]);

          this.errorMessage.set(
            'No fue posible cargar los productos.'
          );
        }
      });
  }
}