
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { GroupRequest, GroupResponse } from 'src/app/core/api/generated';
import { GroupStore } from './group.store';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <section class="space-y-6 p-4 md:p-6">
      <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Classes</h1>
          <p class="mt-1 text-sm text-slate-500">
            Gérez les classes, leurs couleurs et les enseignants référents.
          </p>
        </div>

        <p-button
          label="Nouvelle classe"
          icon="pi pi-plus"
          (onClick)="openCreate()"
        />
      </header>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-slate-500">
            {{ store.filteredGroups().length }} classe(s)
          </p>
        </div>

        <input
          pInputText
          class="w-full sm:max-w-sm"
          placeholder="Rechercher une classe ou un enseignant..."
          [value]="store.search()"
          (input)="onSearch($event)"
        />
      </div>

      @if (store.error()) {
        <div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ store.error() }}
          <button class="ml-2 underline" (click)="reload()">Réessayer</button>
        </div>
      }

      @if (store.loading()) {
        <div class="py-12 text-center text-slate-500">
          Chargement des classes...
        </div>
      } @else if (store.filteredGroups().length === 0) {
        <div class="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <i class="pi pi-building text-3xl text-slate-400"></i>
          <h2 class="mt-3 font-semibold text-slate-800">Aucune classe trouvée</h2>
          <p class="mt-1 text-sm text-slate-500">
            Créez une classe ou modifiez votre recherche.
          </p>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          @for (group of store.filteredGroups(); track group.id) {
            
<article
  class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
>
  <!-- Bandeau de couleur de la classe -->
  <div
    class="h-2"
    [style.background-color]="group.color || '#2563EB'"
  ></div>

  <div class="space-y-4 p-5">
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <!-- Icône de la classe -->
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          [style.background-color]="(group.color || '#2563EB') + '20'"
          [style.color]="group.color || '#2563EB'"
        >
          <i class="pi pi-graduation-cap text-xl"></i>
        </div>

        <!-- Nom de la classe -->
        <div class="min-w-0">
          <h2 class="font-semibold text-slate-900">
            {{ group.name || 'Classe sans nom' }}
          </h2>
        </div>
      </div>

      <p-button
        icon="pi pi-pencil"
        [text]="true"
        [rounded]="true"
        severity="secondary"
        ariaLabel="Modifier la classe"
        (onClick)="openEdit(group)"
      />
    </div>

    <!-- Enseignant référent -->
    <div class="rounded-lg bg-slate-50 p-3">
      <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
        Enseignant référent
      </p>

      <p class="mt-1 text-sm text-slate-800">
        {{ group.teacherName || 'Aucun enseignant affecté' }}
      </p>
    </div>

    <!-- Action -->
    <div class="flex justify-end">
      <button
        type="button"
        class="text-sm font-medium text-blue-600 hover:text-blue-800"
        (click)="openEdit(group)"
      >
        Modifier
      </button>
    </div>
  </div>
</article>

          }
        </div>
      }
    </section>

    <p-dialog
      [header]="editingGroup ? 'Modifier la classe' : 'Nouvelle classe'"
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="{ width: 'min(95vw, 34rem)' }"
      [draggable]="false"
      [resizable]="false"
      [closable]="!store.saving()"
    >
      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-5 pt-2">
        <div class="flex flex-col gap-2">
          <label for="name" class="font-medium text-slate-700">
            Nom de la classe *
          </label>
          <input
            pInputText
            id="name"
            formControlName="name"
            class="w-full"
            placeholder="Ex. Classe 1"
          />
          @if (form.controls.name.touched && form.controls.name.invalid) {
            <small class="text-red-600">Le nom de la classe est obligatoire.</small>
          }
        </div>

        <div class="flex flex-col gap-2">
          <label for="color" class="font-medium text-slate-700">Couleur</label>
          <div class="flex items-center gap-3">
            <input
              id="color"
              type="color"
              formControlName="color"
              class="h-11 w-14 cursor-pointer rounded border border-slate-200 bg-white p-1"
            />
            <input
              pInputText
              formControlName="color"
              class="flex-1"
              aria-label="Code hexadécimal de la couleur"
            />
          </div>

          <div class="flex flex-wrap gap-2 pt-1">
            @for (color of palette; track color.value) {
              <button
                type="button"
                class="h-8 w-8 rounded-full border-2 transition hover:scale-110"
                [style.background-color]="color.value"
                [style.border-color]="form.controls.color.value === color.value ? '#0F172A' : 'transparent'"
                [attr.aria-label]="color.label"
                [title]="color.label"
                (click)="form.controls.color.setValue(color.value)"
              ></button>
            }
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label for="teacherId" class="font-medium text-slate-700">
            Enseignant référent
          </label>
          <p-select
            inputId="teacherId"
            formControlName="teacherId"
            [options]="store.teachers()"
            optionLabel="firstName"
            optionValue="id"
            [showClear]="true"
            placeholder="Aucun enseignant"
            appendTo="body"

            styleClass="w-full"
          >
            <ng-template #selectedItem let-teacher>
              @if (teacher) {
                {{ teacher.firstName }} {{ teacher.lastName }}
              }
            </ng-template>

            <ng-template #item let-teacher>
              {{ teacher.firstName }} {{ teacher.lastName }}
            </ng-template>
          </p-select>
        </div>

        @if (store.error()) {
          <div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {{ store.error() }}
          </div>
        }

        <div class="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <p-button
            label="Annuler"
            severity="secondary"
            [outlined]="true"
            [disabled]="store.saving()"
            (onClick)="closeDialog()"
          />
          <p-button
            [label]="editingGroup ? 'Enregistrer' : 'Créer la classe'"
            icon="pi pi-check"
            type="submit"
            [loading]="store.saving()"
          />
        </div>
      </form>
    </p-dialog>
  `
})
export class GroupListComponent implements OnInit {
  readonly store = inject(GroupStore);
  private readonly fb = inject(FormBuilder);

  dialogVisible = false;
  editingGroup: GroupResponse | null = null;

  readonly palette = [
    { label: 'Bleu', value: '#2563EB' },
    { label: 'Vert', value: '#059669' },
    { label: 'Orange', value: '#D97706' },
    { label: 'Violet', value: '#7C3AED' },
    { label: 'Rose', value: '#DB2777' },
    { label: 'Rouge', value: '#DC2626' },
    { label: 'Turquoise', value: '#0891B2' },
    { label: 'Gris', value: '#475569' }
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    color: ['#2563EB', [
      Validators.required,
      Validators.pattern(/^#[0-9A-Fa-f]{6}$/)
    ]],
    teacherId: this.fb.control<number | null>(null)
  });

  ngOnInit(): void {
    void this.reload();
  }

  async reload(): Promise<void> {
    await Promise.all([
      this.store.loadGroups(),
      this.store.loadTeachers()
    ]);
  }

  onSearch(event: Event): void {
    this.store.setSearch((event.target as HTMLInputElement).value);
  }

  openCreate(): void {
    this.editingGroup = null;
    this.form.reset({
      name: '',
      color: '#2563EB',
      teacherId: null
    });
    this.dialogVisible = true;
  }

  openEdit(group: GroupResponse): void {
    this.editingGroup = group;

    this.form.reset({
      name: group.name ?? '',
      color: group.color ?? '#2563EB',
      teacherId: group.teacherId ?? null
    });

    this.dialogVisible = true;
  }

  closeDialog(): void {
    if (!this.store.saving()) {
      this.dialogVisible = false;
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    const request: GroupRequest = {
      name: value.name.trim(),
      color: value.color,
      ...(value.teacherId != null ? { teacherId: value.teacherId } : {})
    };

    if (!request.name) {
      this.form.controls.name.markAsTouched();
      return;
    }

    let result: GroupResponse | null;

    if (this.editingGroup?.id != null) {
      result = await this.store.updateGroup(this.editingGroup.id, request);
    } else {
      result = await this.store.createGroup(request);
    }

    if (result) {
      this.dialogVisible = false;
    }
  }
}
