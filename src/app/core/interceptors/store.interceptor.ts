import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StoreContextService } from '../services/store-context.service';

export const storeInterceptor: HttpInterceptorFn = (req, next) => {
  const storeContext = inject(StoreContextService);
  const storeId = storeContext.storeId();

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
