import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { User } from '../../../core/models/domain.models';
import { UsersService } from '../data-access/users.service';

@Component({
  selector: 'app-users-page',
  imports: [],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
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
        return 'th-role-badge th-role-admin';
      case 'manager':
        return 'th-role-badge th-role-manager';
      case 'employee':
        return 'th-role-badge th-role-employee';
      default:
        return 'th-role-badge th-role-client';
    }
  }
}
