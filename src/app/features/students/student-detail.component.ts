import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { StudentStore } from './student.store';

@Component({
  selector: 'dm-student-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, CardModule, TagModule, ButtonModule],
  template: `
    <div class="page-enter space-y-6">
      <a routerLink="/students" class="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[var(--brand-primary)]"><i class="pi pi-arrow-left"></i>Retour aux élèves</a>

      @if (store.detailsLoading()) {
        <p-card><div class="py-10 text-center text-slate-500"><i class="pi pi-spin pi-spinner mr-2"></i>Chargement de la fiche élève…</div></p-card>
      } @else if (student(); as currentStudent) {
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p class="text-sm font-medium text-[var(--brand-primary)]">École coranique</p>
            <h1 class="text-2xl font-bold text-slate-900">{{ currentStudent.firstName }} {{ currentStudent.lastName }}</h1>
            <p class="mt-1 text-sm text-slate-500">{{ currentStudent.groupName || 'Sans groupe' }}</p>
          </div>
          <p-tag [value]="currentStudent.active ? 'Actif' : 'Inactif'" [severity]="currentStudent.active ? 'success' : 'secondary'" />
        </div>

        <p-card styleClass="border border-[var(--brand-border)] shadow-sm">
          <div class="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div class="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-emerald-50 text-2xl font-bold text-[var(--brand-primary)]">{{ currentStudent.firstName.charAt(0) }}{{ currentStudent.lastName.charAt(0) }}</div>
            <div class="grid flex-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div><div class="text-xs uppercase tracking-wide text-slate-400">Prénom</div><div class="mt-1 font-medium">{{ currentStudent.firstName }}</div></div>
              <div><div class="text-xs uppercase tracking-wide text-slate-400">Nom</div><div class="mt-1 font-medium">{{ currentStudent.lastName }}</div></div>
              <div><div class="text-xs uppercase tracking-wide text-slate-400">Date de naissance</div><div class="mt-1 font-medium">{{ currentStudent.birthDate ? (currentStudent.birthDate | date:'dd/MM/yyyy') : '—' }}</div></div>
              <div><div class="text-xs uppercase tracking-wide text-slate-400">Téléphone élève</div><div class="mt-1 font-medium">{{ currentStudent.phone || '—' }}</div></div>
              <div><div class="text-xs uppercase tracking-wide text-slate-400">Parent / responsable</div><div class="mt-1 font-medium">{{ currentStudent.parentName || '—' }}</div></div>
              <div><div class="text-xs uppercase tracking-wide text-slate-400">Téléphone du responsable</div><div class="mt-1 font-medium">{{ currentStudent.parentPhone || '—' }}</div></div>
              <div><div class="text-xs uppercase tracking-wide text-slate-400">Groupe</div><div class="mt-1 font-medium">{{ currentStudent.groupName || 'Sans groupe' }}</div></div>
              <div><div class="text-xs uppercase tracking-wide text-slate-400">Identifiant</div><div class="mt-1 font-medium">{{ currentStudent.id }}</div></div>
            </div>
          </div>
        </p-card>

        <p-card styleClass="border border-[var(--brand-border)] shadow-sm">
          <div class="flex items-start gap-3">
            <i class="pi pi-info-circle mt-1 text-[var(--brand-primary)]"></i>
            <div>
              <h2 class="font-semibold text-slate-900">Suivi pédagogique et présences</h2>
              <p class="mt-1 text-sm leading-6 text-slate-500">La fiche élève est chargée depuis le backend. Le suivi pédagogique et l’historique des présences seront raccordés à leurs API dans une prochaine étape.</p>
            </div>
          </div>
        </p-card>
      } @else {
        <p-card>
          <div class="py-8 text-center">
            <i class="pi pi-exclamation-circle text-3xl text-amber-500"></i>
            <p class="mt-3 font-medium text-slate-800">Fiche élève indisponible</p>
            <p class="mt-1 text-sm text-slate-500">{{ store.error() || 'Cet élève n’existe pas ou vous ne pouvez pas consulter sa fiche.' }}</p>
            <p-button label="Retour à la liste" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" routerLink="/students" styleClass="mt-4" />
          </div>
        </p-card>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly store = inject(StudentStore);
  readonly student = computed(() => this.store.selectedStudent());

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = Number(params.get('id'));
      if (Number.isInteger(id) && id > 0) void this.store.loadStudent(id);
    });
  }
}
