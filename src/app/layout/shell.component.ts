import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UserRole } from '../core/models/domain.models';
import { SessionService } from '../core/services/session.service';
import { AuthService } from '../features/auth/data-access/auth.service';

interface NavItem {
  label: string;
  path: string;
  roles: UserRole[];
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, NgOptimizedImage, RouterLink, RouterLinkActive],
  template: `
    <div class="layout-container">
      <aside class="sidenav" [class.is-open]="mobileNavOpen()">
        <div class="brand">
          <img
            ngSrc="th.png"
            width="56"
            height="56"
            alt="Logo de TailorHub"
            class="brand-logo"
            priority
          />
          <h1>TailorHub</h1>
          <button
            type="button"
            class="btn btn-outline-light btn-sm d-lg-none"
            aria-label="Cerrar menu"
            (click)="mobileNavOpen.set(false)"
          >
            Cerrar
          </button>
        </div>
        <nav aria-label="Menu principal">
          @for (item of visibleNavItems(); track item.path) {
            <a
              routerLinkActive="is-active"
              [routerLink]="item.path"
              [class.nav-link]="true"
              [attr.aria-current]="null"
              (click)="mobileNavOpen.set(false)"
            >
              {{ item.label }}
            </a>
          }
        </nav>
      </aside>

      @if (mobileNavOpen()) {
        <button
          type="button"
          class="sidebar-backdrop d-lg-none"
          aria-label="Cerrar menu lateral"
          (click)="mobileNavOpen.set(false)"
        ></button>
      }

      <div class="main-panel">
        <header class="toolbar">
          <button
            type="button"
            class="btn btn-outline-secondary d-lg-none"
            aria-label="Abrir o cerrar menu"
            [attr.aria-expanded]="mobileNavOpen()"
            (click)="mobileNavOpen.update((value) => !value)"
          >
            <span class="menu-glyph" aria-hidden="true">☰</span>
          </button>

          <div class="toolbar-content">
            <p class="welcome">{{ welcomeMessage() }}</p>
            <button class="btn btn-outline-secondary" type="button" (click)="logout()">
              Salir
            </button>
          </div>
        </header>

        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: `
    .layout-container {
      min-height: 100dvh;
      display: grid;
      grid-template-columns: 16rem minmax(0, 1fr);
      background: linear-gradient(160deg, #ffffff 0%, #f5f5f5 100%);
    }

    .sidenav {
      width: 16rem;
      min-height: 100dvh;
      border-right: 1px solid color-mix(in srgb, var(--th-primary) 18%, white 82%);
      padding: 1rem;
      background: linear-gradient(180deg, #264653 0%, #315b6b 100%);
      position: sticky;
      top: 0;
      z-index: 20;
    }

    .brand {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.65rem;
      margin-bottom: 1rem;
    }

    .brand-logo {
      border-radius: 0.5rem;
      object-fit: cover;
      box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
    }

    h1 {
      font-size: 1.35rem;
      margin: 0;
      color: #ffffff;
      letter-spacing: 0.02em;
    }

    nav {
      display: grid;
      gap: 0.5rem;
    }

    .nav-link {
      color: #e6eef2;
      text-decoration: none;
      border-radius: 0.65rem;
      padding: 0.55rem 0.7rem;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    .nav-link:hover {
      background: color-mix(in srgb, var(--th-secondary) 22%, transparent 78%);
      color: #ffffff;
    }

    .is-active {
      background: var(--th-accent);
      color: color-mix(in srgb, var(--th-primary) 88%, black 12%);
      font-weight: 700;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 5;
      min-height: 4rem;
      padding: 0.7rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.7rem;
      background: #ffffff;
      border-bottom: 1px solid color-mix(in srgb, var(--th-primary) 15%, white 85%);
    }

    .main-panel {
      min-width: 0;
    }

    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      border: 0;
      background: rgba(15, 23, 42, 0.4);
      z-index: 15;
    }

    .menu-glyph {
      color: var(--th-primary);
      font-size: 1.35rem;
      line-height: 1;
      font-weight: 700;
    }

    .toolbar-content {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .welcome {
      margin: 0;
      color: var(--th-primary);
      font-weight: 600;
    }

    .content {
      padding: 1rem;
      max-width: 82rem;
      margin: 0 auto;
    }

    @media (max-width: 992px) {
      .layout-container {
        display: block;
      }

      .sidenav {
        width: 14rem;
        position: fixed;
        left: 0;
        transform: translateX(-100%);
        transition: transform 0.2s ease;
      }

      .sidenav.is-open {
        transform: translateX(0);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellComponent {
  private readonly session = inject(SessionService);
  private readonly authService = inject(AuthService);

  readonly mobileNavOpen = signal(false);

  private readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', roles: ['client', 'employee', 'manager', 'admin', 'super_admin'] },
    { label: 'Productos', path: '/products', roles: ['client', 'employee', 'manager', 'admin', 'super_admin'] },
    { label: 'Pedidos', path: '/orders', roles: ['client', 'employee', 'manager', 'admin', 'super_admin'] },
    { label: 'Citas', path: '/appointments', roles: ['client', 'employee', 'manager', 'admin', 'super_admin'] },
    { label: 'Tiendas', path: '/stores', roles: ['admin', 'super_admin'] },
    { label: 'Usuarios', path: '/users', roles: ['manager', 'admin', 'super_admin'] }
  ];

  readonly visibleNavItems = computed(() => {
    const role = this.session.role();
    if (!role) {
      return [];
    }

    return this.navItems.filter((item) => item.roles.includes(role));
  });

  readonly welcomeMessage = computed(() => {
    const user = this.session.user();
    if (!user) {
      return 'Hola';
    }

    return `Hola, ${user.fullName} (${user.role})`;
  });

  logout(): void {
    this.authService.logout();
  }
}
