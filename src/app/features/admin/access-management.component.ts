import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AccessStore } from './access.store';
import { Permission, UserRole } from '../../core/auth/auth.models';
import { AuthStore } from '../../core/auth/auth.store';

type PermissionState = 'none' | 'granted' | 'denied';

type PermissionMeta = { label: string; group: string };

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  TEACHER: 'Enseignant',
  TREASURER: 'Trésorier',
  MEMBER: 'Membre',
  STUDENT: 'Élève',
  CUSTOMER: 'Client',
  PARENT: 'Parent'
};



const PERMISSION_META: Record<Permission, PermissionMeta> = {
  DASHBOARD_VIEW: {
    label: 'Consulter le tableau de bord',
    group: 'Général'
  },

  MEMBER_MANAGE: {
    label: 'Gérer les membres',
    group: 'Dahira'
  },
  ACTIVITY_MANAGE: {
    label: 'Gérer les activités',
    group: 'Dahira'
  },
  COMMISSION_MANAGE: {
    label: 'Gérer les commissions',
    group: 'Dahira'
  },

  STUDENT_MANAGE: {
    label: 'Gérer les élèves',
    group: 'École coranique'
  },
  TEACHER_MANAGE: {
    label: 'Gérer les enseignants',
    group: 'École coranique'
  },
  GROUP_MANAGE: {
    label: 'Gérer les groupes',
    group: 'École coranique'
  },
  ATTENDANCE_MANAGE: {
    label: 'Gérer les présences',
    group: 'École coranique'
  },
  PEDAGOGICAL_TRACKING_MANAGE: {
    label: 'Gérer le suivi pédagogique',
    group: 'École coranique'
  },

  PRODUCT_MANAGE: {
    label: 'Gérer les produits',
    group: 'Boutique'
  },
  STOCK_WRITE: {
    label: 'Gérer le stock',
    group: 'Boutique'
  },
  ORDER_READ: {
    label: 'Consulter les commandes',
    group: 'Boutique'
  },
  ORDER_MANAGE: {
    label: 'Gérer les commandes',
    group: 'Boutique'
  },

  PAYMENT_MANAGE: {
    label: 'Gérer les paiements',
    group: 'Finances'
  },

  USER_MANAGE: {
    label: 'Gérer les utilisateurs',
    group: 'Administration'
  },
  ROLE_MANAGE: {
    label: 'Attribuer les rôles',
    group: 'Administration'
  },
  PERMISSION_MANAGE: {
    label: 'Gérer les permissions',
    group: 'Administration'
  }
};

@Component({
  selector: 'dm-access-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TagModule, ProgressSpinnerModule],
  template: `
    <div class="space-y-6">
      <div>
        <div class="text-sm font-semibold text-[var(--brand-primary)]">Administration</div>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-900">Utilisateurs, rôles et permissions</h1>
        <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Attribuez des rôles et ajustez les permissions individuelles. Les rôles fournissent les droits par défaut ; les permissions individuelles permettent une exception.
        </p>
      </div>

      @if (accessStore.error()) {
        <div role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ accessStore.error() }}
        </div>
      }
      @if (accessStore.notice()) {
        <div role="status" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {{ accessStore.notice() }}
        </div>
      }

      @if (accessStore.loading()) {
        <div class="flex min-h-56 items-center justify-center rounded-2xl border border-[var(--brand-border)] bg-white">
          <p-progress-spinner ariaLabel="Chargement" />
        </div>
      } @else {
        <div class="grid gap-6 xl:grid-cols-[340px,1fr]">
          <section class="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-white shadow-sm">
            <div class="border-b border-[var(--brand-border)] p-5">
              <div class="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Utilisateurs</div>
              <div class="mt-1 text-sm text-slate-500">Sélectionnez un compte pour lui attribuer ou retirer des droits.</div>
              <div class="mt-4">
                <input
                  type="search"
                  aria-label="Rechercher un utilisateur"
                  placeholder="Nom, téléphone ou e-mail…"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--brand-primary)] focus:bg-white"
                  [ngModel]="userSearch()"
                  (ngModelChange)="userSearch.set($event)" />
              </div>
              <div class="mt-2 text-xs text-slate-400">{{ filteredUsers().length }} compte(s)</div>
            </div>
            <div class="max-h-[620px] overflow-y-auto p-2">
              @for (user of filteredUsers(); track user.id) {
                <button
                  type="button"
                  class="mb-1 w-full rounded-xl p-3 text-left transition"
                  [class.bg-emerald-50]="accessStore.selectedUserId() === user.id"
                  [class.ring-1]="accessStore.selectedUserId() === user.id"
                  [class.ring-emerald-200]="accessStore.selectedUserId() === user.id"
                  (click)="accessStore.selectUser(user.id)">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="truncate text-sm font-semibold text-slate-800">{{ userDisplayName(user) }}</div>
                      <div class="mt-0.5 truncate text-xs text-slate-400">{{ user.phone || user.email || 'Coordonnée non renseignée' }}</div>
                    </div>
                    <span class="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold" [class.bg-emerald-50]="user.active" [class.text-emerald-700]="user.active" [class.bg-slate-100]="!user.active" [class.text-slate-500]="!user.active">
                      {{ user.active ? 'Actif' : 'Inactif' }}
                    </span>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-1">
                    @for (role of user.roles; track role) {
                      <span class="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{{ roleLabel(role) }}</span>
                    }
                  </div>
                </button>
              } @empty {
                <div class="px-4 py-10 text-center text-sm text-slate-500">
                  Aucun utilisateur ne correspond à cette recherche.
                </div>
              }
            </div>
          </section>

          <div class="space-y-6">
            <section class="rounded-2xl border border-[var(--brand-border)] bg-white p-5 shadow-sm sm:p-6">
              @if (accessStore.selectedUser(); as selected) {
                <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div class="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Compte sélectionné</div>
                    <h2 class="mt-1 text-xl font-bold text-slate-900">{{ userDisplayName(selected) }}</h2>
                    <div class="mt-1 text-sm text-slate-500">{{ selected.phone || selected.email }}</div>
                  </div>
                  <p-button label="Actualiser" icon="pi pi-refresh" [outlined]="true" size="small" (onClick)="accessStore.selectUser(selected.id)" />
                </div>

                <div class="mt-6 border-t border-[var(--brand-border)] pt-6">
                  <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h3 class="font-semibold text-slate-900">Rôles</h3>
                      <p class="mt-1 text-xs text-slate-500">Cochez pour attribuer un rôle, décochez pour le retirer. Un utilisateur doit garder au moins un rôle.</p>
                    </div>
                    <p-button label="Enregistrer les rôles" icon="pi pi-check" size="small" [loading]="accessStore.saving()" [disabled]="!canManageRoles() || accessStore.pendingUserRoles().length === 0" (onClick)="saveRoles()" />
                  </div>

                  <div class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    @for (role of accessStore.roles(); track role) {
                      <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-[var(--brand-primary)]">
                        <input type="checkbox" class="size-4 accent-[var(--brand-primary)]" [checked]="userHasRole(role)" [disabled]="!canManageRoles()" (change)="toggleUserRole(role)" />
                        <span class="text-sm font-medium text-slate-700">{{ roleLabel(role) }}</span>
                      </label>
                    }
                  </div>
                </div>

                <div class="mt-7 border-t border-[var(--brand-border)] pt-6">
                  <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h3 class="font-semibold text-slate-900">Permissions individuelles</h3>
                      <p class="mt-1 text-xs text-slate-500">Pour chaque droit : hérité du rôle, accordé exceptionnellement ou refusé explicitement.</p>
                    </div>
                    <p-button label="Enregistrer les permissions" icon="pi pi-check" size="small" [loading]="accessStore.saving()" [disabled]="!canManagePermissions()" (onClick)="saveUserPermissions()" />
                  </div>

                  @if (accessStore.selectedUserPermissions(); as settings) {
                    <div class="mt-4 grid gap-5 md:grid-cols-2">
                      @for (group of permissionGroups(); track group.name) {
                        <div class="rounded-xl border border-slate-200 p-4">
                          <div class="mb-3 flex items-center justify-between">
                            <div class="text-sm font-semibold text-slate-800">{{ group.name }}</div>
                            <span class="text-[10px] text-slate-400">{{ group.permissions.length }} droits</span>
                          </div>
                          <div class="space-y-2">
                            @for (permission of group.permissions; track permission) {
                              <div class="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                                <div class="min-w-0">
                                  <div class="text-xs font-medium text-slate-700">{{ permissionLabel(permission) }}</div>
                                  @if (settings.inherited.includes(permission)) {
                                    <div class="mt-0.5 text-[10px] text-slate-400">Hérité d’un rôle</div>
                                  }
                                </div>
                                <select class="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-[var(--brand-primary)]" [value]="permissionState(permission)" [disabled]="!canManagePermissions()" (change)="setPermissionState(permission, $event)">
                                  <option value="none">Par rôle</option>
                                  <option value="granted">Accordée</option>
                                  <option value="denied">Refusée</option>
                                </select>
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              } @else {
                <div class="flex min-h-80 flex-col items-center justify-center text-center">
                  <i class="pi pi-users text-3xl text-slate-300"></i>
                  <h2 class="mt-4 font-semibold text-slate-800">Aucun utilisateur sélectionné</h2>
                  <p class="mt-1 text-sm text-slate-500">Sélectionnez un utilisateur à gauche pour gérer ses accès.</p>
                </div>
              }
            </section>

            <section class="rounded-2xl border border-[var(--brand-border)] bg-white p-5 shadow-sm sm:p-6">
              <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div class="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Configuration des rôles</div>
                  <h2 class="mt-1 text-lg font-bold text-slate-900">Permissions par défaut</h2>
                  <p class="mt-1 text-xs text-slate-500">Configurez les droits accordés automatiquement à chaque rôle.</p>
                </div>
                <select class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[var(--brand-primary)]" [value]="accessStore.selectedRole()" (change)="onRoleChange($event)">
                  @for (role of accessStore.roles(); track role) {
                    <option [value]="role">{{ roleLabel(role) }}</option>
                  }
                </select>
              </div>

              <div class="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                @for (permission of accessStore.permissions(); track permission) {
                  <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:border-[var(--brand-primary)]">
                    <input type="checkbox" class="mt-0.5 size-4 accent-[var(--brand-primary)]" [checked]="accessStore.selectedRolePermissions().includes(permission)" [disabled]="!canManageRoles()" (change)="accessStore.toggleRolePermission(permission)" />
                    <span class="min-w-0">
                      <span class="block text-xs font-medium text-slate-700">{{ permissionLabel(permission) }}</span>
                      <span class="mt-0.5 block text-[10px] text-slate-400">{{ permissionGroup(permission) }}</span>
                    </span>
                  </label>
                }
              </div>

              <div class="mt-5 flex justify-end">
                <p-button label="Enregistrer la configuration" icon="pi pi-save" [loading]="accessStore.saving()" [disabled]="!canManageRoles()" (onClick)="accessStore.saveRolePermissions()" />
              </div>
            </section>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessManagementComponent {
  readonly accessStore = inject(AccessStore);
  readonly authStore = inject(AuthStore);
  readonly userSearch = signal('');
  readonly filteredUsers = computed(() => {
    const query = this.userSearch().trim().toLocaleLowerCase('fr-FR');
    const users = this.accessStore.users();
    if (!query) return users;
    return users.filter(user => [
      user.firstName,
      user.lastName,
      user.phone,
      user.email,
      ...user.roles
    ].some(value => String(value ?? '').toLocaleLowerCase('fr-FR').includes(query)));
  });
  readonly canManageRoles = computed(() => this.authStore.hasPermission('ROLE_MANAGE'));
  readonly canManagePermissions = computed(() => this.authStore.hasPermission('PERMISSION_MANAGE'));

  readonly permissionGroups = computed(() => {
    const map = new Map<string, Permission[]>();
    for (const permission of this.accessStore.permissions()) {
      const group = PERMISSION_META[permission]?.group ?? 'Autres';
      const list = map.get(group) ?? [];
      list.push(permission);
      map.set(group, list);
    }
    return [...map.entries()].map(([name, permissions]) => ({ name, permissions }));
  });

  constructor() {
    void this.accessStore.load();
  }

  userDisplayName(user: { firstName: string | null; lastName: string | null; id: number }): string {
    return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || `Utilisateur #${user.id}`;
  }

  roleLabel(role: UserRole): string { return ROLE_LABELS[role] ?? role; }
  permissionLabel(permission: Permission): string { return PERMISSION_META[permission]?.label ?? permission; }
  permissionGroup(permission: Permission): string { return PERMISSION_META[permission]?.group ?? 'Autres'; }

  userHasRole(role: UserRole): boolean {
    return this.accessStore.pendingUserRoles().includes(role);
  }

  toggleUserRole(role: UserRole): void {
    const roles = new Set(this.accessStore.pendingUserRoles());
    if (roles.has(role)) roles.delete(role); else roles.add(role);
    this.accessStore.setPendingUserRoles([...roles]);
  }

  async saveRoles(): Promise<void> {
    await this.accessStore.saveUserRoles();
  }

  permissionState(permission: Permission): PermissionState {
    const overrides = this.accessStore.pendingUserOverrides();
    if (permission in overrides) return overrides[permission] === true ? 'granted' : 'denied';
    return 'none';
  }

  setPermissionState(permission: Permission, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as PermissionState;
    const overrides = { ...this.accessStore.pendingUserOverrides() };
    if (value === 'granted') overrides[permission] = true;
    else if (value === 'denied') overrides[permission] = false;
    else delete overrides[permission];
    this.accessStore.setPendingUserPermissionOverrides(overrides);
  }

  saveUserPermissions(): void {
    void this.accessStore.saveUserPermissionOverrides();
  }

  onRoleChange(event: Event): void {
    const role = (event.target as HTMLSelectElement).value as UserRole;
    void this.accessStore.selectRole(role);
  }
}
