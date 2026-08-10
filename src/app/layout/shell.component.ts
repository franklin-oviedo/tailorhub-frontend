import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { UserRole } from '../core/models/domain.models';
import { SessionService } from '../core/services/session.service';
import { AuthService } from '../features/auth/data-access/auth.service';

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly roles: readonly UserRole[];
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    NgOptimizedImage,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellComponent {
  private readonly session = inject(SessionService);
  private readonly authService = inject(AuthService);

  readonly mobileNavOpen = signal(false);

  private readonly navItems: readonly NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      roles: [
        'client',
        'employee',
        'manager',
        'admin',
        'super_admin'
      ]
    },
    {
      label: 'Productos',
      path: '/products',
      roles: [
        'client',
        'employee',
        'manager',
        'admin',
        'super_admin'
      ]
    },
    {
      label: 'Pedidos',
      path: '/orders',
      roles: [
        'client',
        'employee',
        'manager',
        'admin',
        'super_admin'
      ]
    },
    {
      label: 'Citas',
      path: '/appointments',
      roles: [
        'client',
        'employee',
        'manager',
        'admin',
        'super_admin'
      ]
    },
    {
      label: 'Tiendas',
      path: '/stores',
      roles: [
        'admin',
        'super_admin'
      ]
    },
    {
      label: 'Usuarios',
      path: '/users',
      roles: [
        'manager',
        'admin',
        'super_admin'
      ]
    }
  ];

  readonly visibleNavItems = computed(() => {
    const role = this.session.role();

    if (!role) {
      return [];
    }

    return this.navItems.filter((item) =>
      item.roles.includes(role)
    );
  });

  readonly welcomeMessage = computed(() => {
    const user = this.session.user();

    if (!user) {
      return 'Hola';
    }

    return `Hola, ${user.employee?.name ?? user.customer?.name ?? 'Usuario'}`;
  });

  logout(): void {
    this.mobileNavOpen.set(false);
    this.authService.logout();
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.update((isOpen) => !isOpen);
  }
}