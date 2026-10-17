import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { StudentStore } from './student.store';

@Component({
  selector: 'dm-student-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, CardModule, TagModule, ButtonModule, TabsModule],
  template: `
    <div class="page-enter space-y-6">
      <a routerLink="/students" class="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[var(--brand-primary)]">
        <i class="pi pi-arrow-left"></i>
        Retour aux élèves
      </a>

      @if (store.detailsLoading()) {
        <p-card>
          <div class="py-10 text-center text-slate-500">
            <i class="pi pi-spin pi-spinner mr-2"></i>Chargement de la fiche élève…
          </div>
        </p-card>
      } @else if (student(); as currentStudent) {
        <section class="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-white shadow-sm">
          <div class="h-2 bg-[var(--brand-primary)]"></div>
          <div class="p-5 sm:p-7">
            <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div class="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl font-bold text-[var(--brand-primary)] ring-1 ring-emerald-100">
                {{ currentStudent.firstName?.charAt(0) }}{{ currentStudent.lastName?.charAt(0) }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-[var(--brand-primary)]">École coranique · Dossier élève</p>
                <h1 class="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{{ currentStudent.firstName }} {{ currentStudent.lastName }}</h1>
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <p-tag [value]="currentStudent.active ? 'Actif' : 'Inactif'" [severity]="currentStudent.active ? 'success' : 'secondary'" />
                  <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
                    [style.background-color]="(currentStudent.groupColor || '#2563EB') + '20'"
                    [style.color]="currentStudent.groupColor || '#2563EB'">
                    <span class="size-2 rounded-full" [style.background-color]="currentStudent.groupColor || '#2563EB'"></span>
                    {{ currentStudent.groupName || 'Sans classe' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

      <p-tabs
  [value]="activeTab()"
  (valueChange)="activeTab.set($event?.toString() ?? 'informations')"
>
          <p-tablist>
            <p-tab value="informations"><i class="pi pi-user mr-2"></i>Informations</p-tab>
            <p-tab value="presences"><i class="pi pi-calendar mr-2"></i>Présences</p-tab>
            <p-tab value="pedagogie"><i class="pi pi-book mr-2"></i>Pédagogie</p-tab>
            <p-tab value="paiements"><i class="pi pi-wallet mr-2"></i>Paiements</p-tab>
          </p-tablist>

          <p-tabpanels>
            <p-tabpanel value="informations">
              <div class="grid gap-3 pt-2 sm:grid-cols-2 xl:grid-cols-3">
                <article class="rounded-xl border border-slate-100 bg-white p-4">
                  <div class="text-xs font-medium uppercase tracking-wide text-slate-400">Prénom</div>
                  <div class="mt-2 font-medium text-slate-800">{{ currentStudent.firstName }}</div>
                </article>
                <article class="rounded-xl border border-slate-100 bg-white p-4">
                  <div class="text-xs font-medium uppercase tracking-wide text-slate-400">Nom</div>
                  <div class="mt-2 font-medium text-slate-800">{{ currentStudent.lastName }}</div>
                </article>
                <article class="rounded-xl border border-slate-100 bg-white p-4">
                  <div class="text-xs font-medium uppercase tracking-wide text-slate-400">Date de naissance</div>
                  <div class="mt-2 flex items-center gap-2 font-medium text-slate-800"><i class="pi pi-calendar text-slate-400"></i>{{ currentStudent.birthDate ? (currentStudent.birthDate | date:'dd/MM/yyyy') : 'Non renseignée' }}</div>
                </article>
                <article class="rounded-xl border border-slate-100 bg-white p-4">
                  <div class="text-xs font-medium uppercase tracking-wide text-slate-400">Téléphone de l’élève</div>
                  <div class="mt-2 flex items-center gap-2 font-medium text-slate-800"><i class="pi pi-phone text-slate-400"></i>{{ currentStudent.phone || 'Non renseigné' }}</div>
                </article>
                <article class="rounded-xl border border-slate-100 bg-white p-4">
                  <div class="text-xs font-medium uppercase tracking-wide text-slate-400">Parent / responsable</div>
                  <div class="mt-2 flex items-center gap-2 font-medium text-slate-800"><i class="pi pi-user text-slate-400"></i>{{ currentStudent.parentName || 'Non renseigné' }}</div>
                </article>
                <article class="rounded-xl border border-slate-100 bg-white p-4">
                  <div class="text-xs font-medium uppercase tracking-wide text-slate-400">Téléphone du responsable</div>
                  <div class="mt-2 flex items-center gap-2 font-medium text-slate-800"><i class="pi pi-phone text-slate-400"></i>{{ currentStudent.parentPhone || 'Non renseigné' }}</div>
                </article>
                <article class="rounded-xl border border-slate-100 bg-white p-4">
                  <div class="text-xs font-medium uppercase tracking-wide text-slate-400">Identifiant du dossier</div>
                  <div class="mt-2 font-medium text-slate-800">{{ currentStudent.id }}</div>
                </article>
              </div>
            </p-tabpanel>

            <p-tabpanel value="presences">
              <div class="space-y-4 pt-2">
                @if (!trackingLoading() && !trackingError()) {
                  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <article class="rounded-xl border border-slate-200 bg-white p-4">
                      <div class="flex items-center justify-between gap-3">
                        <span class="text-sm text-slate-500">Séances enregistrées</span>
                        <span class="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><i class="pi pi-calendar"></i></span>
                      </div>
                      <p class="mt-3 text-2xl font-bold text-slate-900">{{ attendanceSummary().total }}</p>
                    </article>
                    <article class="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                      <div class="flex items-center justify-between gap-3">
                        <span class="text-sm text-emerald-800">Présences</span>
                        <span class="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700"><i class="pi pi-check-circle"></i></span>
                      </div>
                      <p class="mt-3 text-2xl font-bold text-emerald-800">{{ attendanceSummary().present }}</p>
                    </article>
                    <article class="rounded-xl border border-red-100 bg-red-50/60 p-4">
                      <div class="flex items-center justify-between gap-3">
                        <span class="text-sm text-red-800">Absences</span>
                        <span class="flex size-9 items-center justify-center rounded-lg bg-red-100 text-red-700"><i class="pi pi-times-circle"></i></span>
                      </div>
                      <p class="mt-3 text-2xl font-bold text-red-800">{{ attendanceSummary().absent }}</p>
                    </article>
                    <article class="rounded-xl border border-[var(--brand-border)] bg-white p-4">
                      <div class="flex items-center justify-between gap-3">
                        <span class="text-sm text-slate-500">Taux de présence</span>
                        <span class="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-[var(--brand-primary)]"><i class="pi pi-chart-line"></i></span>
                      </div>
                      <p class="mt-3 text-2xl font-bold text-slate-900">{{ attendanceSummary().rate }}%</p>
                      <p class="mt-1 text-xs text-slate-500">Présences et retards / séances enregistrées</p>
                    </article>
                  </div>
                }

                @if (trackingLoading()) {
                  <div class="py-8 text-center text-slate-500"><i class="pi pi-spin pi-spinner mr-2"></i>Chargement de l’historique…</div>
                } @else if (trackingError()) {
                  <div class="rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">
                    {{ trackingError() }}
                    <button type="button" class="ml-2 font-semibold underline" (click)="retryHistory()">Réessayer</button>
                  </div>
                } @else if (store.trackingHistory()?.length === 0) {
                  <div class="rounded-xl bg-slate-50 px-4 py-10 text-center">
                    <i class="pi pi-calendar text-2xl text-slate-400"></i>
                    <p class="mt-2 font-medium text-slate-700">Aucune présence enregistrée</p>
                    <p class="mt-1 text-sm text-slate-500">Les présences de l’élève apparaîtront ici.</p>
                  </div>
                } @else {
                  @for (item of store.trackingHistory(); track item.date) {
                    <article class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                      <div class="flex items-center gap-3">
                        <div class="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-[var(--brand-primary)]"><i class="pi pi-calendar"></i></div>
                        <div>
                          <p class="font-semibold text-slate-800">{{ item.date ? (item.date | date:'dd/MM/yyyy') : 'Date inconnue' }}</p>
                          @if (item.attendance?.comment) { <p class="mt-1 text-sm text-slate-500">{{ item.attendance?.comment }}</p> }
                        </div>
                      </div>
                      @if (item.attendance; as attendance) {
                        <p-tag [value]="attendance.status === 'PRESENT' ? 'Présent' : attendance.status === 'ABSENT' ? 'Absent' : (attendance.status ?? 'Inconnu')"
                          [severity]="attendance.status === 'PRESENT' ? 'success' : attendance.status === 'ABSENT' ? 'danger' : 'secondary'" />
                      } @else {
                        <p-tag value="Non enregistrée" severity="secondary" />
                      }
                    </article>
                  }
                }
              </div>
            </p-tabpanel>

            <p-tabpanel value="pedagogie">
              <div class="space-y-3 pt-2">
                @if (trackingLoading()) {
                  <div class="py-8 text-center text-slate-500"><i class="pi pi-spin pi-spinner mr-2"></i>Chargement du suivi pédagogique…</div>
                } @else if (trackingError()) {
                  <div class="rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">{{ trackingError() }} <button type="button" class="ml-2 font-semibold underline" (click)="retryHistory()">Réessayer</button></div>
                } @else if (pedagogicalEntries().length === 0) {
                  <div class="rounded-xl bg-slate-50 px-4 py-10 text-center">
                    <i class="pi pi-book text-2xl text-slate-400"></i>
                    <p class="mt-2 font-medium text-slate-700">Aucun suivi pédagogique</p>
                    <p class="mt-1 text-sm text-slate-500">La progression et les observations apparaîtront ici.</p>
                  </div>
                } @else {
                  @for (item of pedagogicalEntries(); track item.date) {
                    <article class="rounded-xl border border-slate-200 p-4">
                      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-2"><i class="pi pi-calendar text-[var(--brand-primary)]"></i><span class="font-semibold text-slate-800">{{ item.date ? (item.date | date:'dd/MM/yyyy') : 'Date inconnue' }}</span></div>
                        @if (item.pedagogicalTracking?.surah) { <p-tag [value]="item.pedagogicalTracking!.surah!" severity="success" /> }
                      </div>
                      <div class="grid gap-4 sm:grid-cols-2">
                        @if (item.pedagogicalTracking?.completedToday) {
                          <div><p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Travail réalisé</p><p class="mt-1 whitespace-pre-line text-sm text-slate-700">{{ item.pedagogicalTracking?.completedToday }}</p></div>
                        }
                        @if (item.pedagogicalTracking?.toPrepare) {
                          <div><p class="text-xs font-semibold uppercase tracking-wide text-slate-400">À préparer</p><p class="mt-1 whitespace-pre-line text-sm text-slate-700">{{ item.pedagogicalTracking?.toPrepare }}</p></div>
                        }
                      </div>
                      @if (item.pedagogicalTracking?.observations) {
                        <div class="mt-4 border-t border-slate-100 pt-3"><p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Observations</p><p class="mt-1 whitespace-pre-line text-sm text-slate-700">{{ item.pedagogicalTracking?.observations }}</p></div>
                      }
                    </article>
                  }
                }
              </div>
            </p-tabpanel>

            <p-tabpanel value="paiements">
              <div class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                <div class="mx-auto flex size-12 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm"><i class="pi pi-wallet text-xl"></i></div>
                <h2 class="mt-3 font-semibold text-slate-800">Paiements de l’élève</h2>
                <p class="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">Cette section sera reliée à l’historique des cotisations et règlements lorsque le service de paiement par élève sera identifié.</p>
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
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
  readonly trackingLoading = this.store.trackingLoading;
  readonly trackingError = this.store.trackingError;
  readonly activeTab = signal('informations');
  readonly pedagogicalEntries = computed(() =>
    (this.store.trackingHistory() ?? []).filter(item => item.pedagogicalTracking != null)
  );
  readonly attendanceSummary = computed(() => {
    // Only count sessions with an explicitly recorded attendance status.
    const records = (this.store.trackingHistory() ?? []).filter(
      item => item.attendance?.status != null
    );
    const present = records.filter(item =>
      item.attendance?.status === 'PRESENT' || item.attendance?.status === 'LATE'
    ).length;
    const absent = records.filter(item =>
      item.attendance?.status === 'ABSENT' || item.attendance?.status === 'JUSTIFIED_ABSENCE'
    ).length;

    return {
      total: records.length,
      present,
      absent,
      rate: records.length === 0 ? 0 : Math.round((present / records.length) * 100)
    };
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = Number(params.get('id'));
        if (Number.isInteger(id) && id > 0) {
          void this.store.loadStudent(id);
          void this.store.loadTrackingHistory(id);
        }
      });
  }

  retryHistory(): void {
    const studentId = this.student()?.id;
    if (studentId != null) {
      void this.store.loadTrackingHistory(studentId);
    }
  }
}
