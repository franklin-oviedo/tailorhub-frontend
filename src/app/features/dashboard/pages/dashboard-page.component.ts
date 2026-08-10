import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [],
  templateUrl: 'dashboard-page.html',
  styleUrl: 'dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent {
  readonly session = inject(SessionService);
}
