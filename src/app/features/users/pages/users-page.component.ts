import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { User } from '../../../core/models/domain.models';
import { UsersService } from '../data-access/users.service';

@Component({
  selector: 'app-users-page',
  imports: [],
  template: `
    <article class="th-card">
      <header class="th-card-head">
        <h2 class="th-card-title">Usuarios y Roles</h2>
      </header>
      <div class="th-card-body">
      <div class="th-table-shell">
      <div class="th-table-scroll">
      <table class="table table-hover align-middle">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Email</th>
            <th scope="col">Rol</th>
            <th scope="col">Tienda</th>
          </tr>
        </thead>
        <tbody>
          @for (user of users(); track user.id) {
            <tr>
              <td>{{ user.fullName }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="badge text-uppercase" [class]="roleClass(user.role)">
                  {{ user.role }}
                </span>
              </td>
              <td>{{ user.storeId || '-' }}</td>
            </tr>
          }
        </tbody>
      </table>
      </div>
      </div>

      @if (isEmpty()) {
        <p class="empty">No hay usuarios disponibles.</p>
      }
      </div>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }

    .empty {
      margin-top: 1rem;
      color: #6b7280;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPageComponent {
  private readonly usersService = inject(UsersService);

  readonly users = signal<User[]>([]);
  readonly isEmpty = computed(() => this.users().length === 0);

  constructor() {
    this.usersService.list({ page: 1, limit: 20 }).subscribe((response) => this.users.set(response.data));
  }

  roleClass(role: User['role']): string {
    switch (role) {
      case 'admin':
        return 'bg-primary-subtle text-primary-emphasis border border-primary-subtle';
      case 'employee':
        return 'bg-info-subtle text-info-emphasis border border-info-subtle';
      default:
        return 'bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle';
    }
  }
}
