
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { TeacherRequest, TeacherResponse } from 'src/app/core/api/generated';
import { TeacherStore } from './teacher.store';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TableModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <section class="space-y-6 p-4 md:p-6">
      <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Enseignants</h1>
          <p class="mt-1 text-sm text-slate-500">
            Gérez les enseignants de votre établissement.
          </p>
        </div>

        <p-button
          label="Ajouter un enseignant"
          icon="pi pi-plus"
          (onClick)="openCreate()"
        />
      </header>

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <div class="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 class="font-semibold text-slate-800">Liste des enseignants</h2>
            <p class="text-sm text-slate-500">
              {{ store.filteredTeachers().length }} enseignant(s)
            </p>
          </div>

          <input
            pInputText
            type="text"
            class="w-full sm:max-w-sm"
            placeholder="Rechercher un enseignant..."
            [value]="store.search()"
            (input)="onSearch($event)"
          />
        </div>

        @if (store.error()) {
          <div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {{ store.error() }}
            <button
              type="button"
              class="ml-2 underline"
              (click)="store.loadTeachers()"
            >
              Réessayer
            </button>
          </div>
        }

        <p-table
          [value]="store.filteredTeachers()"
          [loading]="store.loading()"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '40rem' }"
          responsiveLayout="scroll"
        >
          <ng-template #header>
            <tr>
              <th>Nom complet</th>
              <th>E-mail</th>
              <th class="w-24 text-right">Actions</th>
            </tr>
          </ng-template>

          <ng-template #body let-teacher>
            <tr>
              <td>
                <div class="font-medium text-slate-800">
                  {{ teacher.firstName }} {{ teacher.lastName }}
                </div>
              </td>
              <td>
                <span class="text-slate-600">
                  {{ teacher.email || 'Non renseigné' }}
                </span>
              </td>
              <td class="text-right">
                <p-button
                  icon="pi pi-pencil"
                  [text]="true"
                  [rounded]="true"
                  severity="secondary"
                  ariaLabel="Modifier l'enseignant"
                  (onClick)="openEdit(teacher)"
                />
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </section>

    <p-dialog
      [header]="editingTeacher ? 'Modifier un enseignant' : 'Nouvel enseignant'"
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="{ width: 'min(95vw, 32rem)' }"
      [closable]="!store.saving()"
      [draggable]="false"
      [resizable]="false"
    >
      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4 pt-2">
        <div class="flex flex-col gap-2">
          <label for="firstName" class="font-medium text-slate-700">
            Prénom <span class="text-red-500">*</span>
          </label>
          <input
            pInputText
            id="firstName"
            formControlName="firstName"
            class="w-full"
            autocomplete="given-name"
          />
          @if (form.controls.firstName.touched && form.controls.firstName.invalid) {
            <small class="text-red-600">Le prénom est obligatoire.</small>
          }
        </div>

        <div class="flex flex-col gap-2">
          <label for="lastName" class="font-medium text-slate-700">
            Nom <span class="text-red-500">*</span>
          </label>
          <input
            pInputText
            id="lastName"
            formControlName="lastName"
            class="w-full"
            autocomplete="family-name"
          />
          @if (form.controls.lastName.touched && form.controls.lastName.invalid) {
            <small class="text-red-600">Le nom est obligatoire.</small>
          }
        </div>

        <div class="flex flex-col gap-2">
          <label for="email" class="font-medium text-slate-700">E-mail</label>
          <input
            pInputText
            id="email"
            type="email"
            formControlName="email"
            class="w-full"
            autocomplete="email"
          />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <small class="text-red-600">Saisissez une adresse e-mail valide.</small>
          }
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
            [label]="editingTeacher ? 'Enregistrer' : 'Créer l’enseignant'"
            icon="pi pi-check"
            type="submit"
            [loading]="store.saving()"
          />
        </div>
      </form>
    </p-dialog>
  `
})
export class TeacherListComponent implements OnInit {
  readonly store = inject(TeacherStore);
  private readonly fb = inject(FormBuilder);

  dialogVisible = false;
  editingTeacher: TeacherResponse | null = null;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.email, Validators.maxLength(255)]]
  });

  ngOnInit(): void {
    void this.store.loadTeachers();
  }

  onSearch(event: Event): void {
    this.store.setSearch((event.target as HTMLInputElement).value);
  }

  openCreate(): void {
    this.editingTeacher = null;
    this.form.reset({
      firstName: '',
      lastName: '',
      email: ''
    });
    this.store.setSearch(this.store.search());
    this.dialogVisible = true;
  }

  openEdit(teacher: TeacherResponse): void {
    this.editingTeacher = teacher;
    this.form.reset({
      firstName: teacher.firstName ?? '',
      lastName: teacher.lastName ?? '',
      email: teacher.email ?? ''
    });
    this.dialogVisible = true;
  }

  closeDialog(): void {
    if (this.store.saving()) {
      return;
    }
    this.dialogVisible = false;
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    const request: TeacherRequest = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      ...(value.email.trim() ? { email: value.email.trim() } : {})
    };

    if (!request.firstName || !request.lastName) {
      this.form.markAllAsTouched();
      return;
    }

    let result: TeacherResponse | null;

    if (this.editingTeacher?.id != null) {
      result = await this.store.updateTeacher(this.editingTeacher.id, request);
    } else {
      result = await this.store.createTeacher(request);
    }

    if (result) {
      this.dialogVisible = false;
    }
  }
}
