import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { TooltipModule } from 'primeng/tooltip';
import { AuthStore } from '../auth/auth.store';
import { Permission } from '../auth/auth.models';
import { ShopStore } from '../../features/shop/shop.store';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  permissions?: Permission[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'dm-app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, DrawerModule, TooltipModule],
  template: `
    <div class="flex min-h-screen bg-[var(--brand-bg)]">
      <aside class="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-[var(--brand-primary-dark)] text-white lg:flex">
        <div class="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div class="flex size-10 items-center justify-center rounded-xl bg-white/10 text-lg font-bold">DM</div>
          <div>
            <div class="font-bold tracking-tight">Dara Massalik</div>
            <div class="text-xs text-white/55">Gestion du Dahira</div>
          </div>
        </div>

        <nav class="flex-1 space-y-3 overflow-y-auto p-4">
          @for (section of visibleNavSections(); track section.label) {
            <section>
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 transition hover:bg-white/5 hover:text-white/70"
                (click)="toggleSection(section.label)"
                [attr.aria-expanded]="isSectionExpanded(section.label)">
                <span>{{ section.label }}</span>
                <i class="text-[10px]" [class.pi-chevron-down]="isSectionExpanded(section.label)" [class.pi-chevron-right]="!isSectionExpanded(section.label)"></i>
              </button>

              @if (isSectionExpanded(section.label)) {
                <div class="space-y-1">
                  @for (item of visibleItems(section); track item.route) {
                    <a [routerLink]="item.route"
                       routerLinkActive="bg-white/12 text-white shadow-sm"
                       [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
                       class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/8 hover:text-white">
                      <i [class]="item.icon + ' w-5 text-center'"></i>
                      <span>{{ item.label }}</span>
                    </a>
                  }
                </div>
              }
            </section>
          }
        </nav>

        <div class="border-t border-white/10 p-4">
          <div class="flex items-center gap-3 rounded-xl bg-white/6 p-3">
            <a routerLink="/profile" class="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-accent)] text-sm font-bold text-[var(--brand-ink)]">{{ authInitial() }}</a>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-semibold">{{ authStore.displayName() }}</div>
              <div class="text-xs text-white/45">{{ authStore.roleLabels().join(' · ') }}</div>
            </div>
            <button (click)="logout()" class="text-white/45 hover:text-white" aria-label="Se déconnecter"><i class="pi pi-sign-out"></i></button>
          </div>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col lg:pl-72">
        <header class="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-[var(--brand-border)] bg-white/95 px-4 backdrop-blur sm:px-6">
          <div class="flex items-center gap-3">
            <p-button icon="pi pi-bars" [text]="true" [rounded]="true" (onClick)="mobileMenu.set(true)" class="lg:hidden" aria-label="Ouvrir le menu" />
            <div class="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-400 sm:flex sm:w-80">
              <i class="pi pi-search"></i><span>Rechercher dans le Dahira...</span>
            </div>
            <div class="hidden md:block">
              <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">Espace Dahira</div>
              <div class="text-sm font-semibold text-slate-800">Dara Massalik</div>
            </div>
          </div>
          <div class="flex items-center gap-2 sm:gap-3">
            <a routerLink="/shop/cart" class="relative flex size-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100" aria-label="Ouvrir le panier">
              <i class="pi pi-shopping-cart"></i>
              @if (shopStore.cartCount() > 0) {
                <span class="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-[var(--brand-accent)] text-[10px] font-bold text-[var(--brand-ink)]">{{ shopStore.cartCount() }}</span>
              }
            </a>
            <button class="relative flex size-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100" aria-label="Notifications">
              <i class="pi pi-bell"></i><span class="absolute right-1 top-1 size-2 rounded-full bg-[var(--brand-accent)]"></span>
            </button>
            <a routerLink="/profile" class="hidden text-right sm:block hover:opacity-80"><div class="text-sm font-semibold">{{ authStore.displayName() }}</div><div class="text-xs text-slate-400">{{ authStore.roleLabels().join(' · ') }}</div></a>
            <a routerLink="/profile" class="flex size-10 items-center justify-center rounded-full bg-[var(--brand-primary)] font-semibold text-white" aria-label="Mon profil">{{ authInitial() }}</a>
          </div>
        </header>

        <main class="flex-1 p-4 sm:p-6 lg:p-8"><router-outlet /></main>
      </div>

      <p-drawer [(visible)]="mobileMenu" position="left" [style]="{ width: '20rem' }">
        <ng-template pTemplate="header">
          <div class="flex items-center gap-3"><div class="flex size-9 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-xs font-bold text-white">DM</div><strong>Dara Massalik</strong></div>
        </ng-template>
        <div class="space-y-3">
          @for (section of visibleNavSections(); track section.label) {
            <section>
              <button type="button" class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400" (click)="toggleSection(section.label)" [attr.aria-expanded]="isSectionExpanded(section.label)">
                <span>{{ section.label }}</span>
                <i class="text-[10px]" [class.pi-chevron-down]="isSectionExpanded(section.label)" [class.pi-chevron-right]="!isSectionExpanded(section.label)"></i>
              </button>
              @if (isSectionExpanded(section.label)) {
                <nav class="space-y-1">
                  @for (item of visibleItems(section); track item.route) {
                    <a [routerLink]="item.route" (click)="mobileMenu.set(false)" routerLinkActive="bg-slate-100 text-[var(--brand-primary)]" class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-700">
                      <i [class]="item.icon + ' w-5 text-center'"></i>{{ item.label }}
                    </a>
                  }
                </nav>
              }
            </section>
          }
          <button (click)="logout()" class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100"><i class="pi pi-sign-out"></i>Se déconnecter</button>
        </div>
      </p-drawer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppLayoutComponent {
  readonly authStore = inject(AuthStore);
  readonly shopStore = inject(ShopStore);
  private readonly router = inject(Router);
  readonly mobileMenu = signal(false);

  readonly navSections: NavSection[] = [
    { label: 'Accueil', items: [{ label: 'Tableau de bord', icon: 'pi pi-home', route: '/dashboard', permissions: ['DASHBOARD_VIEW'] }] },
    {
      label: 'École coranique',
      items: [
        { label: 'Élèves', icon: 'pi pi-users', route: '/students', permissions: ['STUDENT_MANAGE'] },
        { label: 'Enseignants', icon: 'pi pi-user-edit', route: '/teachers', permissions: ['TEACHER_MANAGE'] },
        { label: 'Groupes', icon: 'pi pi-th-large', route: '/groups', permissions: ['GROUP_MANAGE'] },
        { label: 'Présences', icon: 'pi pi-calendar-clock', route: '/attendance', permissions: ['ATTENDANCE_MANAGE'] },
        { label: 'Suivi pédagogique', icon: 'pi pi-book', route: '/pedagogical-tracking', permissions: ['PEDAGOGICAL_TRACKING_MANAGE'] }
      ]
    },
    {
      label: 'Dahira et organisation',
      items: [
        { label: 'Membres', icon: 'pi pi-users', route: '/members', permissions: ['MEMBER_MANAGE'] },
        { label: 'Activités', icon: 'pi pi-calendar', route: '/activities', permissions: ['ACTIVITY_MANAGE'] },
        { label: 'Commissions', icon: 'pi pi-sitemap', route: '/commissions', permissions: ['COMMISSION_MANAGE'] }
      ]
    },
    { label: 'Finances', items: [{ label: 'Paiements et cotisations', icon: 'pi pi-wallet', route: '/payments', permissions: ['PAYMENT_MANAGE'] }] },
    {
      label: 'Boutique et stock',
      items: [
        { label: 'Catalogue', icon: 'pi pi-box', route: '/shop' },
        { label: 'Panier', icon: 'pi pi-shopping-cart', route: '/shop/cart', permissions: ['ORDER_READ', 'ORDER_MANAGE'] },
        { label: 'Ventes', icon: 'pi pi-receipt', route: '/shop/sales', permissions: ['ORDER_MANAGE'] }
      ]
    },
    {
      label: 'Compte',
      items: [
        { label: 'Mon profil', icon: 'pi pi-user', route: '/profile' },
        { label: 'Mes commandes', icon: 'pi pi-receipt', route: '/orders', permissions: ['ORDER_READ'] }
      ]
    },
    { label: 'Administration', items: [{ label: 'Utilisateurs, rôles & permissions', icon: 'pi pi-shield', route: '/administration/access', permissions: ['ROLE_MANAGE', 'PERMISSION_MANAGE'] }] }
  ];

  readonly visibleNavSections = computed(() => this.navSections
    .map(section => ({ ...section, items: this.visibleItems(section) }))
    .filter(section => section.items.length > 0));

  readonly expandedSections = signal<Record<string, boolean>>(
    Object.fromEntries(this.navSections.map(section => [section.label, true]))
  );

  isSectionExpanded(label: string): boolean { return this.expandedSections()[label] ?? true; }

  toggleSection(label: string): void {
    this.expandedSections.update(state => ({ ...state, [label]: !state[label] }));
  }

  visibleItems(section: NavSection): NavItem[] {
    return section.items.filter(item => !item.permissions?.length || this.authStore.hasAnyPermission(item.permissions));
  }

  authInitial(): string {
    const name = this.authStore.displayName().trim();
    return name.charAt(0).toUpperCase() || 'U';
  }

  logout(): void {
    this.authStore.logout();
    this.router.navigateByUrl('/login');
  }
}
