import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

import { AttendanceService } from '../../core/api/generated/api/attendance.service';
import { AttendanceRequest } from '../../core/api/generated/model/attendanceRequest';
import { AttendanceResponse } from '../../core/api/generated/model/attendanceResponse';
import { PedagogicalTrackingService } from '../../core/api/generated/api/pedagogicalTracking.service';
import { PedagogicalTrackingResponse } from '../../core/api/generated/model/pedagogicalTrackingResponse';
import { StudentStore } from '../students/student.store';
import { Student } from '../students/student.model';

type AttendanceStatus = AttendanceRequest.StatusEnum;
type PedagogicalField = 'surah' | 'completedToday' | 'toPrepare' | 'observations';

export interface SessionRow {
  student: Student;
  status: AttendanceStatus | null;
  attendanceNote: string;
  attendanceSaved: boolean;
  trackingSaved: boolean;
  surah: string;
  completedToday: string;
  toPrepare: string;
  observations: string;

}

function todayLocal(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

interface SessionState {
  date: string;
  rows: SessionRow[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
    savingStudentId: number | null;
}

const initialState: SessionState = {
  date: todayLocal(),
  rows: [],
  loading: false,
  saving: false,
  error: null,
  success: null,
  savingStudentId: null
};

function hasPedagogicalContent(row: SessionRow): boolean {
  return !!(
    row.surah.trim() ||
    row.completedToday.trim() ||
    row.toPrepare.trim() ||
    row.observations.trim()
  );
}

export const SessionTrackingStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ rows }) => ({
    presentCount: computed(() => rows().filter(r => r.status === 'PRESENT').length),
    absentCount: computed(() => rows().filter(r => r.status === 'ABSENT').length),
    pendingCount: computed(() => rows().filter(r => !r.attendanceSaved && r.status === null).length),
    completedCount: computed(() => rows().filter(r => r.status !== null).length)
  })),
  withMethods((
    store,
    studentStore = inject(StudentStore),
    attendanceApi = inject(AttendanceService),
    trackingApi = inject(PedagogicalTrackingService)
  ) => ({
    async load(date = store.date()): Promise<void> {
      patchState(store, {
        date,
        loading: true,
        error: null,
        success: null
      });

      try {
        const [students, attendances] = await Promise.all([
          studentStore.loadAllActiveStudents(),
          firstValueFrom(attendanceApi.findByDateRange({ from: date, to: date }))
        ]);

        console.log(
  attendances.map(attendance => ({
    studentId: attendance.studentId,
    date: attendance.date,
    status: attendance.status,
    comment: attendance.comment
  }))
);
        const attendanceByStudent = new Map<number, AttendanceResponse>();
        for (const attendance of attendances) {
          if (attendance.studentId != null) {
            attendanceByStudent.set(attendance.studentId, attendance);
          }
        }

        // L'API actuelle expose l'historique par élève, pas par date.
        const histories = await Promise.all(
          students.map(async student => {
            const history = await firstValueFrom(
              trackingApi.findStudentHistory({ studentId: student.id })
            );
            const match = history.find(item => item.date?.slice(0, 10) === date);
            return [student.id, match] as const;
          })
        );
        const trackingByStudent = new Map<number, PedagogicalTrackingResponse | undefined>(histories);

        const rows: SessionRow[] = students.map(student => {
          const attendance = attendanceByStudent.get(student.id);
          const tracking = trackingByStudent.get(student.id);

          return {
            student,
            status: attendance?.status ?? null,
            attendanceNote: attendance?.comment ?? '',
            attendanceSaved: attendance !== undefined,
            trackingSaved: tracking !== undefined,
            surah: tracking?.surah ?? '',
            completedToday: tracking?.completedToday ?? '',
            toPrepare: tracking?.toPrepare ?? '',
            observations: tracking?.observations ?? '',
            savingStudentId: null
          };
        });
console.log(
  rows.map(row => ({
    student: `${row.student.firstName} ${row.student.lastName}`,
    status: row.status,
    attendanceSaved: row.attendanceSaved
  }))
);
        patchState(store, { rows, loading: false });
      } catch (error) {
        console.error('Erreur de chargement de la séance', error);
        patchState(store, {
          loading: false,
          error: 'Impossible de charger la séance. Vérifiez les API des présences et du suivi pédagogique.'
        });
      }
    },

    setStatus(studentId: number, status: AttendanceStatus): void {
      patchState(store, state => ({
        rows: state.rows.map(row =>
          row.student.id !== studentId || row.attendanceSaved
            ? row
            : {
                ...row,
                status,
                ...(status === 'ABSENT'
                  ? { surah: '', completedToday: '', toPrepare: '', observations: '' }
                  : {})
              }
        ),
        error: null,
        success: null
      }));
    },

    setAttendanceNote(studentId: number, value: string): void {
      patchState(store, state => ({
        rows: state.rows.map(row =>
          row.student.id === studentId && !row.attendanceSaved
            ? { ...row, attendanceNote: value }
            : row
        )
      }));
    },

    setPedagogicalField(studentId: number, field: PedagogicalField, value: string): void {
      patchState(store, state => ({
        rows: state.rows.map(row =>
          row.student.id === studentId && row.status === 'PRESENT'
            ? { ...row, [field]: value }
            : row
        ),
        error: null,
        success: null
      }));
    },

async saveStudent(studentId: number): Promise<void> {
  const row = store.rows().find(
    item => item.student.id === studentId
  );

if (
  !row ||
  row.status === null ||
  store.savingStudentId() !== null
) {
  return;
}
  patchState(store, {
    saving: true,
    error: null,
    success: null
  });

  try {
    if (!row.attendanceSaved) {
      const attendanceRequest: AttendanceRequest = {
        studentId: row.student.id,
        date: store.date(),
        status: row.status,
        ...(row.attendanceNote.trim()
          ? { comment: row.attendanceNote.trim() }
          : {})
      };

      await firstValueFrom(
        attendanceApi.create8({ attendanceRequest })
      );

      patchState(store, {
        rows: store.rows().map(item =>
          item.student.id === studentId
            ? { ...item, attendanceSaved: true }
            : item
        )
      });
    }

    const currentRow = store.rows().find(
      item => item.student.id === studentId
    );

    if (
      currentRow?.status === 'PRESENT' &&
      !currentRow.trackingSaved &&
      [
        currentRow.surah,
        currentRow.completedToday,
        currentRow.toPrepare,
        currentRow.observations
      ].some(value => value.trim().length > 0)
    ) {
      await firstValueFrom(
        trackingApi.create2({
          pedagogicalTrackingRequest: {
            studentId: currentRow.student.id,
            date: store.date(),
            ...(currentRow.surah.trim()
              ? { surah: currentRow.surah.trim() }
              : {}),
            ...(currentRow.completedToday.trim()
              ? { completedToday: currentRow.completedToday.trim() }
              : {}),
            ...(currentRow.toPrepare.trim()
              ? { toPrepare: currentRow.toPrepare.trim() }
              : {}),
            ...(currentRow.observations.trim()
              ? { observations: currentRow.observations.trim() }
              : {})
          }
        })
      );

      patchState(store, {
        rows: store.rows().map(item =>
          item.student.id === studentId
            ? { ...item, trackingSaved: true }
            : item
        )
      });
    }

    patchState(store, {
      success: `Enregistrement terminé pour ${row.student.firstName} ${row.student.lastName}.`
    });
  } catch {
    patchState(store, {
      error: `Erreur lors de l'enregistrement de ${row.student.firstName} ${row.student.lastName}.`
    });
  } finally {
    patchState(store, { saving: false });
  }
},

    async save(): Promise<void> {
      if (store.saving() || store.loading()) return;

      if (store.pendingCount() > 0) {
        patchState(store, { error: 'Choisissez Présent ou Absent pour chaque élève.' });
        return;
      }

      const initialRows = store.rows();
      const attendanceToSave = initialRows.filter(row => !row.attendanceSaved);
      const trackingToSave = initialRows.filter(
        row => row.status === 'PRESENT' && !row.trackingSaved && hasPedagogicalContent(row)
      );

      if (attendanceToSave.length === 0 && trackingToSave.length === 0) {
        patchState(store, {
          success: 'Toutes les données de cette séance sont déjà enregistrées.',
          error: null
        });
        return;
      }

      patchState(store, { saving: true, error: null, success: null });

      let attendanceCount = 0;
      let trackingCount = 0;

      try {
        for (const row of attendanceToSave) {
          if (row.status === null) continue;

          await firstValueFrom(attendanceApi.create8({
            attendanceRequest: {
              studentId: row.student.id,
              date: store.date(),
              status: row.status,
              ...(row.attendanceNote.trim()
                ? { comment: row.attendanceNote.trim() }
                : {})
            }
          }));

          attendanceCount++;
          patchState(store, state => ({
            rows: state.rows.map(current =>
              current.student.id === row.student.id
                ? { ...current, attendanceSaved: true }
                : current
            )
          }));
        }

        for (const row of trackingToSave) {
          await firstValueFrom(trackingApi.create2({
            pedagogicalTrackingRequest: {
              studentId: row.student.id,
              date: store.date(),
              ...(row.surah.trim() ? { surah: row.surah.trim() } : {}),
              ...(row.completedToday.trim() ? { completedToday: row.completedToday.trim() } : {}),
              ...(row.toPrepare.trim() ? { toPrepare: row.toPrepare.trim() } : {}),
              ...(row.observations.trim() ? { observations: row.observations.trim() } : {})
            }
          }));

          trackingCount++;
          patchState(store, state => ({
            rows: state.rows.map(current =>
              current.student.id === row.student.id
                ? { ...current, trackingSaved: true }
                : current
            )
          }));
        }

        patchState(store, {
          saving: false,
          success: `${attendanceCount} présence(s) et ${trackingCount} suivi(s) pédagogique(s) enregistré(s).`,
          error: null
        });
      } catch (error) {
        console.error('Erreur d’enregistrement de la séance', error);
        patchState(store, {
          saving: false,
          error: 'L’enregistrement a été interrompu. Certaines données peuvent déjà être enregistrées. Rechargez la date avant de réessayer.',
          success: null
        });
      }
    }
  }))
);
