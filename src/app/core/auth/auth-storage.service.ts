import { Injectable } from '@angular/core';
import type { AuthResponse, AuthUser } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  private readonly accessTokenKey = 'dm-auth-token';
  private readonly refreshTokenKey = 'dm-auth-refresh-token';
  private readonly userKey = 'dm-auth-user';
  private persistent = true;

  constructor() {
    this.persistent = localStorage.getItem(this.accessTokenKey) !== null || localStorage.getItem(this.refreshTokenKey) !== null;
  }

  getAccessToken(): string | null {
    return this.read(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return this.read(this.refreshTokenKey);
  }

  getUser(): AuthUser | null {
    const raw = this.read(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  isPersistent(): boolean {
    return this.persistent;
  }

  saveSession(response: AuthResponse, remember: boolean): void {
    this.persistent = remember;
    const target = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;

    other.removeItem(this.accessTokenKey);
    other.removeItem(this.refreshTokenKey);
    other.removeItem(this.userKey);

    target.setItem(this.accessTokenKey, response.accessToken);
    target.setItem(this.refreshTokenKey, response.refreshToken);
    target.setItem(this.userKey, JSON.stringify(response.user));
  }

  updateUser(user: AuthUser): void {
    const target = this.persistent ? localStorage : sessionStorage;
    target.setItem(this.userKey, JSON.stringify(user));
  }

  updateTokens(response: AuthResponse): void {
    const target = this.persistent ? localStorage : sessionStorage;
    target.setItem(this.accessTokenKey, response.accessToken);
    target.setItem(this.refreshTokenKey, response.refreshToken);
    target.setItem(this.userKey, JSON.stringify(response.user));
  }

  clear(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    sessionStorage.removeItem(this.accessTokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
    sessionStorage.removeItem(this.userKey);
  }

  private read(key: string): string | null {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  }
}
