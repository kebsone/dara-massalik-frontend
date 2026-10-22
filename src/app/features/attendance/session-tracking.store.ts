import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

import { AttendanceService } from '../../core/api/generated/api/attendance.service';
import { AttendanceRequest } from '../../core/api/generated/model/attendanceRequest';
import { PedagogicalTrackingService } from '../../core/api/generated/api/pedagogicalTracking.service';
import { StudentsService } from '../../core/api/generated/api/students.service';
import { SessionTrackingService } from '../../core/api/generated/api/sessionTracking.service';
import { StudentResponse } from 'src/app/core/api/generated';

type AttendanceStatus = AttendanceRequest.StatusEnum;
type PedagogicalField = 'surah' | 'completedToday' | 'toPrepare' | 'observations';

interface EditableValues {
  status: AttendanceStatus | null;
  attendanceNote: string;
  surah: string;
  completedToday: string;
  toPrepare: string;
  observations: string;
}

export interface SessionRow extends EditableValues {
  student: StudentResponse;
  attendanceSaved: boolean;
  trackingSaved: boolean;
  trackingId: number | null;
  initialValues: EditableValues;
}

// DTO du nouvel endpoint GET /api/session-tracking.
// Les types sont déclarés localement pour ne pas dépendre des noms générés
// automatiquement pour les DTO imbriqués de Springdoc.
interface SessionTrackingApiRow {
  studentId: number;
  firstName?: string | null;
  lastName?: string | null;
  active?: boolean;
  groupId?: number | null;
  groupName?: string | null;
  groupColor?: string | null;
  photoUrl?: string | null;
  attendance?: {
    id?: number | null;
    status?: AttendanceStatus | null;
    comment?: string | null;
  } | null;
  pedagogicalTracking?: {
    id?: number | null;
    surah?: string | null;
    completedToday?: string | null;
    toPrepare?: string | null;
    observations?: string | null;
  } | null;
}

interface SessionTrackingPage {
  content?: SessionTrackingApiRow[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

interface SessionState {
  date: string;
  search: string;
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  rows: SessionRow[];
  photoUrls: Record<number, string>;
  loading: boolean;
  saving: boolean;
  savingStudentId: number | null;
  error: string | null;
  success: string | null;
}

function todayLocal(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const initialState: SessionState = {
  date: todayLocal(),
  search: '',
  page: 0,
  pageSize: 10,
  totalElements: 0,
  totalPages: 0,
  rows: [],
  photoUrls: {},
  loading: false,
  saving: false,
  savingStudentId: null,
  error: null,
  success: null
};

function hasPedagogicalContent(row: EditableValues): boolean {
  return !!(
    row.surah.trim() ||
    row.completedToday.trim() ||
    row.toPrepare.trim() ||
    row.observations.trim()
  );
}

function hasChanges(row: SessionRow): boolean {
  const initial = row.initialValues;
  const attendanceChanged = !row.attendanceSaved && (
    row.status !== initial.status ||
    row.attendanceNote.trim() !== initial.attendanceNote.trim()
  );

  return attendanceChanged ||
    row.surah.trim() !== initial.surah.trim() ||
    row.completedToday.trim() !== initial.completedToday.trim() ||
    row.toPrepare.trim() !== initial.toPrepare.trim() ||
    row.observations.trim() !== initial.observations.trim();
}

function valuesOf(row: SessionRow): EditableValues {
  return {
    status: row.status,
    attendanceNote: row.attendanceNote,
    surah: row.surah,
    completedToday: row.completedToday,
    toPrepare: row.toPrepare,
    observations: row.observations
  };
}

export const SessionTrackingStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ rows, totalElements, totalPages, page, pageSize }) => ({
    presentCount: computed(() => rows().filter(row => row.status === 'PRESENT').length),
    absentCount: computed(() => rows().filter(row => row.status === 'ABSENT').length),
    pendingCount: computed(() => rows().filter(row => row.status === null && !row.attendanceSaved).length),
    completedCount: computed(() => rows().filter(row => row.status !== null).length),
    changedCount: computed(() => rows().filter(hasChanges).length),
    canGoPrevious: computed(() => page() > 0),
    canGoNext: computed(() => page() + 1 < totalPages()),
    firstItem: computed(() => totalElements() === 0 ? 0 : page() * pageSize() + 1),
    lastItem: computed(() => Math.min((page() + 1) * pageSize(), totalElements()))
  })),
  withMethods((
    store,
    sessionApi = inject(SessionTrackingService),
    attendanceApi = inject(AttendanceService),
    trackingApi = inject(PedagogicalTrackingService),
    studentsApi = inject(StudentsService)
  ) => {
    // Empêche une réponse lente d'une ancienne page de remplacer la plus récente.
    let loadSequence = 0;

    const loadPhotoBlobs = async (studentIds: number[], sequence: number): Promise<void> => {
      await Promise.all(studentIds.map(async id => {
        try {
          const blob = await firstValueFrom(studentsApi.getStudentPhoto({ id }));
          if (sequence !== loadSequence || !store.rows().some(row => row.student.id === id)) return;
          if (store.photoUrls()[id]) return;

          const objectUrl = URL.createObjectURL(blob);
          patchState(store, state => ({ photoUrls: { ...state.photoUrls, [id]: objectUrl } }));
        } catch {
          // Pas de photo disponible : le composant affichera les initiales.
        }
      }));
    };

    const load = async (
      date = store.date(),
      page = store.page(),
      search = store.search()
    ): Promise<void> => {
      const sequence = ++loadSequence;
      patchState(store, { date, page, search, loading: true, error: null, success: null });

      try {
        // UN SEUL appel de lecture pour les élèves de la page + présence + suivi de la date.
        const rawResponse = await firstValueFrom(sessionApi.getSessionTrackingPage({
          date,
          search: search.trim() || undefined,
          page,
          size: store.pageSize()
        }));
        if (sequence !== loadSequence) return;

        const response = rawResponse as unknown as SessionTrackingPage;
        const content = response.content ?? [];
        const rows: SessionRow[] = content.map(item => {
          const attendance = item.attendance ?? null;
          const tracking = item.pedagogicalTracking ?? null;
          const student = {
            id: item.studentId,
            firstName: item.firstName ?? '',
            lastName: item.lastName ?? '',
            active: item.active ?? true,
            groupId: item.groupId ?? undefined,
            groupName: item.groupName ?? undefined,
            groupColor: item.groupColor ?? undefined,
            photoUrl: item.photoUrl ?? undefined
          } as StudentResponse;

          const values: EditableValues = {
            status: attendance?.status ?? null,
            attendanceNote: attendance?.comment ?? '',
            surah: tracking?.surah ?? '',
            completedToday: tracking?.completedToday ?? '',
            toPrepare: tracking?.toPrepare ?? '',
            observations: tracking?.observations ?? ''
          };

          return {
            student,
            ...values,
            attendanceSaved: attendance !== null,
            trackingSaved: tracking !== null,
            trackingId: tracking?.id ?? null,
            initialValues: { ...values }
          };
        });

        const photoStudentIds = new Set(
          rows.filter(row => !!row.student.photoUrl).map(row => row.student.id as number)
        );
        const currentPhotoUrls = store.photoUrls();
        const nextPhotoUrls: Record<number, string> = {};
        for (const [key, url] of Object.entries(currentPhotoUrls)) {
          const id = Number(key);
          if (photoStudentIds.has(id)) nextPhotoUrls[id] = url;
          else URL.revokeObjectURL(url);
        }

        patchState(store, {
          rows,
          photoUrls: nextPhotoUrls,
          totalElements: response.totalElements ?? 0,
          totalPages: response.totalPages ?? 0,
          page: response.number ?? page,
          pageSize: response.size ?? store.pageSize(),
          loading: false
        });

        // Les photos sont des ressources binaires distinctes. Elles sont chargées
        // uniquement pour la page visible et ne déclenchent aucun appel par élève
        // pour les données de présence ou de suivi.
        const idsWithoutPhotoBlob = rows
          .filter(row => !!row.student.photoUrl && !store.photoUrls()[row.student.id as number])
          .map(row => row.student.id as number);
        void loadPhotoBlobs(idsWithoutPhotoBlob, sequence);
      } catch (error) {
        if (sequence !== loadSequence) return;
        console.error('Erreur de chargement de la séance', error);
        patchState(store, {
          rows: [],
          loading: false,
          error: 'Impossible de charger la séance. Vérifiez que l’API /api/session-tracking est disponible.'
        });
      }
    };

    return {
      load,
      setSearch(value: string): void {
        patchState(store, { search: value });
      },
      searchNow(): void {
        void load(store.date(), 0, store.search());
      },
      goToPage(page: number): void {
        if (page < 0 || page >= store.totalPages() || store.loading() || store.saving()) return;
        void load(store.date(), page, store.search());
      },
      setStatus(studentId: number, status: AttendanceStatus): void {
        patchState(store, state => ({
          rows: state.rows.map(row => row.student.id !== studentId || row.attendanceSaved
            ? row
            : {
                ...row,
                status,
                ...(status === 'ABSENT'
                  ? { surah: '', completedToday: '', toPrepare: '', observations: '' }
                  : {})
              }),
          error: null,
          success: null
        }));
      },
      setAttendanceNote(studentId: number, value: string): void {
        patchState(store, state => ({
          rows: state.rows.map(row => row.student.id === studentId && !row.attendanceSaved
            ? { ...row, attendanceNote: value }
            : row),
          error: null,
          success: null
        }));
      },
      setPedagogicalField(studentId: number, field: PedagogicalField, value: string): void {
        patchState(store, state => ({
          rows: state.rows.map(row => row.student.id === studentId && row.status === 'PRESENT'
            ? { ...row, [field]: value }
            : row),
          error: null,
          success: null
        }));
      },
      hasChanges(studentId: number): boolean {
        const row = store.rows().find(item => item.student.id === studentId);
        return !!row && hasChanges(row);
      },
      async saveStudent(studentId: number): Promise<void> {
        const initialRow = store.rows().find(item => item.student.id === studentId);
        if (!initialRow || !hasChanges(initialRow) || initialRow.status === null || store.saving()) return;

        patchState(store, { saving: true, savingStudentId: studentId, error: null, success: null });
        try {
          let current = store.rows().find(item => item.student.id === studentId)!;

          if (!current.attendanceSaved) {
            await firstValueFrom(attendanceApi.create7({
              attendanceRequest: {
                studentId,
                date: store.date(),
                status: current.status!,
                ...(current.attendanceNote.trim() ? { comment: current.attendanceNote.trim() } : {})
              }
            }));

            // Marquer la présence comme enregistrée immédiatement : si le POST
            // pédagogique échoue ensuite, un nouvel essai ne dupliquera pas la présence.
            patchState(store, state => ({
              rows: state.rows.map(row => row.student.id !== studentId ? row : {
                ...row,
                attendanceSaved: true,
                initialValues: {
                  ...row.initialValues,
                  status: row.status,
                  attendanceNote: row.attendanceNote
                }
              })
            }));
          }

          current = store.rows().find(item => item.student.id === studentId)!;
          const shouldSaveTracking = current.status === 'PRESENT' &&
            (hasPedagogicalContent(current) || current.trackingSaved);

          if (shouldSaveTracking) {
            // Le POST backend est un upsert (studentId + date), donc le suivi existant
            // est mis à jour au lieu de créer un doublon.
            await firstValueFrom(trackingApi.saveOrUpdate({
              pedagogicalTrackingRequest: {
                studentId,
                date: store.date(),
                ...(current.surah.trim() ? { surah: current.surah.trim() } : {}),
                ...(current.completedToday.trim() ? { completedToday: current.completedToday.trim() } : {}),
                ...(current.toPrepare.trim() ? { toPrepare: current.toPrepare.trim() } : {}),
                ...(current.observations.trim() ? { observations: current.observations.trim() } : {})
              }
            }));
          }

          patchState(store, state => ({
            rows: state.rows.map(row => row.student.id !== studentId ? row : {
              ...row,
              attendanceSaved: true,
              trackingSaved: shouldSaveTracking || row.trackingSaved,
              initialValues: valuesOf(row)
            }),
            success: `Enregistrement terminé pour ${current.student.firstName ?? ''} ${current.student.lastName ?? ''}.`.trim(),
            error: null
          }));
        } catch (error) {
          console.error('Erreur d’enregistrement', error);
          patchState(store, {
            error: `Erreur lors de l'enregistrement de l'élève. La présence peut déjà être enregistrée ; réessayez pour terminer le suivi pédagogique.`,
            success: null
          });
        } finally {
          patchState(store, { saving: false, savingStudentId: null });
        }
      }
    };
  })
);
