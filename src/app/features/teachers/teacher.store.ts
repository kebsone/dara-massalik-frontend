
import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

import { TeacherRequest, TeacherResponse } from 'src/app/core/api/generated';
import { TeachersService } from 'src/app/core/api/generated/api/teachers.service';

interface TeacherState {
  teachers: TeacherResponse[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  search: string;
}

const initialState: TeacherState = {
  teachers: [],
  loading: false,
  saving: false,
  error: null,
  search: ''
};

function apiError(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Impossible de joindre le serveur. Vérifiez que Spring Boot est démarré.';
    }
    if (error.status === 401) {
      return 'Votre session a expiré. Reconnectez-vous.';
    }
    if (error.status === 403) {
      return 'Vous n’avez pas la permission nécessaire pour cette action.';
    }

    const message = error.error?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export const TeacherStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed(({ teachers, search }) => ({
    filteredTeachers: computed(() => {
      const term = search().trim().toLocaleLowerCase('fr');

      if (!term) {
        return teachers();
      }

      return teachers().filter(teacher =>
        [
          teacher.firstName,
          teacher.lastName,
          teacher.email
        ]
          .some(value =>
            (value ?? '').toLocaleLowerCase('fr').includes(term)
          )
      );
    }),

    teacherCount: computed(() => teachers().length)
  })),

  withMethods((store, teachersApi = inject(TeachersService)) => ({
    setSearch(search: string): void {
      patchState(store, { search });
    },

    async loadTeachers(): Promise<void> {
      patchState(store, {
        loading: true,
        error: null
      });

      try {
        const teachers = await firstValueFrom(
          teachersApi.findAll()
        );

        const sortedTeachers = [...teachers].sort((a, b) =>
          (a.lastName ?? '').localeCompare(b.lastName ?? '', 'fr') ||
          (a.firstName ?? '').localeCompare(b.firstName ?? '', 'fr')
        );

        patchState(store, {
          teachers: sortedTeachers,
          loading: false
        });
      } catch (error) {
        patchState(store, {
          teachers: [],
          loading: false,
          error: apiError(
            error,
            'Impossible de charger les enseignants.'
          )
        });
      }
    },

    async createTeacher(
      request: TeacherRequest
    ): Promise<TeacherResponse | null> {
      patchState(store, {
        saving: true,
        error: null
      });

      try {
        const created = await firstValueFrom(
          teachersApi.create({ teacherRequest: request })
        );

        patchState(store, {
          teachers: [...store.teachers(), created].sort((a, b) =>
            (a.lastName ?? '').localeCompare(b.lastName ?? '', 'fr') ||
            (a.firstName ?? '').localeCompare(b.firstName ?? '', 'fr')
          ),
          saving: false
        });

        return created;
      } catch (error) {
        patchState(store, {
          saving: false,
          error: apiError(
            error,
            'Impossible de créer cet enseignant.'
          )
        });

        return null;
      }
    },

    async updateTeacher(
      id: number,
      request: TeacherRequest
    ): Promise<TeacherResponse | null> {
      patchState(store, {
        saving: true,
        error: null
      });

      try {
        const updated = await firstValueFrom(
          teachersApi.update({
            id,
            teacherRequest: request
          })
        );

        const teachers = store.teachers().map(teacher =>
          teacher.id === id ? updated : teacher
        );

        teachers.sort((a, b) =>
          (a.lastName ?? '').localeCompare(b.lastName ?? '', 'fr') ||
          (a.firstName ?? '').localeCompare(b.firstName ?? '', 'fr')
        );

        patchState(store, {
          teachers,
          saving: false
        });

        return updated;
      } catch (error) {
        patchState(store, {
          saving: false,
          error: apiError(
            error,
            'Impossible de modifier cet enseignant.'
          )
        });

        return null;
      }
    }
  }))
);
