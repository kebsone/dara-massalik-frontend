
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { AttendanceStore } from './attendance.store';
import { AttendanceRequest } from '../../core/api/generated/model/attendanceRequest';

type AttendanceStatus = AttendanceRequest.StatusEnum;

@Component({
  selector: 'dm-attendance',
  standalone: true,
  imports: [FormsModule, ButtonModule, CardModule],
  template: `
    <div class="page-enter space-y-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p class="text-sm font-medium text-[var(--brand-primary)]">
            École coranique
          </p>
          <h1 class="text-2xl font-bold text-slate-900">Appel des élèves</h1>
          <p class="mt-1 text-sm text-slate-500">
            Renseignez la présence de chaque élève actif.
          </p>
        </div>

        <p-button
          label="Enregistrer les présences"
          icon="pi pi-check"
          [loading]="store.saving()"
          [disabled]="store.loading() || store.saving() ||
                     store.pendingCount() > 0 || store.rows().length === 0"
          (onClick)="store.save()"
        />
      </div>

      @if (store.error()) {
        <div role="alert"
             class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {{ store.error() }}
        </div>
      }

      @if (store.success()) {
        <div role="status"
             class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {{ store.success() }}
        </div>
      }

      <p-card styleClass="border border-[var(--brand-border)] shadow-sm">
        <div class="mb-6">
          <label for="attendance-date"
                 class="mb-2 block text-sm font-medium text-slate-700">
            Date de la séance
          </label>
          <input
            id="attendance-date"
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
            <p class="mt-1 text-2xl font-bold text-emerald-800">
              {{ store.presentCount() }}
            </p>
          </div>
          <div class="rounded-xl bg-red-50 p-4">
            <p class="text-sm text-red-700">Absents</p>
            <p class="mt-1 text-2xl font-bold text-red-800">
              {{ store.absentCount() }}
            </p>
          </div>
          <div class="rounded-xl bg-amber-50 p-4">
            <p class="text-sm text-amber-700">À renseigner</p>
            <p class="mt-1 text-2xl font-bold text-amber-800">
              {{ store.pendingCount() }}
            </p>
          </div>
        </div>

        @if (store.loading()) {
          <div class="py-12 text-center text-slate-500">
            <i class="pi pi-spin pi-spinner mr-2"></i>
            Chargement des élèves et des présences...
          </div>
        } @else if (store.rows().length === 0) {
          <div class="py-12 text-center text-slate-500">
            Aucun élève actif trouvé.
          </div>
        } @else {
          <div class="space-y-4">
            @for (row of store.rows(); track row.student.id) {
              <div class="rounded-xl border border-slate-200 p-4">
                <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px_minmax(180px,1fr)] md:items-center">
                  <div>
                    <p class="font-semibold text-slate-800">
                      {{ row.student.firstName }} {{ row.student.lastName }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">
                      {{ row.student.groupName || 'Sans groupe' }}
                    </p>
                  </div>

                  <div>
                    <p class="mb-2 text-xs text-slate-500 md:hidden">
                      Statut
                    </p>

                    @if (!row.saved) {
                      <div class="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          class="rounded-lg border px-3 py-3 text-sm font-medium"
                          [class.border-emerald-500]="row.status === 'PRESENT'"
                          [class.bg-emerald-50]="row.status === 'PRESENT'"
                          [class.text-emerald-800]="row.status === 'PRESENT'"
                          [class.border-slate-200]="row.status !== 'PRESENT'"
                          [disabled]="store.saving()"
                          [attr.aria-pressed]="row.status === 'PRESENT'"
                          (click)="store.setStatus(row.student.id, 'PRESENT')"
                        >
                          <i class="pi pi-check-circle mr-1"></i>Présent
                        </button>

                        <button
                          type="button"
                          class="rounded-lg border px-3 py-3 text-sm font-medium"
                          [class.border-red-500]="row.status === 'ABSENT'"
                          [class.bg-red-50]="row.status === 'ABSENT'"
                          [class.text-red-800]="row.status === 'ABSENT'"
                          [class.border-slate-200]="row.status !== 'ABSENT'"
                          [disabled]="store.saving()"
                          [attr.aria-pressed]="row.status === 'ABSENT'"
                          (click)="store.setStatus(row.student.id, 'ABSENT')"
                        >
                          <i class="pi pi-times-circle mr-1"></i>Absent
                        </button>
                      </div>

                      @if (row.status === null) {
                        <p class="mt-1 text-xs text-amber-700">
                          Choix obligatoire
                        </p>
                      }
                    } @else {
                      <span class="text-sm font-medium"
                            [class.text-emerald-700]="row.status === 'PRESENT'"
                            [class.text-red-700]="row.status === 'ABSENT'">
                        {{ statusLabel(row.status) }} · Enregistré
                      </span>
                    }
                  </div>

                  <div>
                    <label [for]="'note-' + row.student.id"
                           class="mb-2 block text-xs text-slate-500 md:hidden">
                      Observation (facultative)
                    </label>
                    <input
                      [id]="'note-' + row.student.id"
                      type="text"
                      class="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm"
                      [ngModel]="row.note"
                      (ngModelChange)="store.setNote(row.student.id, $event)"
                      [disabled]="row.saved || store.saving()"
                      placeholder="Ajouter une observation..."
                    />
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="mt-6 flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
            <p class="text-sm text-slate-500">
              {{ store.completedCount() }} / {{ store.rows().length }} élèves renseignés
            </p>
            <p-button
              label="Enregistrer les présences"
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
  readonly store = inject(AttendanceStore);

  constructor() {
    void this.store.load();
  }

  statusLabel(status: AttendanceStatus | null): string {
    switch (status) {
      case 'PRESENT':
        return 'Présent';
      case 'ABSENT':
        return 'Absent';
      case 'LATE':
        return 'En retard';
      case 'JUSTIFIED_ABSENCE':
        return 'Absence justifiée';
      default:
        return 'À renseigner';
    }
  }
}
