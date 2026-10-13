import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from './auth.store';
import { Permission } from './auth.models';

export const permissionGuard: CanActivateFn = route => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const required = (route.data['permissions'] as Permission[] | undefined) ?? [];
  if (!required.length || auth.hasAnyPermission(required)) return true;
  return router.parseUrl('/dashboard');
};
