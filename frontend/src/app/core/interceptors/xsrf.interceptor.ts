import { HttpInterceptorFn } from '@angular/common/http';

export const xsrfInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo agregar el header para métodos que no sean GET, HEAD, OPTIONS
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next(req);
  }

  // Leer la cookie XSRF-TOKEN
  const token = getCookie('XSRF-TOKEN');

  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        'X-XSRF-TOKEN': decodeURIComponent(token),
      },
    });
    return next(clonedRequest);
  }

  return next(req);
};

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}
