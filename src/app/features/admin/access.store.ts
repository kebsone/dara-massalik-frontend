import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { AccessApiService, UserPermissionSettings, UserSummary } from '../../core/api/access-api.service';
import { Permission, UserRole } from '../../core/auth/auth.models';

interface AccessState {
  users: UserSummary[];
  roles: UserRole[];
  permissions: Permission[];
  selectedUserId: number | null;
  selectedUserPermissions: UserPermissionSettings | null;
  selectedRole: UserRole | null;
  selectedRolePermissions: Permission[];
  pendingUserRoles: UserRole[];
  pendingUserOverrides: Partial<Record<Permission, boolean>>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  notice: string | null;
}

function overridesFromSettings(settings: UserPermissionSettings): Partial<Record<Permission, boolean>> {
  const overrides: Partial<Record<Permission, boolean>> = {};
  for (const permission of settings.granted) overrides[permission] = true;
  for (const permission of settings.denied) overrides[permission] = false;
  return overrides;
}

export const AccessStore = signalStore(
  { providedIn: 'root' },
  withState<AccessState>({
    users: [], roles: [], permissions: [], selectedUserId: null,
    selectedUserPermissions: null, selectedRole: null, selectedRolePermissions: [],
    pendingUserRoles: [], pendingUserOverrides: {},
    loading: false, saving: false, error: null, notice: null
  }),
  withComputed(({ users, selectedUserId, selectedRole }) => ({
    selectedUser: computed(() => users().find(user => user.id === selectedUserId()) ?? null),
    selectedRoleLabel: computed(() => selectedRole() ?? ''),
  })),
  withMethods((store, api = inject(AccessApiService)) => ({
    async load(): Promise<void> {
      patchState(store, { loading: true, error: null, notice: null });
      try {
        const [users, roles, permissions] = await Promise.all([
          firstValueFrom(api.listUsers()),
          firstValueFrom(api.listRoles()),
          firstValueFrom(api.listPermissions())
        ]);
        const selectedUserId = store.selectedUserId() ?? users[0]?.id ?? null;
        patchState(store, { users, roles, permissions, selectedUserId, loading: false });
        if (selectedUserId !== null) {
          const settings = await firstValueFrom(api.getUserPermissions(selectedUserId));
          patchState(store, { selectedUserPermissions: settings, pendingUserRoles: settings.roles, pendingUserOverrides: overridesFromSettings(settings) });
        }
        const selectedRole = store.selectedRole() ?? roles[0] ?? null;
        if (selectedRole) {
          const rolePermissions = await firstValueFrom(api.getRolePermissions(selectedRole));
          patchState(store, { selectedRole, selectedRolePermissions: rolePermissions });
        }
      } catch (error: any) {
        patchState(store, { loading: false, error: error?.error?.message ?? 'Impossible de charger la gestion des accès.' });
      }
    },

    async selectUser(userId: number): Promise<void> {
      patchState(store, { selectedUserId: userId, selectedUserPermissions: null, pendingUserRoles: [], pendingUserOverrides: {}, error: null, notice: null });
      try {
        const settings = await firstValueFrom(api.getUserPermissions(userId));
        patchState(store, { selectedUserPermissions: settings, pendingUserRoles: settings.roles, pendingUserOverrides: overridesFromSettings(settings) });
      } catch (error: any) {
        patchState(store, { error: error?.error?.message ?? 'Impossible de charger les droits de cet utilisateur.' });
      }
    },

    setPendingUserRoles(roles: UserRole[]): void {
      patchState(store, { pendingUserRoles: roles });
    },

    setPendingUserPermissionOverrides(overrides: Partial<Record<Permission, boolean>>): void {
      patchState(store, { pendingUserOverrides: overrides });
    },

    async saveUserRoles(roles: UserRole[] = store.pendingUserRoles()): Promise<void> {
      const userId = store.selectedUserId();
      if (userId === null) return;
      patchState(store, { saving: true, error: null, notice: null });
      try {
        await firstValueFrom(api.updateUserRoles(userId, roles));
        const settings = await firstValueFrom(api.getUserPermissions(userId));
        patchState(store, {
          saving: false,
          selectedUserPermissions: settings,
          pendingUserRoles: settings.roles,
          pendingUserOverrides: overridesFromSettings(settings),
          users: store.users().map(user => user.id === userId ? { ...user, roles } : user),
          notice: 'Les rôles de cet utilisateur ont été enregistrés.'
        });
      } catch (error: any) {
        patchState(store, { saving: false, error: error?.error?.message ?? 'Impossible d’enregistrer les rôles.' });
      }
    },

    async saveUserPermissionOverrides(overrides: Partial<Record<Permission, boolean>> = store.pendingUserOverrides()): Promise<void> {
      const userId = store.selectedUserId();
      if (userId === null) return;
      patchState(store, { saving: true, error: null, notice: null });
      try {
        const settings = await firstValueFrom(api.updateUserPermissions(userId, overrides));
        patchState(store, { saving: false, selectedUserPermissions: settings, pendingUserRoles: settings.roles, pendingUserOverrides: overridesFromSettings(settings), notice: 'Les permissions individuelles ont été enregistrées.' });
      } catch (error: any) {
        patchState(store, { saving: false, error: error?.error?.message ?? 'Impossible d’enregistrer les permissions.' });
      }
    },

    async selectRole(role: UserRole): Promise<void> {
      patchState(store, { selectedRole: role, selectedRolePermissions: [], error: null, notice: null });
      try {
        const permissions = await firstValueFrom(api.getRolePermissions(role));
        patchState(store, { selectedRolePermissions: permissions });
      } catch (error: any) {
        patchState(store, { error: error?.error?.message ?? 'Impossible de charger les permissions du rôle.' });
      }
    },

    toggleRolePermission(permission: Permission): void {
      const current = new Set(store.selectedRolePermissions());
      if (current.has(permission)) current.delete(permission); else current.add(permission);
      patchState(store, { selectedRolePermissions: [...current] });
    },

    async saveRolePermissions(): Promise<void> {
      const role = store.selectedRole();
      if (!role) return;
      patchState(store, { saving: true, error: null, notice: null });
      try {
        const permissions = await firstValueFrom(api.updateRolePermissions(role, store.selectedRolePermissions()));
        patchState(store, { saving: false, selectedRolePermissions: permissions, notice: 'Les permissions par défaut du rôle ont été enregistrées.' });
      } catch (error: any) {
        patchState(store, { saving: false, error: error?.error?.message ?? 'Impossible d’enregistrer les permissions du rôle.' });
      }
    }
  }))
);
