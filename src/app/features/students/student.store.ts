import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { PageResponse, SchoolGroup, StudentRequest } from './student.model';
import { GroupApiService } from 'src/app/core/api/group-api.service';
import { StudentApiService } from 'src/app/core/api/student-api.service';
import { PedagogicalTrackingResponse, StudentResponse } from 'src/app/core/api/generated';
import { PedagogicalTrackingService } from 'src/app/core/api/generated/api/pedagogicalTracking.service';
import { StudentTrackingHistoryResponse } from 'src/app/core/api/generated';
import { StudentTrackingHistoryService } from 'src/app/core/api/generated/api/studentTrackingHistory.service';

import { StudentsService } from 'src/app/core/api/generated/api/students.service';
export type { SchoolGroup,   StudentRequest } from './student.model';

interface StudentState {
  students: StudentResponse[];
  selectedStudent: StudentResponse | null;
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
  allActiveStudents: StudentResponse[];
  allActiveStudentsLoaded: boolean;
  allActiveStudentsLoading: boolean;
  trackingHistory: StudentTrackingHistoryResponse['history'];
   trackingLoading :boolean;
 trackingError :string | null;
 photoUrl: string | null;
photoStudentId: number | null;
photoLoading: boolean;
photoSaving: boolean;
photoError: string | null;
photoUrls: Record<number, string>;
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
  totalPages: 0,
    trackingHistory:[],
   trackingLoading :false,
 trackingError :null,
 photoUrl: null,
photoStudentId: null,
photoLoading: false,
photoSaving: false,
photoError: null,
photoUrls: {}
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
  withMethods((store, studentApi = inject(StudentApiService), groupApi = inject(GroupApiService), 
  
  trackingApi = inject(StudentTrackingHistoryService), studentService = inject(StudentsService)) => ({
    
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
    const response: PageResponse<StudentResponse> = await firstValueFrom(
      studentApi.list({ search, groupId, page, size })
    );

    const students = response.content ?? [];
    const studentIds = new Set(
      students
        .map(student => student.id)
        .filter((id): id is number => id != null)
    );

    // Conserver les URL des élèves présents sur la page.
    const existingUrls = store.photoUrls();
    const nextUrls: Record<number, string> = {};

    for (const [id, url] of Object.entries(existingUrls)) {
      if (studentIds.has(Number(id))) {
        nextUrls[Number(id)] = url;
      } else {
        URL.revokeObjectURL(url);
      }
    }

    patchState(store, {
      students,
      photoUrls: nextUrls,
      totalElements: response.totalElements ?? 0,
      totalPages: response.totalPages ?? 0,
      page: response.number ?? page,
      pageSize: response.size ?? size,
      loading: false
    });

    // Télécharger uniquement les photos présentes sur cette page.
    const studentsWithPhoto = students.filter(
      student =>
        student.id != null &&
        !!student.photoUrl &&
        !nextUrls[student.id]
    );

    await Promise.all(
      studentsWithPhoto.map(async student => {
        const id = student.id!;

        try {
          const blob = await firstValueFrom(
            studentService.getStudentPhoto({ id })
          );

          // Ne pas conserver une réponse si la page a changé.
          if (!store.students().some(current => current.id === id)) {
            return;
          }

          const url = URL.createObjectURL(blob);

          patchState(store, {
            photoUrls: {
              ...store.photoUrls(),
              [id]: url
            }
          });
        } catch {
          // En cas d'erreur, les initiales resteront affichées.
        }
      })
    );
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

async loadTrackingHistory(studentId: number): Promise<void> {
  patchState(store, {
    trackingLoading: true,
    trackingError: null,
    trackingHistory: []
  });

  try {
    const response = await firstValueFrom(
      trackingApi.getHistory({ studentId })
    );

    const history = [...(response.history ?? [])].sort((a, b) =>
      (b.date ?? '').localeCompare(a.date ?? '')
    );

    patchState(store, {
      trackingHistory: history,
      trackingLoading: false
    });
  } catch (error) {
    patchState(store, {
      trackingLoading: false,
      trackingHistory: [],
      trackingError: apiError(
        error,
        "Impossible de charger l'historique de l'élève."
      )
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

    async createStudent(request: StudentRequest): Promise<StudentResponse  | null> {
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

    async updateStudent(id: number, request: StudentRequest): Promise<StudentResponse | null> {
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

clearPhoto(): void {
  const url = store.photoUrl();

  if (url) {
    URL.revokeObjectURL(url);
  }

  patchState(store, {
    photoUrl: null,
    photoStudentId: null,
    photoLoading: false,
    photoSaving: false,
    photoError: null
  });
},

async loadPhoto(id: number): Promise<void> {
  const previousUrl = store.photoUrl();

  if (previousUrl) {
    URL.revokeObjectURL(previousUrl);
  }

  patchState(store, {
    photoUrl: null,
    photoStudentId: id,
    photoLoading: true,
    photoError: null
  });

  try {
    const blob = await firstValueFrom(
      studentService.getStudentPhoto({ id })
    );

    if (store.photoStudentId() !== id) {
      return;
    }

    patchState(store, {
      photoUrl: URL.createObjectURL(blob),
      photoLoading: false,
      photoError: null
    });
  } catch (error) {
    if (store.photoStudentId() !== id) {
      return;
    }

    patchState(store, {
      photoUrl: null,
      photoLoading: false,
      photoError: apiError(error, 'Impossible de charger la photo.')
    });
  }
},

async uploadPhoto(id: number, file: File): Promise<boolean> {
  patchState(store, {
    photoSaving: true,
    photoError: null
  });

  try {
    const updated = await firstValueFrom(
      studentService.uploadStudentPhoto({ id, file })
    );

    patchState(store, {
      selectedStudent:
        store.selectedStudent()?.id === id
          ? updated
          : store.selectedStudent(),
      students: store.students().map(student =>
        student.id === id ? updated : student
      )
    });

    const previousUrl = store.photoUrl();
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }

    patchState(store, {
      photoUrl: null,
      photoStudentId: id,
      photoLoading: true
    });

    const blob = await firstValueFrom(
      studentService.getStudentPhoto({ id })
    );

    if (store.photoStudentId() === id) {
      patchState(store, {
        photoUrl: URL.createObjectURL(blob),
        photoLoading: false,
        photoSaving: false,
        photoError: null
      });
    }

    return true;
  } catch (error) {
    patchState(store, {
      photoSaving: false,
      photoLoading: false,
      photoError: apiError(error, "Impossible d'enregistrer la photo.")
    });
    return false;
  }
},

async deletePhoto(id: number): Promise<boolean> {
  patchState(store, {
    photoSaving: true,
    photoError: null
  });

  try {
    await firstValueFrom(
      studentService.deleteStudentPhoto({ id })
    );

    const previousUrl = store.photoUrl();
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }

   patchState(store, {
  photoUrl: null,
  photoStudentId: id,
  photoSaving: false,
  photoLoading: false,
  photoError: null
});

    return true;
  } catch (error) {
    patchState(store, {
      photoSaving: false,
      photoError: apiError(error, 'Impossible de supprimer la photo.')
    });
    return false;
  }
},


    async loadAllActiveStudents(force = false): Promise<StudentResponse[]> {
  if (!force && store.allActiveStudentsLoaded()) {
    return store.allActiveStudents();
  }

  patchState(store, {
    allActiveStudentsLoading: true,
    allActiveStudentsLoaded: false
  });

  try {
    const allStudents: StudentResponse[] = [];
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


    patchState(store, {
      allActiveStudents: allStudents,
      allActiveStudentsLoaded: true,
      allActiveStudentsLoading: false
    });

    return allStudents;
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
