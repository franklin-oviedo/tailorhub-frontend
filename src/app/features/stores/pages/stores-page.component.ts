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
  readonly uploadingAssetKey = signal<string | null>(null);

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
    email: ['', [Validators.required, Validators.email]],
    address: ['', Validators.required],
    phone: ['']
  });

  isInvalid(
    field: 'name' | 'email' | 'address' | 'phone'
  ): boolean {
    const control = this.form.controls[field];

    return control.invalid && (
      control.touched ||
      control.dirty
    );
  }

  isValid(
    field: 'name' | 'email' | 'address' | 'phone'
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
          email: '',
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

  onLogoFileSelected(storeId: string, event: Event): void {
    const file = this.readInputFile(event);
    if (!file) {
      return;
    }

    this.uploadingAssetKey.set(`${storeId}:logo`);

    this.storesService.uploadLogo(storeId, file).subscribe({
      next: (store) => {
        this.uploadingAssetKey.set(null);
        this.replaceStore(store);
      },
      error: () => {
        this.uploadingAssetKey.set(null);
      }
    });
  }

  onSealFileSelected(storeId: string, event: Event): void {
    const file = this.readInputFile(event);
    if (!file) {
      return;
    }

    this.uploadingAssetKey.set(`${storeId}:seal`);

    this.storesService.uploadSeal(storeId, file).subscribe({
      next: (store) => {
        this.uploadingAssetKey.set(null);
        this.replaceStore(store);
      },
      error: () => {
        this.uploadingAssetKey.set(null);
      }
    });
  }

  isUploadingAsset(storeId: string, asset: 'logo' | 'seal'): boolean {
    return this.uploadingAssetKey() === `${storeId}:${asset}`;
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

  private readInputFile(event: Event): File | null {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    if (input) {
      input.value = '';
    }

    return file;
  }

  private replaceStore(updatedStore: Store): void {
    this.stores.update((stores) =>
      stores.map((store) => (store.id === updatedStore.id ? updatedStore : store))
    );
  }
}