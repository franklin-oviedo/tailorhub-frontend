import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { Store, User, UserRole } from '../../../core/models/domain.models';
import { SessionService } from '../../../core/services/session.service';
import { ConfirmDialogComponent } from '../../../core/ui/confirm-dialog.component';
import { StoresService } from '../../stores/data-access/stores.service';
import { UpdateUserPayload, UsersService } from '../data-access/users.service';

type StatusFilter = 'all' | 'active' | 'inactive';
type RoleFilter = 'employee';

@Component({
  selector: 'app-users-page',
  imports: [ReactiveFormsModule, MatDialogModule],
  templateUrl: './users-page.html',
  styleUrls: ['./users-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPageComponent implements OnDestroy {
  private static readonly PAGE_SIZE = 10;

  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly usersService = inject(UsersService);
  private readonly storesService = inject(StoresService);
  private readonly session = inject(SessionService);

  @ViewChild('userDialogTemplate')
  private readonly userDialogTemplate?: TemplateRef<unknown>;

  private activeDialogRef: MatDialogRef<unknown> | null = null;

  readonly users = signal<User[]>([]);
  readonly stores = signal<Store[]>([]);
  readonly loading = signal(false);
  readonly loadingStores = signal(false);
  readonly savingUser = signal(false);
  readonly disablingUserId = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly currentPage = signal(1);
  readonly totalItems = signal(0);
  readonly editingUserId = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly roleFilter = signal<RoleFilter>('employee');
  readonly statusFilter = signal<StatusFilter>('all');

  readonly currentRole = computed(() => this.session.role());
  readonly currentUserId = computed(() => this.session.user()?.id ?? null);
  readonly currentStoreId = computed(() => this.resolveStoreId(this.session.user()));
  readonly isManager = computed(() => this.currentRole() === 'manager');
  readonly isEmpty = computed(() => this.users().length === 0);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / UsersPageComponent.PAGE_SIZE))
  );
  readonly dialogTitle = computed(() => 'Editar usuario');

  readonly availableRoles = computed<UserRole[]>(() => {
    const actorRole = this.currentRole();

    if (actorRole === 'super_admin') {
      return ['admin', 'manager', 'employee'];
    }

    if (actorRole === 'admin') {
      return ['admin', 'manager', 'employee'];
    }

    return ['employee'];
  });

  readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    status: ['all' as StatusFilter]
  });

  readonly userForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(7)]],
    password: ['', [Validators.minLength(8)]],
    role: ['employee' as UserRole, Validators.required],
    storeId: ['', Validators.required],
    isActive: [true]
  });

  constructor() {
    this.resetUserForm();
    this.loadStores();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.closeActiveDialog();
  }

  isInvalid(field: keyof typeof this.userForm.controls): boolean {
    const control = this.userForm.controls[field];

    return control.invalid && (control.touched || control.dirty);
  }

  userName(user: User): string {
    return user.fullName ?? user.employee?.name ?? user.customer?.name ?? '-';
  }

  userEmail(user: User): string {
    return user.email ?? user.employee?.email ?? user.customer?.email ?? '-';
  }

  userPhone(user: User): string {
    return user.phone ?? user.employee?.phone ?? user.customer?.phone ?? '-';
  }

  userStoreName(user: User): string {
    if (typeof user.store?.name === 'string' && user.store.name.trim().length > 0) {
      return user.store.name;
    }

    const storeId = this.resolveStoreId(user);
    if (!storeId) {
      return '-';
    }

    const mappedStore = this.stores().find((store) => store.id === storeId);
    return mappedStore?.name ?? storeId;
  }

  userStatusLabel(user: User): string {
    return this.isUserInactive(user) ? 'Inhabilitado' : 'Activo';
  }

  managerStoreLabel(): string {
    const currentUser = this.session.user();

    if (!currentUser) {
      return '';
    }

    return this.userStoreName(currentUser);
  }

  roleClass(role: UserRole): string {
    switch (role) {
      case 'super_admin':
        return 'th-role-badge th-role-super-admin';
      case 'admin':
        return 'th-role-badge th-role-admin';
      case 'manager':
        return 'th-role-badge th-role-manager';
      case 'employee':
        return 'th-role-badge th-role-employee';
      default:
        return 'th-role-badge th-role-client';
    }
  }

  canManageUser(user: User): boolean {
    if (this.savingUser() || this.disablingUserId() !== null) {
      return false;
    }

    const actorRole = this.currentRole();
    const actorStoreId = this.currentStoreId();
    const targetStoreId = this.resolveStoreId(user);

    if (!actorRole || this.currentUserId() === user.id || user.role === 'super_admin' || this.isUserInactive(user)) {
      return false;
    }

    if (actorRole === 'super_admin') {
      return true;
    }

    if (actorRole === 'admin') {
      return true;
    }

    if (actorRole === 'manager') {
      return (
        user.role === 'employee' &&
        !!actorStoreId &&
        actorStoreId === targetStoreId
      );
    }

    return false;
  }

  openEditDialog(user: User): void {
    if (!this.canManageUser(user)) {
      return;
    }

    this.editingUserId.set(user.id);

    const roleValue = this.availableRoles().includes(user.role) ? user.role : this.availableRoles()[0] ?? 'employee';
    const defaultStoreId = this.resolveStoreId(user) ?? this.currentStoreId() ?? '';

    this.userForm.reset({
      fullName: this.userName(user),
      email: this.userEmail(user),
      phone: this.userPhone(user),
      password: '',
      role: roleValue,
      storeId: defaultStoreId,
      isActive: !this.isUserInactive(user)
    });

    this.configureStoreControl();
    this.errorMessage.set('');
    this.openDialog();
  }

  closeUserDialog(): void {
    if (this.savingUser()) {
      return;
    }

    this.resetUserForm();
    this.editingUserId.set(null);
    this.closeActiveDialog();
  }

  applyFilters(): void {
    const value = this.filterForm.getRawValue();
    this.searchTerm.set(value.search.trim());
    this.statusFilter.set(value.status);
    this.currentPage.set(1);
    this.loadUsers();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: 'all'
    });
    this.searchTerm.set('');
    this.roleFilter.set('employee');
    this.statusFilter.set('all');
    this.currentPage.set(1);
    this.loadUsers();
  }

  nextPage(): void {
    if (this.currentPage() >= this.totalPages()) {
      return;
    }

    this.currentPage.update((page) => page + 1);
    this.loadUsers();
  }

  previousPage(): void {
    if (this.currentPage() <= 1) {
      return;
    }

    this.currentPage.update((page) => page - 1);
    this.loadUsers();
  }

  submitUser(): void {
    if (this.userForm.invalid || this.savingUser()) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.savingUser.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const raw = this.userForm.getRawValue();

    this.updateUser(raw);
  }

  disableUser(user: User): void {
    if (!this.canManageUser(user)) {
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        width: 'min(420px, calc(100vw - 2rem))',
        maxWidth: '95vw',
        data: {
          title: 'Inhabilitar usuario',
          message: `¿Seguro que deseas inhabilitar a ${this.userName(user)}?`,
          confirmText: 'Inhabilitar',
          cancelText: 'Cancelar',
          variant: 'danger'
        }
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.disablingUserId.set(user.id);
        this.errorMessage.set('');
        this.successMessage.set('');

        this.usersService
          .disable(user.id)
          .pipe(
            finalize(() => {
              this.disablingUserId.set(null);
            })
          )
          .subscribe({
            next: () => {
              this.successMessage.set('Usuario inhabilitado correctamente.');
              this.loadUsers();
            },
            error: (error) => {
              this.errorMessage.set(this.parseApiErrorMessage(error) ?? 'No fue posible inhabilitar el usuario.');
            }
          });
      });
  }

  private updateUser(raw: ReturnType<typeof this.userForm.getRawValue>): void {
    const userId = this.editingUserId();

    if (!userId) {
      this.savingUser.set(false);
      this.errorMessage.set('No fue posible identificar el usuario a editar.');
      return;
    }

    const payload: UpdateUserPayload = {
      fullName: raw.fullName.trim(),
      email: raw.email.trim(),
      phone: raw.phone.trim(),
      role: raw.role,
      storeId: raw.storeId.trim(),
      isActive: raw.isActive
    };

    if (raw.password.trim().length > 0) {
      payload.password = raw.password;
    }

    this.usersService
      .update(userId, payload)
      .pipe(
        finalize(() => {
          this.savingUser.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Usuario actualizado correctamente.');
          this.closeUserDialog();
          this.loadUsers();
        },
        error: (error) => {
          this.errorMessage.set(this.parseApiErrorMessage(error) ?? 'No fue posible actualizar el usuario.');
        }
      });
  }

  private openDialog(): void {
    if (!this.userDialogTemplate) {
      return;
    }

    this.closeActiveDialog();

    this.activeDialogRef = this.dialog.open(this.userDialogTemplate, {
      panelClass: ['th-dialog-panel', 'th-users-dialog-panel'],
      width: 'min(760px, calc(100vw - 2rem))',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: true,
      restoreFocus: true,
      disableClose: false
    });
  }

  private closeActiveDialog(): void {
    this.activeDialogRef?.close();
    this.activeDialogRef = null;
  }

  private resetUserForm(): void {
    this.userForm.controls.password.setValidators([Validators.minLength(8)]);
    this.userForm.controls.password.updateValueAndValidity({ emitEvent: false });

    const defaultRole = this.availableRoles()[0] ?? 'employee';
    const defaultStoreId = this.currentStoreId() ?? '';

    this.userForm.reset({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      role: defaultRole,
      storeId: defaultStoreId,
      isActive: true
    });

    this.configureStoreControl();
  }

  private configureStoreControl(): void {
    if (this.isManager()) {
      this.userForm.controls.storeId.setValue(this.currentStoreId() ?? '');
      this.userForm.controls.storeId.disable({ emitEvent: false });
      return;
    }

    this.userForm.controls.storeId.enable({ emitEvent: false });
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const query: {
      page: number;
      limit: number;
      search?: string;
      role?: UserRole;
      isActive?: boolean;
    } = {
      page: this.currentPage(),
      limit: UsersPageComponent.PAGE_SIZE
    };

    if (this.searchTerm().length > 0) {
      query.search = this.searchTerm();
    }

    const selectedRole = this.roleFilter();
    query.role = selectedRole;

    if (this.statusFilter() === 'active') {
      query.isActive = true;
    } else if (this.statusFilter() === 'inactive') {
      query.isActive = false;
    }

    this.usersService
      .list(query)
      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.users.set(this.applyManagerScope(response.data));
          this.totalItems.set(response.meta.totalItems);
        },
        error: (error) => {
          this.users.set([]);
          this.totalItems.set(0);
          this.errorMessage.set(this.parseApiErrorMessage(error) ?? 'No fue posible cargar los usuarios.');
        }
      });
  }

  private loadStores(): void {
    if (this.isManager()) {
      return;
    }

    this.loadingStores.set(true);

    this.storesService
      .list({ page: 1, limit: 100 })
      .pipe(
        finalize(() => {
          this.loadingStores.set(false);
        })
      )
      .subscribe({
        next: (response) => {
    this.stores.set(response.data);
        },
        error: () => {
    this.stores.set([]);
        }
      });
  }

  private applyManagerScope(users: User[]): User[] {
    if (!this.isManager()) {
      return users;
    }

    const storeId = this.currentStoreId();

    if (!storeId) {
      return [];
    }

    return users.filter((user) => this.resolveStoreId(user) === storeId);
  }

  private resolveStoreId(user: User | null | undefined): string | null {
    if (!user) {
      return null;
    }

    if (typeof user.store?.id === 'string' && user.store.id.trim().length > 0) {
      return user.store.id.trim();
    }

    if (typeof user.storeId === 'string' && user.storeId.trim().length > 0) {
      return user.storeId.trim();
    }

    return null;
  }

  private isUserInactive(user: User): boolean {
    if (typeof user.isActive === 'boolean') {
      return !user.isActive;
    }

    if (typeof user.employee?.active === 'boolean') {
      return !user.employee.active;
    }

    return false;
  }

  private parseApiErrorMessage(error: unknown): string | null {
    if (!(error instanceof HttpErrorResponse)) {
      return null;
    }

    const message = error.error?.message;

    if (Array.isArray(message)) {
      const normalized = message.filter(
        (entry): entry is string =>
          typeof entry === 'string' && entry.trim().length > 0
      );

      return normalized.length > 0 ? normalized.join(', ') : null;
    }

    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    return null;
  }
}
