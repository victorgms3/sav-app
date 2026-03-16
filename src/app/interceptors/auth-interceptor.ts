import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token       = authService.getToken();

  let authReq = req;

  // Clonage de la requête pour lui ajouter le token JWT :
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si le serveur répond 401 → token expiré ou invalide → déconnexion auto
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};