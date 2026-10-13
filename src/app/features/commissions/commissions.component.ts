import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'dm-commissions',
  standalone: true,
  imports: [ButtonModule, CardModule, TagModule],
  template: `
    <div class="page-enter space-y-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p class="text-sm font-medium text-[var(--brand-primary)]">Dahira</p><h1 class="text-2xl font-bold text-slate-900">Commissions</h1><p class="mt-1 text-sm text-slate-500">Organisez les équipes responsables des différentes activités.</p></div><p-button label="Nouvelle commission" icon="pi pi-plus" (onClick)="showForm.set(!showForm())" /></div>
      @if (showForm()) {<p-card styleClass="border border-[var(--brand-border)] shadow-sm"><div class="rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-bg)] p-5 text-sm text-slate-600">Création de commission : nom, responsable, membres, missions et fréquence de réunion.</div></p-card>}
      <div class="grid gap-4 sm:grid-cols-3"><p-card styleClass="border border-[var(--brand-border)] shadow-sm"><p class="text-sm text-slate-500">Commissions actives</p><p class="mt-1 text-2xl font-bold">5</p></p-card><p-card styleClass="border border-[var(--brand-border)] shadow-sm"><p class="text-sm text-slate-500">Responsables</p><p class="mt-1 text-2xl font-bold">5</p></p-card><p-card styleClass="border border-[var(--brand-border)] shadow-sm"><p class="text-sm text-slate-500">Missions en cours</p><p class="mt-1 text-2xl font-bold text-[var(--brand-primary)]">12</p></p-card></div>
      <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        @for (commission of commissions; track commission.name) {
          <p-card styleClass="border border-[var(--brand-border)] shadow-sm h-full"><div class="flex items-start justify-between gap-3"><div class="flex size-11 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"><i [class]="commission.icon"></i></div><p-tag [value]="commission.status" severity="success" /></div><h2 class="mt-4 font-semibold text-slate-800">{{ commission.name }}</h2><p class="mt-1 text-sm leading-6 text-slate-500">{{ commission.description }}</p><div class="mt-5 grid grid-cols-2 gap-3 text-sm"><div class="rounded-xl bg-slate-50 p-3"><div class="text-xs text-slate-400">Responsable</div><div class="mt-1 font-semibold text-slate-700">{{ commission.owner }}</div></div><div class="rounded-xl bg-slate-50 p-3"><div class="text-xs text-slate-400">Membres</div><div class="mt-1 font-semibold text-slate-700">{{ commission.members }}</div></div></div><div class="mt-4 flex items-center justify-between text-xs text-slate-400"><span>Prochaine réunion</span><span class="font-semibold text-slate-600">{{ commission.nextMeeting }}</span></div></p-card>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommissionsComponent {
  readonly showForm = signal(false);
  readonly commissions = [
    { name: 'Éducation', icon: 'pi pi-book', status: 'Active', description: 'Pilotage de l’école coranique et des actions en faveur des enfants.', owner: 'Mamadou Ndiaye', members: 8, nextMeeting: '11 oct. · 18h' },
    { name: 'Boutique', icon: 'pi pi-shopping-bag', status: 'Active', description: 'Gestion des produits, du stock, des ventes et des approvisionnements.', owner: 'Cheikh Mbaye', members: 5, nextMeeting: '09 oct. · 20h' },
    { name: 'Communication', icon: 'pi pi-megaphone', status: 'Active', description: 'Informations aux membres, annonces et communication événementielle.', owner: 'Abdoulaye Fall', members: 6, nextMeeting: '15 oct. · 19h' },
    { name: 'Femmes', icon: 'pi pi-heart', status: 'Active', description: 'Coordination des activités et initiatives portées par les femmes.', owner: 'Aminata Seck', members: 12, nextMeeting: '12 oct. · 17h' },
    { name: 'Finances', icon: 'pi pi-chart-line', status: 'Active', description: 'Suivi des cotisations, dépenses et reporting financier.', owner: 'Ibrahima Kane', members: 4, nextMeeting: '17 oct. · 18h' },
    { name: 'Jeunesse', icon: 'pi pi-star', status: 'Active', description: 'Activités jeunesse, accompagnement des enfants et événements dédiés.', owner: 'Saliou Ba', members: 7, nextMeeting: '19 oct. · 18h' }
  ];
}
