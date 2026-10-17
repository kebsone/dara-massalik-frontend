import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';

interface TrackingRow {
  student: string;
  group: string;
  surah: string;
  today: string;
  next: string;
  teacher: string;
  note: string;
}

@Component({
  selector: 'dm-pedagogical-tracking',
  standalone: true,
  imports: [FormsModule, ButtonModule, CardModule, DialogModule, InputTextModule, SelectModule, TableModule],
  template: `
    <div class="page-enter space-y-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h1 class="text-2xl font-bold text-slate-900">Suivi pédagogique</h1><p class="mt-1 text-sm text-slate-500">Suivez ce que chaque enfant a appris et ce qu’il doit préparer pour la semaine suivante.</p></div>
        <p-button label="Ajouter un suivi" icon="pi pi-plus" (onClick)="showDialog.set(true)" />
      </div>

      <p-card styleClass="border border-[var(--brand-border)] shadow-sm">
        <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-[var(--brand-primary)]"><i class="pi pi-calendar"></i> Dimanche 27 septembre 2026</div>
          <p-select [options]="groups" [(ngModel)]="selectedGroup" styleClass="w-full sm:w-48" />
        </div>
        <p-table [value]="rows" [paginator]="true" [rows]="10" responsiveLayout="scroll" styleClass="text-sm">
          <ng-template #header><tr><th>Élève</th><th>Sourate</th><th>Aujourd’hui</th><th>À préparer</th><th>Enseignant</th><th>Observation</th></tr></ng-template>
          <ng-template #body let-row><tr><td><div class="font-semibold text-slate-700">{{ row.student }}</div><div class="text-xs text-slate-400">{{ row.group }}</div></td><td>{{ row.surah }}</td><td>{{ row.today }}</td><td>{{ row.next }}</td><td>{{ row.teacher }}</td><td>{{ row.note }}</td></tr></ng-template>
        </p-table>
      </p-card>

      <p-dialog header="Ajouter un suivi pédagogique" [(visible)]="showDialog" [modal]="true" [style]="{ width: 'min(40rem, 95vw)' }">
        <div class="grid gap-4 pt-2 sm:grid-cols-2">
          <div><label class="mb-2 block text-sm font-medium">Élève</label><p-select [options]="students" placeholder="Sélectionner un élève" styleClass="w-full" /></div>
          <div><label class="mb-2 block text-sm font-medium">Surah</label><p-select [options]="surahs" placeholder="Sélectionner une sourate" styleClass="w-full" /></div>
          <div><label class="mb-2 block text-sm font-medium">Travail réalisé aujourd’hui ?</label><input pInputText class="w-full" placeholder="Ex. versets 10–15" /></div>
          <div><label class="mb-2 block text-sm font-medium">À préparer</label><input pInputText class="w-full" placeholder="Ex. versets 16–20" /></div>
          <div class="sm:col-span-2"><label class="mb-2 block text-sm font-medium">Observation</label><input pInputText class="w-full" placeholder="Observation facultative" /></div>
        </div>
        <div class="mt-6 flex justify-end gap-2"><p-button label="Annuler" severity="secondary" text (onClick)="showDialog.set(false)" /><p-button label="Enregistrer le suivi" icon="pi pi-check" (onClick)="showDialog.set(false)" /></div>
      </p-dialog>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PedagogicalTrackingComponent {
  readonly showDialog = signal(false);
  readonly groups = ['Tous les groupes', 'Groupe 1', 'Groupe 2', 'Groupe 3'];
  selectedGroup = 'Tous les groupes';
  readonly students = ['Amadou Diallo', 'Aïssatou Diop', 'Moussa Ndiaye', 'Fatou Kane', 'Ibrahima Sy', 'Mariama Ba'];
  readonly surahs = ['Al-Fatiha', 'Al-Baqarah', 'Al-Imran', 'An-Nisa', 'Al-Mulk'];
  readonly rows: TrackingRow[] = [
    { student: 'Amadou Diallo', group: 'Group 1', surah: 'Al-Baqarah', today: 'Versets 10–15', next: 'Versets 16–20', teacher: 'Oumar Fall', note: 'Bonne progression' },
    { student: 'Aïssatou Diop', group: 'Group 2', surah: 'Al-Fajr', today: 'Révision', next: 'Versets 1–5', teacher: 'Sokhna Ndiaye', note: 'Doit prendre confiance' },
    { student: 'Moussa Ndiaye', group: 'Group 1', surah: 'Al-Baqarah', today: 'Versets 5–10', next: 'Versets 11–15', teacher: 'Oumar Fall', note: 'Réviser la leçon précédente' },
    { student: 'Fatou Kane', group: 'Group 3', surah: 'Al-Imran', today: 'Versets 1–5', next: 'Versets 6–10', teacher: 'Awa Sy', note: 'Très bien' }
  ];
}
