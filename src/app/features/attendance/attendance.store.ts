
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

import { AttendanceService } from '../../core/api/generated/api/attendance.service';
import { AttendanceRequest } from '../../core/api/generated/model/attendanceRequest';
import { AttendanceResponse } from '../../core/api/generated/model/attendanceResponse';
import { StudentStore } from '../students/student.store';
import { Student } from '../students/student.model';

type AttendanceStatus = AttendanceRequest.StatusEnum;

export interface AttendanceRow {
  student: Student;
  status: AttendanceStatus | null;
  note: string;
  saved: boolean;
}

function todayLocal(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface AttendanceState {
  date: string;
  rows: AttendanceRow[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
}

const initialState: AttendanceState = {
  date: todayLocal(),
  rows: [],
  loading: false,
  saving: false,
  error: null,
  success: null
};

export const AttendanceStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ rows }) => ({
    presentCount: computed(
      () => rows().filter(row => row.status === 'PRESENT').length
    ),
    absentCount: computed(
      () => rows().filter(row => row.status === 'ABSENT').length
    ),
    pendingCount: computed(
      () => rows().filter(row => !row.saved && row.status === null).length
    ),
    completedCount: computed(
      () => rows().filter(row => row.status !== null).length
    )
  })),

  withMethods((
    store,
    studentStore = inject(StudentStore),
    attendanceApi = inject(AttendanceService)
  ) => ({
    async load(date = store.date()): Promise<void> {
      patchState(store, {
        date,
        loading: true,
        error: null,
        success: null
      });

      try {
        const students = await studentStore.loadAllActiveStudents();

        const attendances = await firstValueFrom(
          attendanceApi.findByDateRange({ from: date, to: date })
        );
        console.log('load students:', students);
console.log('Loaded attendances:', attendances);
        const attendanceByStudent = new Map<number, AttendanceResponse>();

        for (const attendance of attendances) {
          if (attendance.studentId != null) {
            attendanceByStudent.set(attendance.studentId, attendance);
          }
        }

        const rows: AttendanceRow[] = students.map(student => {
          const existing = attendanceByStudent.get(student.id);

          return {
            student,
            status: existing?.status ?? null,
            note: existing?.comment ?? '',
            saved: existing !== undefined
          };
        });

        patchState(store, { rows, loading: false });
      } catch {
        patchState(store, {
          loading: false,
          error: 'Impossible de charger les élèves ou les présences.'
        });
      }
    },

    setStatus(studentId: number, status: AttendanceStatus): void {
      patchState(store, state => ({
        rows: state.rows.map(row =>
          row.student.id === studentId && !row.saved
            ? { ...row, status }
            : row
        ),
        error: null,
        success: null
      }));
    },

    setNote(studentId: number, note: string): void {
      patchState(store, state => ({
        rows: state.rows.map(row =>
          row.student.id === studentId && !row.saved
            ? { ...row, note }
            : row
        )
      }));
    },

    async save(): Promise<void> {
      if (store.saving() || store.loading()) return;

      if (store.pendingCount() > 0) {
        patchState(store, {
          error: 'Choisissez Présent ou Absent pour chaque élève.'
        });
        return;
      }

      const toSave = store.rows().filter(row => !row.saved);

      if (toSave.length === 0) {
        patchState(store, {
          success: 'Toutes les présences sont déjà enregistrées.',
          error: null
        });
        return;
      }

      patchState(store, { saving: true, error: null, success: null });

      let savedCount = 0;

      try {
        for (const row of toSave) {
          if (row.status === null) continue;

          await firstValueFrom(
            attendanceApi.create8({
              attendanceRequest: {
                studentId: row.student.id,
                date: store.date(),
                status: row.status,
                ...(row.note.trim()
                  ? { comment: row.note.trim() }
                  : {})
              }
            })
          );

          savedCount++;

          patchState(store, state => ({
            rows: state.rows.map(current =>
              current.student.id === row.student.id
                ? { ...current, saved: true }
                : current
            )
          }));
        }

        patchState(store, {
          saving: false,
          success: `${savedCount} présence(s) enregistrée(s).`,
          error: null
        });
      } catch {
        patchState(store, {
          saving: false,
          error:
            'L’enregistrement a échoué en cours de traitement. Certaines présences peuvent déjà être enregistrées. Rechargez la date pour vérifier.',
          success: null
        });
      }
    }
  }))
);
