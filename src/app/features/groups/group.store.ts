
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

import {
  GroupRequest,
  GroupResponse,
  TeacherResponse
} from 'src/app/core/api/generated';
import { GroupsService } from 'src/app/core/api/generated/api/groups.service';
import { TeachersService } from 'src/app/core/api/generated/api/teachers.service';

interface GroupState {
  groups: GroupResponse[];
  teachers: TeacherResponse[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  search: string;
}

const initialState: GroupState = {
  groups: [],
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

export const GroupStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed(({ groups, search }) => ({
    filteredGroups: computed(() => {
      const term = search().trim().toLocaleLowerCase('fr');

      if (!term) {
        return groups();
      }

      return groups().filter(group =>
        [
          group.name,
          group.teacherName
        ].some(value =>
          (value ?? '').toLocaleLowerCase('fr').includes(term)
        )
      );
    }),

    groupCount: computed(() => groups().length)
  })),

  withMethods((
    store,
    groupsApi = inject(GroupsService),
    teachersApi = inject(TeachersService)
  ) => ({
    setSearch(search: string): void {
      patchState(store, { search });
    },

    async loadGroups(): Promise<void> {
      patchState(store, { loading: true, error: null });

      try {
        const groups = await firstValueFrom(
          groupsApi.findAll2()
        );

        patchState(store, {
          groups: [...groups].sort((a, b) =>
            (a.name ?? '').localeCompare(b.name ?? '', 'fr')
          ),
          loading: false
        });
      } catch (error) {
        patchState(store, {
          groups: [],
          loading: false,
          error: apiError(error, 'Impossible de charger les classes.')
        });
      }
    },

    async loadTeachers(): Promise<void> {
      try {
        const teachers = await firstValueFrom(
          teachersApi.findAll()
        );

        patchState(store, { teachers });
      } catch (error) {
        patchState(store, {
          error: apiError(error, 'Impossible de charger les enseignants.')
        });
      }
    },

    async createGroup(
      request: GroupRequest
    ): Promise<GroupResponse | null> {
      patchState(store, { saving: true, error: null });

      try {
        const created = await firstValueFrom(
          groupsApi.create6({ groupRequest: request })
        );

        patchState(store, {
          groups: [...store.groups(), created].sort((a, b) =>
            (a.name ?? '').localeCompare(b.name ?? '', 'fr')
          ),
          saving: false
        });

        return created;
      } catch (error) {
        patchState(store, {
          saving: false,
          error: apiError(error, 'Impossible de créer cette classe.')
        });

        return null;
      }
    },

    async updateGroup(
      id: number,
      request: GroupRequest
    ): Promise<GroupResponse | null> {
      patchState(store, { saving: true, error: null });

      try {
        const updated = await firstValueFrom(
          groupsApi.update3({ id, groupRequest: request })
        );

        patchState(store, {
          groups: store.groups()
            .map(group => group.id === id ? updated : group)
            .sort((a, b) =>
              (a.name ?? '').localeCompare(b.name ?? '', 'fr')
            ),
          saving: false
        });

        return updated;
      } catch (error) {
        patchState(store, {
          saving: false,
          error: apiError(error, 'Impossible de modifier cette classe.')
        });

        return null;
      }
    }
  }))
);
