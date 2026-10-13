import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'dm-activities',
  standalone: true,
  imports: [ButtonModule, CardModule, TagModule],
  template: `
    <div class="page-enter space-y-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p class="text-sm font-medium text-[var(--brand-primary)]">Dahira</p><h1 class="text-2xl font-bold text-slate-900">Activités</h1><p class="mt-1 text-sm text-slate-500">Planifiez et suivez les activités du Dahira.</p></div><p-button label="Nouvelle activité" icon="pi pi-plus" (onClick)="dialog.set(true)" /></div>

      <div class="grid gap-4 sm:grid-cols-3"><p-card styleClass="border border-[var(--brand-border)] shadow-sm"><p class="text-sm text-slate-500">Ce mois</p><p class="mt-1 text-2xl font-bold">8</p></p-card><p-card styleClass="border border-[var(--brand-border)] shadow-sm"><p class="text-sm text-slate-500">À venir</p><p class="mt-1 text-2xl font-bold text-[var(--brand-primary)]">3</p></p-card><p-card styleClass="border border-[var(--brand-border)] shadow-sm"><p class="text-sm text-slate-500">Organisateurs</p><p class="mt-1 text-2xl font-bold">5</p></p-card></div>

      <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <p-card styleClass="border border-[var(--brand-border)] shadow-sm"><ng-template #title><span class="text-base font-semibold">Calendrier à venir</span></ng-template><div class="space-y-3 pt-2">
          @for (activity of upcoming; track activity.title) {
            <div class="flex gap-4 rounded-2xl border border-slate-100 p-4 hover:bg-slate-50"><div class="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--brand-bg)] text-[var(--brand-primary)]"><span class="text-[10px] font-bold uppercase">{{ activity.month }}</span><span class="text-lg font-bold">{{ activity.day }}</span></div><div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2"><h3 class="font-semibold text-slate-800">{{ activity.title }}</h3><p-tag [value]="activity.type" severity="info" /></div><p class="mt-1 text-sm text-slate-500">{{ activity.description }}</p><div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400"><span><i class="pi pi-clock mr-1"></i>{{ activity.time }}</span><span><i class="pi pi-map-marker mr-1"></i>{{ activity.place }}</span></div></div></div>
          }
        </div></p-card>
        <p-card styleClass="border border-[var(--brand-border)] shadow-sm"><ng-template #title><span class="text-base font-semibold">Répartition</span></ng-template><div class="space-y-5 pt-4">
          @for (item of distribution; track item.label) {<div><div class="mb-2 flex justify-between text-sm"><span class="font-medium text-slate-700">{{ item.label }}</span><span class="text-slate-500">{{ item.value }}%</span></div><div class="h-2 rounded-full bg-slate-100"><div class="h-2 rounded-full bg-[var(--brand-primary)]" [style.width.%]="item.value"></div></div></div>}
        </div><div class="mt-8 rounded-2xl bg-[var(--brand-bg)] p-4"><div class="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">Conseil</div><p class="mt-2 text-sm leading-6 text-slate-600">Associez chaque activité à une commission pour simplifier le suivi des responsables et des comptes rendus.</p></div></p-card>
      </div>

      @if (dialog()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4" (click)="dialog.set(false)">
          <div class="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" (click)="$event.stopPropagation()"><div class="flex items-center justify-between"><div><h2 class="text-lg font-bold text-slate-900">Nouvelle activité</h2><p class="mt-1 text-sm text-slate-500">Prototype frontend.</p></div><button class="text-slate-400 hover:text-slate-700" (click)="dialog.set(false)"><i class="pi pi-times"></i></button></div><div class="mt-6 rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-bg)] p-5 text-sm text-slate-600">Le formulaire complet sera branché au backend après validation de cette architecture.</div><div class="mt-6 flex justify-end"><p-button label="Fermer" (onClick)="dialog.set(false)" /></div></div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivitiesComponent {
  readonly dialog = signal(false);
  readonly upcoming = [
    { month: 'OCT', day: '11', title: 'Réunion commission éducation', type: 'Réunion', description: 'Point sur les classes, les absences et le calendrier des activités enfants.', time: '18h00', place: 'Salle du Dahira' },
    { month: 'OCT', day: '18', title: 'Journée des enfants', type: 'Événement', description: 'Conférences, récitation du Coran et activités pédagogiques.', time: '15h00', place: 'École coranique' },
    { month: 'OCT', day: '25', title: 'Assemblée du Dahira', type: 'Assemblée', description: 'Bilan des activités et échanges avec les membres.', time: '17h00', place: 'Salle principale' },
    { month: 'NOV', day: '01', title: 'Vente solidaire', type: 'Boutique', description: 'Stand boutique après les activités du dimanche.', time: '16h30', place: 'Hall du Dahira' }
  ];
  readonly distribution = [
    { label: 'Éducation', value: 55 },
    { label: 'Vie du Dahira', value: 20 },
    { label: 'Boutique', value: 15 },
    { label: 'Communication', value: 10 }
  ];
}
