import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthApiService } from '../api/auth-api.service';
import { AuthStorageService } from './auth-storage.service';
import type { AuthResponse } from './auth.models';

let refreshRequest$: Observable<AuthResponse> | null = null;

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/otp/request',
  '/auth/otp/verify',
  '/auth/refresh',
  '/auth/logout'
];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiUrl) || PUBLIC_PATHS.some(path => request.url.endsWith(path))) {
    return next(request);
  }

  const storage = inject(AuthStorageService);
  const token = storage.getAccessToken();
  const router = inject(Router);
  const authApi = inject(AuthApiService);

  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      const refreshToken = storage.getRefreshToken();
      if (!refreshToken) {
        storage.clear();
        void router.navigateByUrl('/login');
        return throwError(() => error);
      }

      if (!refreshRequest$) {
        refreshRequest$ = authApi.refresh(refreshToken).pipe(
          shareReplay(1),
          finalize(() => { refreshRequest$ = null; })
        );
      }

      return refreshRequest$.pipe(
        switchMap(response => {
          storage.updateTokens(response);
          return next(request.clone({
            setHeaders: { Authorization: `Bearer ${response.accessToken}` }
          }));
        }),
        catchError(refreshError => {
          storage.clear();
          void router.navigateByUrl('/login');
          return throwError(() => refreshError);
        })
      );
    })
  );
};
