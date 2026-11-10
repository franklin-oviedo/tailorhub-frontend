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
import { finalize } from 'rxjs';
import { Store, User } from '../../../core/models/domain.models';
import { StoresService } from '../data-access/stores.service';
import { UsersService } from '../../users/data-access/users.service';

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
  private readonly usersService = inject(UsersService);

  readonly stores = signal<Store[]>([]);
  readonly managers = signal<User[]>([]);
  readonly uploadingAssetKey = signal<string | null>(null);
  readonly loadingManagers = signal(false);
  readonly creatingStore = signal(false);
  readonly invitingManager = signal(false);
  readonly createStoreError = signal('');
  readonly createStoreSuccess = signal('');
  readonly managerInvitationError = signal('');
  readonly managerInvitationSuccess = signal('');
  readonly managerInvitationLink = signal('');

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
    phone: [''],
    managerId: ['']
  });

  readonly managerInvitationForm = this.fb.nonNullable.group({
    storeId: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    expiresInHours: [72, [Validators.required, Validators.min(1), Validators.max(720)]]
  });

  isInvalid(
    field: 'name' | 'email' | 'address' | 'phone' | 'managerId'
  ): boolean {
    const control = this.form.controls[field];

    return control.invalid && (
      control.touched ||
      control.dirty
    );
  }

  isValid(
    field: 'name' | 'email' | 'address' | 'phone' | 'managerId'
  ): boolean {
    const control = this.form.controls[field];

    return control.valid && (
      control.touched ||
      control.dirty
    );
  }

  constructor() {
    this.load();
    this.loadManagers();
  }

  createStore(): void {
    if (this.form.invalid || this.creatingStore()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const managerId = raw.managerId.trim();
    this.creatingStore.set(true);
    this.createStoreError.set('');
    this.createStoreSuccess.set('');

    this.storesService
      .create({
        name: raw.name,
        email: raw.email,
        address: raw.address,
        phone: raw.phone,
        ...(managerId.length > 0 ? { managerId } : {})
      })
      .pipe(finalize(() => this.creatingStore.set(false)))
      .subscribe({
        next: () => {
          this.form.reset({
            name: '',
            email: '',
            address: '',
            phone: '',
            managerId: ''
          });

          this.createStoreSuccess.set('Tienda creada correctamente.');
          this.currentPage.set(1);
          this.load();
        },
        error: () => {
          this.createStoreError.set('No fue posible crear la tienda.');
        }
      });
  }

  inviteManager(): void {
    if (this.managerInvitationForm.invalid || this.invitingManager()) {
      this.managerInvitationForm.markAllAsTouched();
      return;
    }

    const raw = this.managerInvitationForm.getRawValue();
    this.invitingManager.set(true);
    this.managerInvitationError.set('');
    this.managerInvitationSuccess.set('');
    this.managerInvitationLink.set('');

    this.storesService
      .createManagerInvitation(raw.storeId, {
        email: raw.email.trim(),
        expiresInHours: Number(raw.expiresInHours)
      })
      .pipe(finalize(() => this.invitingManager.set(false)))
      .subscribe({
        next: (response) => {
          const link = response.invitationLink?.trim() ?? '';
          this.managerInvitationLink.set(link);
          this.managerInvitationSuccess.set('Invitación de manager creada correctamente.');
          this.managerInvitationForm.controls.email.setValue('');
        },
        error: () => {
          this.managerInvitationError.set('No fue posible crear la invitación de manager.');
        }
      });
  }

  copyManagerInvitationLink(): void {
    const link = this.managerInvitationLink().trim();

    if (!link) {
      return;
    }

    const clipboard = globalThis.navigator?.clipboard;
    if (clipboard?.writeText) {
      clipboard.writeText(link).then(
        () => {
          this.managerInvitationSuccess.set('Enlace copiado al portapapeles.');
        },
        () => {
          this.copyLinkWithFallback(link);
        }
      );
      return;
    }

    this.copyLinkWithFallback(link);
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
        this.ensureManagerInvitationStoreSelection();
      });
  }

  isManagerInviteInvalid(field: 'storeId' | 'email' | 'expiresInHours'): boolean {
    const control = this.managerInvitationForm.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  managerLabel(user: User): string {
    const name = user.fullName?.trim() || user.employee?.name?.trim() || user.email?.trim() || user.id;
    const email = user.email?.trim() ?? '';
    return email ? `${name} (${email})` : name;
  }

  private loadManagers(): void {
    this.loadingManagers.set(true);

    this.usersService
      .list({ page: 1, limit: 100, role: 'manager', isActive: true })
      .pipe(finalize(() => this.loadingManagers.set(false)))
      .subscribe({
        next: (response) => {
          this.managers.set(response.data);
        },
        error: () => {
          this.managers.set([]);
        }
      });
  }

  private ensureManagerInvitationStoreSelection(): void {
    const storeIdControl = this.managerInvitationForm.controls.storeId;
    const currentValue = storeIdControl.value.trim();

    if (currentValue.length > 0) {
      return;
    }

    const firstStore = this.stores()[0];
    if (firstStore) {
      storeIdControl.setValue(firstStore.id);
    }
  }

  private copyLinkWithFallback(link: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = link;
    textArea.setAttribute('readonly', 'true');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const copied = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (copied) {
      this.managerInvitationSuccess.set('Enlace copiado al portapapeles.');
      return;
    }

    this.managerInvitationError.set('No se pudo copiar automáticamente. Copia el enlace manualmente.');
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