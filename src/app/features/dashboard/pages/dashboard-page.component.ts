import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [],
  template: `
    <section class="dashboard-grid">
      <article class="th-card">
        <header class="th-card-head">
          <h2 class="th-card-title">Dashboard</h2>
        </header>
        <div class="th-card-body">
          <p>Bienvenido a TailorHub.</p>
          <p>Rol actual: <strong>{{ session.role() ?? 'n/a' }}</strong></p>
        </div>
      </article>

      <article class="th-card">
        <header class="th-card-head">
          <h3 class="th-card-title">Resumen</h3>
        </header>
        <div class="th-card-body">
          <p>Gestiona usuarios, tiendas, productos, pedidos y citas desde el menu lateral.</p>
        </div>
      </article>
    </section>
  `,
  styles: `
    .dashboard-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
    }

    h2,
    h3 {
      color: white;
      margin-top: 0;
    }

    strong {
      color: var(--th-secondary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent {
  readonly session = inject(SessionService);
}
