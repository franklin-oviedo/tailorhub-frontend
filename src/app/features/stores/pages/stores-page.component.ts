import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Store } from '../../../core/models/domain.models';
import { StoresService } from '../data-access/stores.service';

@Component({
  selector: 'app-stores-page',
  imports: [ReactiveFormsModule],
  templateUrl: './stores-page.html',
  styleUrl: './stores-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoresPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly storesService = inject(StoresService);

  readonly stores = signal<Store[]>([]);

  readonly currentPage = signal(1);
  readonly pageSize = 8;
  readonly totalItems = signal(0);

  readonly totalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(this.totalItems() / this.pageSize)
    )
  );

  readonly pages = computed(() =>
    Array.from(
      { length: this.totalPages() },
      (_, index) => index + 1
    )
  );

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    phone: ['']
  });

  isInvalid(
    field: 'name' | 'address' | 'phone'
  ): boolean {
    const control = this.form.controls[field];

    return control.invalid && (
      control.touched ||
      control.dirty
    );
  }

  isValid(
    field: 'name' | 'address' | 'phone'
  ): boolean {
    const control = this.form.controls[field];

    return control.valid && (
      control.touched ||
      control.dirty
    );
  }

  constructor() {
    this.load();
  }

  createStore(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.storesService
      .create(this.form.getRawValue())
      .subscribe(() => {
        this.form.reset({
          name: '',
          address: '',
          phone: ''
        });

        this.currentPage.set(1);

        this.load();
      });
  }

  goToPage(page: number): void {
    if (
      page < 1 ||
      page > this.totalPages() ||
      page === this.currentPage()
    ) {
      return;
    }

    this.currentPage.set(page);

    this.load();
  }

  previousPage(): void {
    this.goToPage(
      this.currentPage() - 1
    );
  }

  nextPage(): void {
    this.goToPage(
      this.currentPage() + 1
    );
  }

  private load(): void {
    this.storesService
      .list({
        page: this.currentPage(),
        limit: this.pageSize
      })
      .subscribe((response) => {
        this.stores.set(response.data);
        this.totalItems.set(response.meta.totalItems);
      });
  }
}