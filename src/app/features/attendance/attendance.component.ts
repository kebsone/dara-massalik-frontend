import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { SessionTrackingStore } from './session-tracking.store';
import { AttendanceRequest } from '../../core/api/generated/model/attendanceRequest';
import { SelectModule } from 'primeng/select';
import { SOURATES_OPTIONS } from './sourate.data';
import { TooltipModule } from 'primeng/tooltip';
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
          <p class="mt-1 text-sm text-slate-500">
            Gérez les présences et la progression pédagogique des élèves.
          </p>
        </div>

        <p-button
          label="Enregistrer la séance"
          icon="pi pi-check"
          [loading]="store.saving()"
          [disabled]="store.loading() || store.saving() ||
                      store.pendingCount() > 0 || store.rows().length === 0"
          (onClick)="store.save()"
        />
      </div>

      @if (store.error()) {
        <div role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {{ store.error() }}
        </div>
      }

      @if (store.success()) {
        <div role="status" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {{ store.success() }}
        </div>
      }

      <p-card styleClass="border border-[var(--brand-border)] shadow-sm">
        <div class="mb-6">
          <label for="session-date" class="mb-2 block text-sm font-medium text-slate-700">
            Date de la séance
          </label>
          <input
            id="session-date"
            type="date"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm sm:max-w-sm"
            [ngModel]="store.date()"
            (ngModelChange)="store.load($event)"
            [disabled]="store.loading() || store.saving()"
          />
        </div>

        <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-xl bg-slate-50 p-4">
            <p class="text-sm text-slate-500">Élèves actifs</p>
            <p class="mt-1 text-2xl font-bold">{{ store.rows().length }}</p>
          </div>
          <div class="rounded-xl bg-emerald-50 p-4">
            <p class="text-sm text-emerald-700">Présents</p>
            <p class="mt-1 text-2xl font-bold text-emerald-800">{{ store.presentCount() }}</p>
          </div>
          <div class="rounded-xl bg-red-50 p-4">
            <p class="text-sm text-red-700">Absents</p>
            <p class="mt-1 text-2xl font-bold text-red-800">{{ store.absentCount() }}</p>
          </div>
          <div class="rounded-xl bg-amber-50 p-4">
            <p class="text-sm text-amber-700">À renseigner</p>
            <p class="mt-1 text-2xl font-bold text-amber-800">{{ store.pendingCount() }}</p>
          </div>
        </div>

        @if (store.loading()) {
          <div class="py-12 text-center text-slate-500">
            <i class="pi pi-spin pi-spinner mr-2"></i>
            Chargement de la séance et des suivis pédagogiques...
          </div>
        } @else if (store.rows().length === 0) {
          <div class="py-12 text-center text-slate-500">Aucun élève actif trouvé.</div>
        } @else {
          <div class="space-y-5">
            @for (row of store.rows(); track row.student.id) {
              <section class="rounded-xl border border-slate-200 p-4 sm:p-5">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
               
<div class="flex items-center justify-between gap-3">
  <div class="min-w-0">
    <h2 class="font-semibold text-slate-800">
      {{ row.student.firstName }} {{ row.student.lastName }}
    </h2>
    <p class="mt-1 text-xs text-slate-500">
      {{ row.student.groupName || 'Sans groupe' }}
    </p>
  </div>

  <p-button
    [icon]="
      store.savingStudentId() === row.student.id
        ? 'pi pi-spinner pi-spin'
        : row.attendanceSaved &&
            (row.status !== 'PRESENT' || row.trackingSaved)
          ? 'pi pi-check'
          : 'pi pi-save'
    "
    [rounded]="true"
    [text]="true"
    [severity]="
      row.attendanceSaved &&
      (row.status !== 'PRESENT' || row.trackingSaved)
        ? 'success'
        : 'primary'
    "
    [loading]="store.savingStudentId() === row.student.id"
    [disabled]="
      store.savingStudentId() !== null ||
      row.status === null ||
      (
        row.attendanceSaved &&
        (row.status !== 'PRESENT' || row.trackingSaved)
      )
    "
    pTooltip="Enregistrer cet élève"
    tooltipPosition="top"
    (onClick)="store.saveStudent(row.student.id)"
  />
</div>


                  <div class="grid grid-cols-2 gap-2 sm:w-64">
                    <button
                      type="button"
                      class="rounded-lg border px-3 py-2.5 text-sm font-medium"
                      [class.border-emerald-500]="row.status === 'PRESENT'"
                      [class.bg-emerald-50]="row.status === 'PRESENT'"
                      [class.text-emerald-800]="row.status === 'PRESENT'"
                      [class.border-slate-200]="row.status !== 'PRESENT'"
                      [disabled]="row.attendanceSaved || store.saving()"
                      [attr.aria-pressed]="row.status === 'PRESENT'"
                      (click)="store.setStatus(row.student.id, 'PRESENT')"
                    >
                      <i class="pi pi-check-circle mr-1"></i>Présent
                    </button>
                    <button
                      type="button"
                      class="rounded-lg border px-3 py-2.5 text-sm font-medium"
                      [class.border-red-500]="row.status === 'ABSENT'"
                      [class.bg-red-50]="row.status === 'ABSENT'"
                      [class.text-red-800]="row.status === 'ABSENT'"
                      [class.border-slate-200]="row.status !== 'ABSENT'"
                      [disabled]="row.attendanceSaved || store.saving()"
                      [attr.aria-pressed]="row.status === 'ABSENT'"
                      (click)="store.setStatus(row.student.id, 'ABSENT')"
                    >
                      <i class="pi pi-times-circle mr-1"></i>Absent
                    </button>
                  </div>
                </div>

                @if (row.status === null) {
                  <p class="mt-3 text-xs text-amber-700">Choisissez le statut de présence.</p>
                }

                <div class="mt-4">
                  <label [for]="'attendance-note-' + row.student.id"
                         class="mb-1 block text-sm font-medium text-slate-700">
                    Commentaire sur la présence
                  </label>
                  <input
                    [id]="'attendance-note-' + row.student.id"
                    type="text"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                    [ngModel]="row.attendanceNote"
                    (ngModelChange)="store.setAttendanceNote(row.student.id, $event)"
                    [disabled]="row.attendanceSaved || store.saving()"
                    placeholder="Commentaire facultatif..."
                  />
                </div>

                @if (row.status === 'PRESENT') {
                  <div class="mt-5 border-t border-slate-100 pt-5">
                    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <h3 class="font-semibold text-slate-800">Suivi pédagogique</h3>
                      @if (row.trackingSaved) {
                        <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                          Suivi enregistré
                        </span>
                      } @else {
                        <span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                          À enregistrer
                        </span>
                      }
                    </div>

                    @if (!row.trackingSaved) {
                      <div class="grid gap-4 md:grid-cols-2">
                        <div>
                          <label [for]="'surah-' + row.student.id"
                                 class="mb-1 block text-sm font-medium text-slate-700">
                            Sourate en cours
                          </label>
                          <p-select
  [inputId]="'surah-' + row.student.id"
  [options]="surahOptions"
  optionLabel="label"
  optionValue="value"
  [filter]="true"
  filterBy="label"
  [showClear]="true"
  placeholder="Rechercher une sourate..."
  [ngModel]="row.surah || null"
  (ngModelChange)="store.setPedagogicalField(row.student.id, 'surah', $event ?? '')"
  [disabled]="store.saving()"
  class="w-full"
/>
                        </div>

                        <div>
                          <label [for]="'completed-' + row.student.id"
                                 class="mb-1 block text-sm font-medium text-slate-700">
                            Travail réalisé aujourd'hui
                          </label>
                          <textarea
                            [id]="'completed-' + row.student.id"
                            rows="2"
                            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                            [ngModel]="row.completedToday"
                            (ngModelChange)="store.setPedagogicalField(row.student.id, 'completedToday', $event)"
                            [disabled]="store.saving()"
                            placeholder="Leçon apprise, versets récités..."
                          ></textarea>
                        </div>

                        <div>
                          <label [for]="'prepare-' + row.student.id"
                                 class="mb-1 block text-sm font-medium text-slate-700">
                            À préparer pour la prochaine séance
                          </label>
                          <textarea
                            [id]="'prepare-' + row.student.id"
                            rows="2"
                            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                            [ngModel]="row.toPrepare"
                            (ngModelChange)="store.setPedagogicalField(row.student.id , 'toPrepare', $event)"
                            [disabled]="store.saving()"
                            placeholder="Leçon à réviser, prochains versets..."
                          ></textarea>
                        </div>

                        <div>
                          <label [for]="'observations-' + row.student.id"
                                 class="mb-1 block text-sm font-medium text-slate-700">
                            Observations pédagogiques
                          </label>
                          <textarea
                            [id]="'observations-' + row.student.id"
                            rows="2"
                            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                            [ngModel]="row.observations"
                            (ngModelChange)="store.setPedagogicalField(row.student.id , 'observations', $event)"
                            [disabled]="store.saving()"
                            placeholder="Difficultés, progrès, remarques..."
                          ></textarea>
                        </div>
                      </div>
                    } @else {
                      <dl class="grid gap-4 text-sm md:grid-cols-2">
                        <div>
                          <dt class="text-slate-500">Sourate en cours</dt>
                          <dd class="mt-1 text-slate-800">{{ row.surah || 'Non renseignée' }}</dd>
                        </div>
                        <div>
                          <dt class="text-slate-500">Travail réalisé aujourd'hui</dt>
                          <dd class="mt-1 whitespace-pre-wrap text-slate-800">{{ row.completedToday || 'Non renseigné' }}</dd>
                        </div>
                        <div>
                          <dt class="text-slate-500">À préparer</dt>
                          <dd class="mt-1 whitespace-pre-wrap text-slate-800">{{ row.toPrepare || 'Non renseigné' }}</dd>
                        </div>
                        <div>
                          <dt class="text-slate-500">Observations</dt>
                          <dd class="mt-1 whitespace-pre-wrap text-slate-800">{{ row.observations || 'Aucune observation' }}</dd>
                        </div>
                      </dl>
                    }
                  </div>
                }
              </section>
            }
          </div>

          <div class="mt-6 flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
            <p class="text-sm text-slate-500">
              {{ store.completedCount() }} / {{ store.rows().length }} élèves renseignés
            </p>
            <p-button
              label="Enregistrer la séance"
              icon="pi pi-check"
              [loading]="store.saving()"
              [disabled]="store.loading() || store.saving() ||
                          store.pendingCount() > 0 || store.rows().length === 0"
              (onClick)="store.save()"
            />
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
  constructor() {
    void this.store.load();
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
