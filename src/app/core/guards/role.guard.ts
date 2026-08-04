import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';
import { UserRole } from '../models/domain.models';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const requiredRoles = (route.data['roles'] as UserRole[] | undefined) ?? [];

  if (requiredRoles.length === 0) {
    return true;
  }

  const role = session.role();
  if (role && requiredRoles.includes(role)) {
    return true;
  }

  return router.createUrlTree(['/']);
};
