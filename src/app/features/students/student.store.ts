import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { PageResponse, SchoolGroup, Student, StudentRequest } from './student.model';
import { GroupApiService } from 'src/app/core/api/group-api.service';
import { StudentApiService } from 'src/app/core/api/student-api.service';

export type { SchoolGroup, Student, StudentRequest } from './student.model';

interface StudentState {
  students: Student[];
  selectedStudent: Student | null;
  groups: SchoolGroup[];
  loading: boolean;
  detailsLoading: boolean;
  saving: boolean;
  error: string | null;
  groupsError: string | null;
  search: string;
  groupFilter: number | null;
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  allActiveStudents: Student[];
  allActiveStudentsLoaded: boolean;
  allActiveStudentsLoading: boolean;
}

const initialState: StudentState = {
  allActiveStudents: [],
  allActiveStudentsLoaded: false,
  allActiveStudentsLoading: false,
  students: [],
  selectedStudent: null,
  groups: [],
  loading: false,
  detailsLoading: false,
  saving: false,
  error: null,
  groupsError: null,
  search: '',
  groupFilter: null,
  page: 0,
  pageSize: 10,
  totalElements: 0,
  totalPages: 0
};

function apiError(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Impossible de joindre le serveur. Vérifiez que Spring Boot est démarré.';
    if (error.status === 401) return 'Votre session a expiré. Reconnectez-vous.';
    if (error.status === 403) return 'Vous n’avez pas la permission nécessaire pour cette action.';
    const message = error.error?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export const StudentStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ students, totalElements, groups }) => ({
    activeOnPage: computed(() => students().filter(student => student.active).length),
    groupCount: computed(() => groups().length),
    hasStudents: computed(() => totalElements() > 0)
  })),
  withMethods((store, studentApi = inject(StudentApiService), groupApi = inject(GroupApiService)) => ({
    async loadStudents(
      search = store.search(),
      groupId = store.groupFilter(),
      page = store.page(),
      size = store.pageSize()
    ): Promise<void> {
      patchState(store, {
        loading: true,
        error: null,
        search,
        groupFilter: groupId,
        page,
        pageSize: size
      });
      try {
        const response: PageResponse<Student> = await firstValueFrom(
          studentApi.list({ search, groupId, page, size })
        );
        console.log('Loaded students:', response);
        patchState(store, {
          students: response.content ?? [],
          totalElements: response.totalElements ?? 0,
          totalPages: response.totalPages ?? 0,
          page: response.number ?? page,
          pageSize: response.size ?? size,
          loading: false
        });
      } catch (error) {
        patchState(store, {
          loading: false,
          students: [],
          totalElements: 0,
          totalPages: 0,
          error: apiError(error, 'Impossible de charger les élèves.')
        });
      }
    },

    async loadGroups(): Promise<void> {
      patchState(store, { groupsError: null });
      try {
        const groups = await firstValueFrom(groupApi.list());
        patchState(store, { groups });
      } catch (error) {
        patchState(store, {
          groups: [],
          groupsError: apiError(error, 'Impossible de charger les groupes. Vous pouvez tout de même créer un élève sans groupe.')
        });
      }
    },

    async loadStudent(id: number): Promise<void> {
      patchState(store, { detailsLoading: true, selectedStudent: null, error: null });
      try {
        const student = await firstValueFrom(studentApi.getById(id));
        patchState(store, { selectedStudent: student, detailsLoading: false });
      } catch (error) {
        patchState(store, {
          detailsLoading: false,
          selectedStudent: null,
          error: apiError(error, 'Impossible de charger la fiche de cet élève.')
        });
      }
    },

    async createStudent(request: StudentRequest): Promise<Student | null> {
      patchState(store, { saving: true, error: null });
      try {
        const created = await firstValueFrom(studentApi.create(request));
        patchState(store, { saving: false });
        return created;
      } catch (error) {
        patchState(store, { saving: false, error: apiError(error, 'Impossible de créer cet élève.') });
        return null;
      }
    },

    async updateStudent(id: number, request: StudentRequest): Promise<Student | null> {
      patchState(store, { saving: true, error: null });
      try {
        const updated = await firstValueFrom(studentApi.update(id, request));
        patchState(store, {
          saving: false,
          selectedStudent: store.selectedStudent()?.id === id ? updated : store.selectedStudent()
        });
        return updated;
      } catch (error) {
        patchState(store, { saving: false, error: apiError(error, 'Impossible de modifier cet élève.') });
        return null;
      }
    },

    async deactivateStudent(id: number): Promise<boolean> {
      patchState(store, { saving: true, error: null });
      try {
        await firstValueFrom(studentApi.deactivate(id));
        patchState(store, { saving: false });
        return true;
      } catch (error) {
        patchState(store, { saving: false, error: apiError(error, 'Impossible de désactiver cet élève.') });
        return false;
      }
    },

    async loadAllActiveStudents(force = false): Promise<Student[]> {
  if (!force && store.allActiveStudentsLoaded()) {
    return store.allActiveStudents();
  }

  patchState(store, {
    allActiveStudentsLoading: true,
    allActiveStudentsLoaded: false
  });

  try {
    const allStudents: Student[] = [];
    let page = 0;
    let totalPages = 1;

    do {
      const response = await firstValueFrom(
        studentApi.list({ page, size: 100 })
      );

      allStudents.push(...(response.content ?? []));
      totalPages = response.totalPages ?? 1;
      page++;
    } while (page < totalPages);

    const activeStudents = allStudents
      .filter(student => student.active)
      .sort((a, b) =>
        a.lastName.localeCompare(b.lastName, 'fr') ||
        a.firstName.localeCompare(b.firstName, 'fr')
      );

    patchState(store, {
      allActiveStudents: activeStudents,
      allActiveStudentsLoaded: true,
      allActiveStudentsLoading: false
    });

    return activeStudents;
  } catch (error) {
    patchState(store, {
      allActiveStudentsLoading: false,
      allActiveStudentsLoaded: false
    });

    throw error;
  }
},
  }))
);
