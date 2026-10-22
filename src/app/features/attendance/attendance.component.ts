import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import { SessionTrackingStore } from './session-tracking.store';
import { AttendanceRequest } from '../../core/api/generated/model/attendanceRequest';
import { SOURATES_OPTIONS } from './sourate.data';

type AttendanceStatus = AttendanceRequest.StatusEnum;

@Component({
  selector: 'dm-attendance',
  standalone: true,
  imports: [FormsModule, ButtonModule, CardModule, SelectModule, TooltipModule],
  template: `
    <div class="page-enter space-y-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p class="text-sm font-medium text-[var(--brand-primary)]">École coranique</p>
          <h1 class="text-2xl font-bold text-slate-900">Suivi des séances</h1>
          <p class="mt-1 text-sm text-slate-500">Gérez les présences et la progression pédagogique des élèves.</p>
        </div>
      </div>

      @if (store.error()) {
        <div role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{{ store.error() }}</div>
      }
      @if (store.success()) {
        <div role="status" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{{ store.success() }}</div>
      }

      <p-card styleClass="border border-[var(--brand-border)] shadow-sm">
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label for="session-date" class="mb-2 block text-sm font-medium text-slate-700">Date de la séance</label>
            <input id="session-date" type="date"
              class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              [ngModel]="store.date()" (ngModelChange)="store.load($event, 0)"
              [disabled]="store.loading() || store.saving()" />
          </div>
          <div>
            <label for="student-search" class="mb-2 block text-sm font-medium text-slate-700">Rechercher un élève</label>
            <div class="flex gap-2">
              <input id="student-search" type="search" placeholder="Prénom ou nom..."
                class="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                [ngModel]="store.search()" (ngModelChange)="store.setSearch($event)"
                (keydown.enter)="store.searchNow()" [disabled]="store.loading() || store.saving()" />
              <p-button icon="pi pi-search" label="Rechercher" (onClick)="store.searchNow()"
                [disabled]="store.loading() || store.saving()" />
            </div>
          </div>
        </div>

        <div class="my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-xl bg-slate-50 p-4"><p class="text-sm text-slate-500">Élèves trouvés</p><p class="mt-1 text-2xl font-bold">{{ store.totalElements() }}</p></div>
          <div class="rounded-xl bg-emerald-50 p-4"><p class="text-sm text-emerald-700">Présents sur la page</p><p class="mt-1 text-2xl font-bold text-emerald-800">{{ store.presentCount() }}</p></div>
          <div class="rounded-xl bg-red-50 p-4"><p class="text-sm text-red-700">Absents sur la page</p><p class="mt-1 text-2xl font-bold text-red-800">{{ store.absentCount() }}</p></div>
          <div class="rounded-xl bg-amber-50 p-4"><p class="text-sm text-amber-700">À renseigner</p><p class="mt-1 text-2xl font-bold text-amber-800">{{ store.pendingCount() }}</p></div>
        </div>

        @if (store.loading()) {
          <div class="py-12 text-center text-slate-500"><i class="pi pi-spin pi-spinner mr-2"></i>Chargement de la séance...</div>
        } @else if (store.rows().length === 0) {
          <div class="py-12 text-center text-slate-500">Aucun élève trouvé.</div>
        } @else {
          <div class="space-y-5">
            @for (row of store.rows(); track row.student.id; let i = $index) {
              <section class="rounded-xl border border-slate-200 p-4 shadow-sm transition-colors sm:p-5" [class.bg-white]="i % 2 === 0" [class.bg-slate-50]="i % 2 === 1">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex min-w-0 items-center gap-3">
                    @if (store.photoUrls()[row.student.id!]) {
                      <img [src]="store.photoUrls()[row.student.id!]" [alt]="'Photo de ' + row.student.firstName + ' ' + row.student.lastName"
                        class="h-12 w-12 shrink-0 rounded-full object-cover" />
                    } @else {
                      <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 font-semibold text-[var(--brand-primary)]">
                        {{ initials(row.student.firstName, row.student.lastName) }}
                      </div>
                    }
                    <div class="min-w-0">
                      <h2 class="font-semibold text-slate-800">{{ row.student.firstName }} {{ row.student.lastName }}</h2>
                      <p class="mt-1 text-xs text-slate-500">{{ row.student.groupName || 'Sans groupe' }}</p>
                    </div>
                  </div>
                  <p-button
                    [label]="store.savingStudentId() === row.student.id ? 'En cours...' : 'Enregistrer'"
                    [icon]="store.savingStudentId() === row.student.id ? 'pi pi-spinner pi-spin' : 'pi pi-save'"
                    size="small"
                    severity="success"
                    [outlined]="!store.hasChanges(row.student.id!)"
                    [loading]="store.savingStudentId() === row.student.id"
                    [disabled]="store.saving() || !store.hasChanges(row.student.id!) || row.status === null"
                    (onClick)="store.saveStudent(row.student.id!)" />
                </div>

                <div class="mt-4">
                  <button type="button" class="flex w-full items-center justify-between rounded-lg border border-sky-100 bg-sky-50 px-3 py-3 text-left font-semibold text-slate-800"
                    [attr.aria-expanded]="attendanceExpanded(row.student.id!)"
                    (click)="toggleAttendance(row.student.id!)">
                    <span><i class="pi pi-calendar-check mr-2"></i>Présence</span>
                    <i [class]="attendanceExpanded(row.student.id!) ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
                  </button>
                  @if (attendanceExpanded(row.student.id!)) {
                    <div class="pt-4">
                      <div class="grid grid-cols-2 gap-2 sm:max-w-sm">
                        <button type="button" class="rounded-lg border px-3 py-2.5 text-sm font-medium"
                          [class.border-emerald-500]="row.status === 'PRESENT'" [class.bg-emerald-50]="row.status === 'PRESENT'"
                          [class.text-emerald-800]="row.status === 'PRESENT'" [class.border-slate-200]="row.status !== 'PRESENT'"
                          [disabled]="row.attendanceSaved || store.saving()" [attr.aria-pressed]="row.status === 'PRESENT'"
                          (click)="store.setStatus(row.student.id!, 'PRESENT')"><i class="pi pi-check-circle mr-1"></i>Présent</button>
                        <button type="button" class="rounded-lg border px-3 py-2.5 text-sm font-medium"
                          [class.border-red-500]="row.status === 'ABSENT'" [class.bg-red-50]="row.status === 'ABSENT'"
                          [class.text-red-800]="row.status === 'ABSENT'" [class.border-slate-200]="row.status !== 'ABSENT'"
                          [disabled]="row.attendanceSaved || store.saving()" [attr.aria-pressed]="row.status === 'ABSENT'"
                          (click)="store.setStatus(row.student.id!, 'ABSENT')"><i class="pi pi-times-circle mr-1"></i>Absent</button>
                      </div>
                      @if (row.attendanceSaved) {
                        <p class="mt-2 text-xs text-slate-500">La présence est déjà enregistrée et n'est pas modifiable depuis cette page.</p>
                      }
                      <label [for]="'attendance-note-' + row.student.id" class="mb-1 mt-4 block text-sm font-medium text-slate-700">Commentaire sur la présence</label>
                      <input [id]="'attendance-note-' + row.student.id" type="text"
                        class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                        [ngModel]="row.attendanceNote" (ngModelChange)="store.setAttendanceNote(row.student.id!, $event)"
                        [disabled]="row.attendanceSaved || store.saving()" placeholder="Commentaire facultatif..." />
                    </div>
                  }
                </div>

                @if (row.status === 'PRESENT') {
                  <div class="mt-5 border-t border-slate-200 pt-4">
                    <button type="button" class="flex w-full items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3 text-left font-semibold text-slate-800"
                      [attr.aria-expanded]="trackingExpanded(row.student.id!)"
                      (click)="toggleTracking(row.student.id!)">
                      <span><i class="pi pi-book mr-2"></i>Suivi pédagogique
                        @if (row.trackingSaved) { <span class="ml-2 text-xs font-normal text-emerald-700">Enregistré</span> }
                        @else { <span class="ml-2 text-xs font-normal text-amber-700">À renseigner</span> }
                      </span>
                      <i [class]="trackingExpanded(row.student.id!) ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
                    </button>
                    @if (trackingExpanded(row.student.id!)) {
                      <div class="grid gap-4 pt-4 md:grid-cols-2">
                        <div>
                          <label [for]="'surah-' + row.student.id" class="mb-1 block text-sm font-medium text-slate-700">Sourate en cours</label>
                          <p-select [inputId]="'surah-' + row.student.id" [options]="surahOptions" optionLabel="label" optionValue="value"
                            [filter]="true" filterBy="label" [showClear]="true" placeholder="Rechercher une sourate..."
                            [ngModel]="row.surah || null" (ngModelChange)="store.setPedagogicalField(row.student.id!, 'surah', $event ?? '')"
                            [disabled]="store.saving()" class="w-full" />
                        </div>
                        <div>
                          <label [for]="'completed-' + row.student.id" class="mb-1 block text-sm font-medium text-slate-700">Travail réalisé aujourd'hui</label>
                          <textarea [id]="'completed-' + row.student.id" rows="2" class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                            [ngModel]="row.completedToday" (ngModelChange)="store.setPedagogicalField(row.student.id!, 'completedToday', $event)"
                            [disabled]="store.saving()" placeholder="Leçon apprise, versets récités..."></textarea>
                        </div>
                        <div>
                          <label [for]="'prepare-' + row.student.id" class="mb-1 block text-sm font-medium text-slate-700">À préparer pour la prochaine séance</label>
                          <textarea [id]="'prepare-' + row.student.id" rows="2" class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                            [ngModel]="row.toPrepare" (ngModelChange)="store.setPedagogicalField(row.student.id!, 'toPrepare', $event)"
                            [disabled]="store.saving()" placeholder="Leçon à réviser, prochains versets..."></textarea>
                        </div>
                        <div>
                          <label [for]="'observations-' + row.student.id" class="mb-1 block text-sm font-medium text-slate-700">Observations pédagogiques</label>
                          <textarea [id]="'observations-' + row.student.id" rows="2" class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                            [ngModel]="row.observations" (ngModelChange)="store.setPedagogicalField(row.student.id!, 'observations', $event)"
                            [disabled]="store.saving()" placeholder="Difficultés, progrès, remarques..."></textarea>
                        </div>
                      </div>
                    }
                  </div>
                }
              </section>
            }
          </div>

          <div class="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row">
            <p class="text-sm text-slate-500">
              Élèves {{ store.firstItem() }}–{{ store.lastItem() }} sur {{ store.totalElements() }}
              · Page {{ store.totalPages() === 0 ? 0 : store.page() + 1 }} / {{ store.totalPages() }}
            </p>
            <div class="flex gap-2">
              <p-button label="Précédent" icon="pi pi-chevron-left" severity="secondary"
                [disabled]="!store.canGoPrevious() || store.loading() || store.saving()"
                (onClick)="store.goToPage(store.page() - 1)" />
              <p-button label="Suivant" icon="pi pi-chevron-right" iconPos="right" severity="secondary"
                [disabled]="!store.canGoNext() || store.loading() || store.saving()"
                (onClick)="store.goToPage(store.page() + 1)" />
            </div>
          </div>
        }
      </p-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendanceComponent {
  readonly store = inject(SessionTrackingStore);
  readonly surahOptions = SOURATES_OPTIONS;

  private readonly attendancePanels = signal<Record<number, boolean>>({});
  private readonly trackingPanels = signal<Record<number, boolean>>({});

  constructor() {
    void this.store.load();
  }

  // Initiales utilisées si la photo n'existe pas ou si son chargement échoue.
  initials(firstName?: string | null, lastName?: string | null): string {
    const first = firstName?.trim().charAt(0) ?? '';
    const last = lastName?.trim().charAt(0) ?? '';
    return (first + last).toLocaleUpperCase('fr') || '?';
  }

  attendanceExpanded(id: number): boolean {
    return this.attendancePanels()[id] ?? true;
  }

  trackingExpanded(id: number): boolean {
    return this.trackingPanels()[id] ?? true;
  }

  toggleAttendance(id: number): void {
    this.attendancePanels.update(current => ({ ...current, [id]: !(current[id] ?? true) }));
  }

  toggleTracking(id: number): void {
    this.trackingPanels.update(current => ({ ...current, [id]: !(current[id] ?? true) }));
  }

  statusLabel(status: AttendanceStatus | null): string {
    switch (status) {
      case 'PRESENT': return 'Présent';
      case 'ABSENT': return 'Absent';
      case 'LATE': return 'En retard';
      case 'JUSTIFIED_ABSENCE': return 'Absence justifiée';
      default: return 'À renseigner';
    }
  }
}
