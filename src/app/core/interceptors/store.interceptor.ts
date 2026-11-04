import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';
import { StoreContextService } from '../services/store-context.service';

export const storeInterceptor: HttpInterceptorFn = (req, next) => {
  const storeContext = inject(StoreContextService);
  const session = inject(SessionService);
  const storeId = storeContext.storeId();
  const role = session.role();
  const isUsersRequest = /\/users(?:\/|$)/.test(req.url);

  if (role === 'super_admin' && isUsersRequest) {
    return next(req);
  }

  if (!storeId) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        'x-store-id': storeId
      }
    })
  );
};
