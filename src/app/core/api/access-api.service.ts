import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permission, UserRole } from '../auth/auth.models';

export interface UserSummary {
  id: number;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
  roles: UserRole[];
}

export interface UserPermissionSettings {
  userId: number;
  roles: UserRole[];
  inherited: Permission[];
  granted: Permission[];
  denied: Permission[];
  effective: Permission[];
}

@Injectable({ providedIn: 'root' })
export class AccessApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/access`;

  listUsers(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.baseUrl}/users`);
  }

  listRoles(): Observable<UserRole[]> {
    return this.http.get<UserRole[]>(`${this.baseUrl}/roles`);
  }

  listPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.baseUrl}/permissions`);
  }

  getRolePermissions(role: UserRole): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.baseUrl}/roles/${role}/permissions`);
  }

  updateRolePermissions(role: UserRole, permissions: Permission[]): Observable<Permission[]> {
    return this.http.put<Permission[]>(`${this.baseUrl}/roles/${role}/permissions`, { permissions });
  }

  getUserRoles(userId: number): Observable<{ userId: number; roles: UserRole[] }> {
    return this.http.get<{ userId: number; roles: UserRole[] }>(`${this.baseUrl}/users/${userId}/roles`);
  }

  updateUserRoles(userId: number, roles: UserRole[]): Observable<{ userId: number; roles: UserRole[] }> {
    return this.http.put<{ userId: number; roles: UserRole[] }>(`${this.baseUrl}/users/${userId}/roles`, { roles });
  }

  getUserPermissions(userId: number): Observable<UserPermissionSettings> {
    return this.http.get<UserPermissionSettings>(`${this.baseUrl}/users/${userId}/permissions`);
  }

  updateUserPermissions(userId: number, overrides: Partial<Record<Permission, boolean>>): Observable<UserPermissionSettings> {
    return this.http.put<UserPermissionSettings>(`${this.baseUrl}/users/${userId}/permissions`, { overrides });
  }
}
