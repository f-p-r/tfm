import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo aplicar withCredentials a peticiones al backend
  if (req.url.startsWith(environment.apiBaseUrl)) {
    const clonedRequest = req.clone({
      withCredentials: true,
    });
    return next(clonedRequest);
  }

  return next(req);
};
