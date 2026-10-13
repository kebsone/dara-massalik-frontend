import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from '../api/auth-api.service';
import { AuthStorageService } from './auth-storage.service';
import {
  AuthUser,
  Permission,
  UserRole,
  LoginRequest,
  RequestOtpResponse,
  VerifyOtpRequest
} from './auth.models';

function readStorage(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function readStoredUser(): AuthUser | null {
  const raw = readStorage('dm-auth-user');
  const token = readStorage('dm-auth-token');
  if (!raw || !token) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    const roles = parsed.roles?.length ? parsed.roles : (parsed.role ? [parsed.role] : []);
    return {
      id: parsed.id!,
      phone: parsed.phone ?? null,
      email: parsed.email ?? null,
      firstName: parsed.firstName ?? null,
      lastName: parsed.lastName ?? null,
      role: parsed.role ?? roles[0] ?? null,
      roles,
      permissions: parsed.permissions ?? []
    };
  } catch { return null; }
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  otpChallengeId: string | null;
  otpExistingUser: boolean;
  otpDebugCode: string | null;
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthState>({
    user: readStoredUser(),
    token: readStorage('dm-auth-token'),
    loading: false,
    error: null,
    otpChallengeId: null,
    otpExistingUser: true,
    otpDebugCode: null
  }),
  withComputed(({ user }) => ({
    isAuthenticated: computed(() => user() !== null),
    roles: computed(() => user()?.roles ?? []),
    permissions: computed(() => user()?.permissions ?? []),
    displayName: computed(() => {
      const current = user();
      if (!current) return 'Utilisateur';
      const name = [current.firstName, current.lastName].filter(Boolean).join(' ').trim();
      if (name) return name;
      return current.email ?? current.phone ?? 'Utilisateur';
    }),
    roleLabel: computed(() => {
      const labels: Record<string, string> = {
        ADMIN: 'Administrateur', TEACHER: 'Enseignant', TREASURER: 'Trésorier',
        MEMBER: 'Membre', STUDENT: 'Élève', CUSTOMER: 'Client', PARENT: 'Parent'
      };
      return labels[user()?.role ?? ''] ?? '';
    }),
    roleLabels: computed(() => {
      const labels: Record<string, string> = {
        ADMIN: 'Administrateur', TEACHER: 'Enseignant', TREASURER: 'Trésorier',
        MEMBER: 'Membre', STUDENT: 'Élève', CUSTOMER: 'Client', PARENT: 'Parent'
      };
      return (user()?.roles ?? []).map(role => labels[role] ?? role);
    }),
  })),
  withMethods((store, authApi = inject(AuthApiService), storage = inject(AuthStorageService)) => ({
    hasRole(role: UserRole): boolean { return store.user()?.roles.includes(role) ?? false; },

    hasPermission(permission: Permission): boolean {
      const current = store.user();
      return current?.roles.includes('ADMIN') === true || current?.permissions.includes(permission) === true;
    },

    hasAnyPermission(permissions: Permission[]): boolean {
      const current = store.user();
      return current?.roles.includes('ADMIN') === true || permissions.some(permission => current?.permissions.includes(permission) === true);
    },

    async login(request: LoginRequest, remember: boolean): Promise<boolean> {
      patchState(store, { loading: true, error: null });
      try {
        const response = await firstValueFrom(authApi.login(request));
        storage.saveSession(response, remember);
        patchState(store, { user: response.user, token: response.accessToken, loading: false, error: null });
        return true;
      } catch {
        patchState(store, { loading: false, error: 'Adresse e-mail ou mot de passe incorrect.' });
        return false;
      }
    },

    async requestOtp(phoneNumber: string): Promise<RequestOtpResponse | null> {
      patchState(store, { loading: true, error: null, otpDebugCode: null });
      try {
        const response = await firstValueFrom(authApi.requestOtp(phoneNumber));
        patchState(store, {
          loading: false,
          otpChallengeId: response.challengeId,
          otpExistingUser: response.existingUser,
          otpDebugCode: response.debugCode,
          error: null
        });
        return response;
      } catch (error: any) {
        patchState(store, {
          loading: false,
          error: error?.error?.message ?? 'Impossible d’envoyer le code de vérification.'
        });
        return null;
      }
    },

    async verifyOtp(request: Omit<VerifyOtpRequest, 'challengeId'>, remember: boolean): Promise<boolean> {
      const challengeId = store.otpChallengeId();
      if (!challengeId) {
        patchState(store, { error: 'La demande de code a expiré. Demandez un nouveau code.' });
        return false;
      }
      patchState(store, { loading: true, error: null });
      try {
        const response = await firstValueFrom(authApi.verifyOtp({ ...request, challengeId }));
        storage.saveSession(response, remember);
        patchState(store, {
          user: response.user,
          token: response.accessToken,
          loading: false,
          error: null,
          otpChallengeId: null,
          otpDebugCode: null
        });
        return true;
      } catch (error: any) {
        patchState(store, {
          loading: false,
          error: error?.error?.message ?? 'Code de vérification invalide ou expiré.'
        });
        return false;
      }
    },

    setUser(user: AuthUser): void {
      patchState(store, { user });
      storage.updateUser(user);
    },

    logout(): void {
      const refreshToken = storage.getRefreshToken();
      if (refreshToken) void firstValueFrom(authApi.logout(refreshToken)).catch(() => undefined);
      storage.clear();
      patchState(store, {
        user: null,
        token: null,
        loading: false,
        error: null,
        otpChallengeId: null,
        otpDebugCode: null
      });
    },

    clearOtp(): void {
      patchState(store, { otpChallengeId: null, otpDebugCode: null, error: null });
    }
  }))
);
