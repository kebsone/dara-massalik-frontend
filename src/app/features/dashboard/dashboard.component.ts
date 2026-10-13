import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

interface Metric {
  label: string;
  value: string;
  detail: string;
  icon: string;
}

@Component({
  selector: 'dm-dashboard',
  standalone: true,
  imports: [RouterLink, CardModule, TagModule],
  template: `
    <div class="page-enter space-y-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p class="text-sm font-medium text-[var(--brand-primary)]">Dimanche 4 octobre 2026</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Vue d'ensemble du Dahira</h1>
          <p class="mt-1 max-w-2xl text-sm text-slate-500">Pilotez l'école, la boutique, les commissions et les activités depuis un seul espace.</p>
        </div>
        <a routerLink="/activities" class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-primary-dark)]"><i class="pi pi-plus"></i>Nouvelle activité</a>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        @for (metric of metrics; track metric.label) {
          <p-card styleClass="border border-[var(--brand-border)] shadow-sm xl:col-span-1">
            <div class="flex items-start justify-between gap-3">
              <div><p class="text-xs font-medium text-slate-500">{{ metric.label }}</p><p class="mt-1 text-2xl font-bold text-slate-900">{{ metric.value }}</p><p class="mt-1 text-xs text-slate-400">{{ metric.detail }}</p></div>
              <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-bg)] text-[var(--brand-primary)]"><i [class]="metric.icon"></i></div>
            </div>
          </p-card>
        }
      </div>

      <div class="grid gap-6 xl:grid-cols-3">
        <p-card styleClass="border border-[var(--brand-border)] shadow-sm xl:col-span-2">
          <ng-template #title><span class="text-base font-semibold">Les pôles du Dahira</span></ng-template>
          <ng-template #subtitle><span class="text-xs text-slate-500">Accès rapide aux domaines de gestion</span></ng-template>
          <div class="grid gap-4 pt-3 sm:grid-cols-2">
            @for (module of modules; track module.route) {
              <a [routerLink]="module.route" class="group rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-[var(--brand-border)] hover:bg-white hover:shadow-sm">
                <div class="flex items-start gap-3">
                  <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"><i [class]="module.icon + ' text-lg'"></i></div>
                  <div class="min-w-0 flex-1"><div class="flex items-center justify-between gap-2"><h3 class="font-semibold text-slate-800">{{ module.title }}</h3><i class="pi pi-arrow-up-right text-xs text-slate-300 transition group-hover:text-[var(--brand-primary)]"></i></div><p class="mt-1 text-xs leading-5 text-slate-500">{{ module.description }}</p><div class="mt-3 text-xs font-semibold text-[var(--brand-primary)]">{{ module.stat }}</div></div>
                </div>
              </a>
            }
          </div>
        </p-card>

        <p-card styleClass="border border-[var(--brand-border)] shadow-sm">
          <ng-template #title><span class="text-base font-semibold">À venir</span></ng-template>
          <div class="space-y-3 pt-2">
            @for (activity of upcoming; track activity.title) {
              <div class="flex gap-3 rounded-xl border border-slate-100 p-3">
                <div class="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-[var(--brand-bg)] text-[var(--brand-primary)]"><span class="text-[10px] font-bold uppercase">{{ activity.month }}</span><span class="text-sm font-bold">{{ activity.day }}</span></div>
                <div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold text-slate-700">{{ activity.title }}</p><p class="mt-0.5 text-xs text-slate-400">{{ activity.meta }}</p></div>
              </div>
            }
          </div>
          <a routerLink="/activities" class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-primary)]">Voir toutes les activités <i class="pi pi-arrow-right text-xs"></i></a>
        </p-card>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <p-card styleClass="border border-[var(--brand-border)] shadow-sm">
          <ng-template #title><span class="text-base font-semibold">Alertes à traiter</span></ng-template>
          <div class="space-y-3 pt-2">
            @for (alert of alerts; track alert.title) {
              <div class="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                <div class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full" [class]="alert.tone"><i [class]="alert.icon"></i></div>
                <div class="flex-1"><p class="text-sm font-semibold text-slate-700">{{ alert.title }}</p><p class="mt-1 text-xs text-slate-500">{{ alert.description }}</p></div>
                <p-tag [value]="alert.tag" [severity]="alert.severity" />
              </div>
            }
          </div>
        </p-card>

        <p-card styleClass="border border-[var(--brand-border)] shadow-sm">
          <ng-template #title><span class="text-base font-semibold">Activité récente</span></ng-template>
          <div class="divide-y divide-slate-100 pt-1">
            @for (item of recent; track item.text) {
              <div class="flex items-center gap-3 py-3">
                <div class="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[var(--brand-primary)]"><i [class]="item.icon"></i></div>
                <div class="min-w-0 flex-1"><p class="text-sm font-medium text-slate-700">{{ item.text }}</p><p class="mt-0.5 text-xs text-slate-400">{{ item.time }}</p></div>
              </div>
            }
          </div>
        </p-card>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  readonly metrics: Metric[] = [
    { label: 'Membres', value: '124', detail: '+4 ce mois', icon: 'pi pi-users' },
    { label: 'Élèves', value: '87', detail: '6 groupes actifs', icon: 'pi pi-book' },
    { label: 'Commissions', value: '5', detail: '3 activités en cours', icon: 'pi pi-sitemap' },
    { label: 'Activités', value: '8', detail: '3 à venir', icon: 'pi pi-calendar' },
    { label: 'Boutique', value: '2 480 €', detail: 'CA septembre', icon: 'pi pi-shopping-cart' },
    { label: 'Cotisations', value: '1 125 €', detail: '76 % collectées', icon: 'pi pi-wallet' }
  ];

  readonly modules = [
    { title: 'Dahira', icon: 'pi pi-users', route: '/members', description: 'Membres, activités et organisation des commissions.', stat: '124 membres' },
    { title: 'École coranique', icon: 'pi pi-book', route: '/students', description: 'Élèves, présences, groupes et suivi pédagogique.', stat: '87 élèves' },
    { title: 'Boutique', icon: 'pi pi-shopping-bag', route: '/shop', description: 'Produits, stock, ventes et suivi de l’activité commerciale.', stat: '38 produits' },
    { title: 'Commissions', icon: 'pi pi-sitemap', route: '/commissions', description: 'Responsables, membres, missions et échéances.', stat: '5 commissions' }
  ];

  readonly upcoming = [
    { month: 'OCT', day: '11', title: 'Réunion commission éducation', meta: 'Dimanche · 18h00' },
    { month: 'OCT', day: '18', title: 'Journée des enfants', meta: 'Dimanche · École coranique' },
    { month: 'OCT', day: '25', title: 'Assemblée du Dahira', meta: 'Dimanche · 17h00' }
  ];

  readonly alerts = [
    { icon: 'pi pi-exclamation-triangle', tone: 'bg-amber-50 text-amber-700', title: 'Stock faible', description: '4 produits de la boutique doivent être réapprovisionnés.', tag: 'Boutique', severity: 'warn' as const },
    { icon: 'pi pi-calendar-times', tone: 'bg-red-50 text-red-700', title: 'Absences répétées', description: '6 élèves ont plus de deux absences consécutives.', tag: 'École', severity: 'danger' as const },
    { icon: 'pi pi-check-circle', tone: 'bg-emerald-50 text-emerald-700', title: 'Cotisations', description: '76 % des cotisations du mois ont été collectées.', tag: 'Finance', severity: 'success' as const }
  ];

  readonly recent = [
    { icon: 'pi pi-user-plus', text: 'Nouveau membre ajouté : Abdoulaye Fall', time: 'Il y a 45 min' },
    { icon: 'pi pi-shopping-cart', text: 'Vente enregistrée : 3 articles', time: 'Il y a 1 h' },
    { icon: 'pi pi-calendar-check', text: 'Présences du groupe 2 enregistrées', time: 'Il y a 2 h' },
    { icon: 'pi pi-sitemap', text: 'Commission éducation mise à jour', time: 'Hier' }
  ];
}
