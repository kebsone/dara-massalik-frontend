import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import {  StudentRequest, StudentStore } from './student.store';
import { StudentResponse } from 'src/app/core/api/generated';

@Component({
  selector: 'dm-students',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, ReactiveFormsModule, ButtonModule, CardModule, DialogModule, InputTextModule, SelectModule, TagModule, PaginatorModule],
  template: `
    <div class="page-enter space-y-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p class="text-sm font-medium text-[var(--brand-primary)]">École coranique</p>
          <h1 class="text-2xl font-bold text-slate-900">Élèves</h1>
          <p class="mt-1 text-sm text-slate-500">  Retrouvez et gérez facilement les élèves de votre école coranique.
</p>
        </div>
        <p-button label="Ajouter un élève" icon="pi pi-plus" (onClick)="openCreateDialog()" />
      </div>

      @if (store.error(); as error) {
        <div role="alert" class="flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center">
          <span><i class="pi pi-exclamation-circle mr-2"></i>{{ error }}</span>
          <p-button label="Réessayer" icon="pi pi-refresh" severity="danger" [outlined]="true" (onClick)="reload()" />
        </div>
      }

      <p-card styleClass="border border-[var(--brand-border)] shadow-sm">
        <div class="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem_auto]">
          <div class="relative">
            <input pInputText [value]="search()" (input)="search.set($any($event.target).value)" (keydown.enter)="applyFilters()" placeholder="Nom, prénom, parent ou téléphone..." class="w-full pl-10" aria-label="Rechercher un élève" />
          </div>
          <p-select [options]="groupFilterOptions()" [ngModel]="groupFilter()" (ngModelChange)="onGroupFilterChange($event)" [ngModelOptions]="{standalone: true}" optionLabel="label" optionValue="value" placeholder="Toutes les classes" styleClass="w-full" />
          <p-button label="Rechercher" icon="pi pi-search" (onClick)="applyFilters()" />
        </div>

        @if (store.groupsError(); as groupsError) {
          <div class="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{{ groupsError }}</div>
        }

        <div class="mb-4 flex flex-wrap gap-3 text-sm text-slate-500">
          <span><strong class="text-slate-800">{{ store.totalElements() }}</strong> élève(s)</span>
          <span><strong class="text-slate-800">{{ store.activeOnPage() }}</strong> actif(s) sur cette page</span>
        </div>

        @if (store.loading()) {
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            @for (placeholder of [1, 2, 3]; track placeholder) {
              <div class="animate-pulse rounded-xl border border-slate-200 p-5">
                <div class="mb-4 flex items-center gap-3">
                  <div class="size-12 rounded-full bg-slate-100"></div>
                  <div class="flex-1 space-y-2"><div class="h-4 w-2/3 rounded bg-slate-100"></div><div class="h-3 w-1/3 rounded bg-slate-100"></div></div>
                </div>
                <div class="h-3 w-1/2 rounded bg-slate-100"></div>
              </div>
            }
          </div>
        } @else if (store.students().length === 0) {
          <div class="rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center">
            <i class="pi pi-users text-3xl text-slate-300"></i>
            <p class="mt-3 font-semibold text-slate-700">Aucun élève trouvé</p>
            <p class="mt-1 text-sm text-slate-500">Essayez de modifier votre recherche ou vos filtres.</p>
          </div>
        } @else {
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            @for (student of store.students(); track student.id) {
              <article class="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--brand-border)] hover:shadow-md">
                <div class="mb-4 flex items-start justify-between gap-3">
                  <a [routerLink]="['/students', student.id]" class="flex min-w-0 items-center gap-3">
                    <span class="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-[var(--brand-primary)] ring-1 ring-emerald-100">
                      {{ student.firstName?.charAt(0) }}{{ student.lastName?.charAt(0) }}
                    </span>
                    <span class="min-w-0">
                      <span class="block truncate font-semibold text-slate-900 group-hover:text-[var(--brand-primary)]">{{ student.firstName }} {{ student.lastName }}</span>
                      <span class="mt-1 block text-xs text-slate-500">{{ student.birthDate ? (student.birthDate | date:'dd/MM/yyyy') : 'Date de naissance non renseignée' }}</span>
                    </span>
                  </a>
                  <p-tag [value]="student.active ? 'Actif' : 'Inactif'" [severity]="student.active ? 'success' : 'secondary'" />
                </div>

                <div class="mb-4 flex flex-wrap items-center gap-2">
                  @if (student.groupName) {
                    <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium" [style.background-color]="(student.groupColor || '#2563EB') + '20'" [style.color]="student.groupColor || '#2563EB'">
                      <span class="size-2 rounded-full" [style.background-color]="student.groupColor || '#2563EB'"></span>
                      {{ student.groupName }}
                    </span>
                  } @else {
                    <span class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">Sans classe</span>
                  }
                </div>

                <div class="space-y-2 border-t border-slate-100 pt-3 text-sm">
                  <div class="flex items-start gap-2 text-slate-600">
                    <i class="pi pi-users mt-0.5 text-slate-400"></i>
                    <span class="min-w-0">{{ student.parentName || 'Responsable non renseigné' }}</span>
                  </div>
                  @if (student.parentPhone || student.phone) {
                    <div class="flex items-center gap-2 text-slate-500">
                      <i class="pi pi-phone text-slate-400"></i>
                      <span>{{ student.parentPhone || student.phone }}</span>
                    </div>
                  }
                </div>

                <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <a [routerLink]="['/students', student.id]" class="inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-primary)] hover:underline">
                    Voir la fiche <i class="pi pi-arrow-right text-xs"></i>
                  </a>
                  <div class="flex gap-1">
                    <p-button icon="pi pi-pencil" severity="secondary" [text]="true" [rounded]="true" (onClick)="openEditDialog(student)" aria-label="Modifier l’élève" />
                    <p-button icon="pi pi-user-minus" severity="danger" [text]="true" [rounded]="true" (onClick)="askDeactivate(student)" aria-label="Désactiver l’élève" />
                  </div>
                </div>
              </article>
            }
          </div>
        }

        <p-paginator
          [first]="store.page() * store.pageSize()"
          [rows]="store.pageSize()"
          [totalRecords]="store.totalElements()"
          [rowsPerPageOptions]="[10, 20, 50]"
          (onPageChange)="onPageChange($event)"
          styleClass="mt-4"
        />
      </p-card>

      <p-dialog [header]="editingStudent() ? 'Modifier un élève' : 'Ajouter un élève'" [visible]="dialogVisible()" (visibleChange)="dialogVisible.set($event)" [modal]="true" [style]="{ width: 'min(48rem, 95vw)' }" [draggable]="false" [resizable]="false">
        <form [formGroup]="form" (ngSubmit)="saveStudent()" class="grid gap-4 pt-2 sm:grid-cols-2">
          <div><label for="student-first-name" class="mb-2 block text-sm font-medium">Prénom *</label><input id="student-first-name" pInputText formControlName="firstName" class="w-full" autocomplete="given-name" /></div>
          <div><label for="student-last-name" class="mb-2 block text-sm font-medium">Nom *</label><input id="student-last-name" pInputText formControlName="lastName" class="w-full" autocomplete="family-name" /></div>
          <div><label for="student-birth-date" class="mb-2 block text-sm font-medium">Date de naissance</label><input id="student-birth-date" pInputText type="date" formControlName="birthDate" class="w-full" /></div>
          <div><label for="student-phone" class="mb-2 block text-sm font-medium">Téléphone de l’élève</label><input id="student-phone" pInputText formControlName="phone" class="w-full" /></div>
          <div><label for="student-parent-name" class="mb-2 block text-sm font-medium">Parent / responsable</label><input id="student-parent-name" pInputText formControlName="parentName" class="w-full" /></div>
          <div><label for="student-parent-phone" class="mb-2 block text-sm font-medium">Téléphone du responsable</label><input id="student-parent-phone" pInputText formControlName="parentPhone" class="w-full" /></div>
          <div class="sm:col-span-2"><label for="student-group" class="mb-2 block text-sm font-medium">Groupe</label><p-select inputId="student-group" [options]="formGroupOptions()" optionLabel="label" optionValue="value" formControlName="groupId" placeholder="Sans classe" class="w-full" appendTo="body"/></div>
          @if (store.error(); as error) {
            <div class="sm:col-span-2 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{{ error }}</div>
          }
          <div class="flex justify-end gap-2 pt-2 sm:col-span-2">
            <p-button type="button" label="Annuler" severity="secondary" [text]="true" (onClick)="dialogVisible.set(false)" />
            <p-button type="submit" [label]="editingStudent() ? 'Enregistrer les modifications' : 'Créer l’élève'" icon="pi pi-check" [loading]="store.saving()" [disabled]="form.invalid || store.saving()" />
          </div>
        </form>
      </p-dialog>

      <p-dialog header="Désactiver cet élève ?" [visible]="deactivationDialogVisible()" (visibleChange)="deactivationDialogVisible.set($event)" [modal]="true" [style]="{ width: 'min(28rem, 95vw)' }" [draggable]="false" [resizable]="false">
        <p class="text-sm leading-6 text-slate-600">L’élève ne sera plus affiché dans la liste active. Son historique sera conservé.</p>
        <div class="mt-6 flex justify-end gap-2">
          <p-button label="Annuler" severity="secondary" [text]="true" (onClick)="deactivationDialogVisible.set(false)" />
          <p-button label="Désactiver" severity="danger" icon="pi pi-user-minus" [loading]="store.saving()" (onClick)="confirmDeactivate()" />
        </div>
      </p-dialog>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentsComponent implements OnInit {
  readonly store = inject(StudentStore);
  readonly search = signal('');
  readonly groupFilter = signal<number | null>(null);
  readonly dialogVisible = signal(false);
  readonly deactivationDialogVisible = signal(false);
  readonly editingStudent = signal<StudentResponse | null>(null);
  readonly pendingDeactivation = signal<StudentResponse | null>(null);

  readonly groupFilterOptions = computed(() => [
    { label: 'Toutes les classes', value: null as number | null },
    ...this.store.groups().map(group => ({ label: group.name, value: group.id }))
  ]);

  readonly formGroupOptions = computed(() => [
    { label: 'Sans classe', value: null as number | null },
    ...this.store.groups().map(group => ({ label: group.name, value: group.id }))
  ]);

  readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80)] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80)] }),
    birthDate: new FormControl<string | null>(null),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(30)] }),
    parentName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(160)] }),
    parentPhone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(30)] }),
    groupId: new FormControl<number | null>(null)
  });

  ngOnInit(): void {
    void this.store.loadGroups();
    void this.store.loadStudents('', null, 0, 10);
  }

  applyFilters(): void {
    void this.store.loadStudents(this.search().trim(), this.groupFilter(), 0, this.store.pageSize());
  }

  onGroupFilterChange(value: number | null): void {
    this.groupFilter.set(value);
    this.applyFilters();
  }

  onPageChange(event: PaginatorState): void {
    const size = event.rows ?? this.store.pageSize();
    const page = event.page ?? 0;
    void this.store.loadStudents(this.search().trim(), this.groupFilter(), page, size);
  }

  reload(): void {
    void this.store.loadStudents(this.search().trim(), this.groupFilter(), this.store.page(), this.store.pageSize());
  }

  openCreateDialog(): void {
    this.editingStudent.set(null);
    this.form.reset({ firstName: '', lastName: '', birthDate: null, phone: '', parentName: '', parentPhone: '', groupId: null });
    this.dialogVisible.set(true);
  }

  openEditDialog(student: StudentResponse): void {
    this.editingStudent.set(student);
    this.form.reset({
      firstName: student.firstName,
      lastName: student.lastName,
      birthDate: student.birthDate,
      phone: student.phone ?? '',
      parentName: student.parentName ?? '',
      parentPhone: student.parentPhone ?? '',
      groupId: student.groupId
    });
    this.dialogVisible.set(true);
  }

  async saveStudent(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const request: StudentRequest = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      birthDate: value.birthDate || null,
      phone: value.phone.trim() || null,
      parentName: value.parentName.trim() || null,
      parentPhone: value.parentPhone.trim() || null,
      groupId: value.groupId ?? null
    };

    const editing = this.editingStudent();
    const result = editing
      ? await this.store.updateStudent(editing.id as number, request)
      : await this.store.createStudent(request);

    if (!result) return;
    this.dialogVisible.set(false);
    const page = editing ? this.store.page() : 0;
    await this.store.loadStudents(this.search().trim(), this.groupFilter(), page, this.store.pageSize());
  }

  askDeactivate(student: StudentResponse  ): void {
    this.pendingDeactivation.set(student);
    this.deactivationDialogVisible.set(true);
  }

  async confirmDeactivate(): Promise<void> {
    const student = this.pendingDeactivation();
    if (!student) return;
    const succeeded = await this.store.deactivateStudent(student.id as number);
    if (!succeeded) return;
    this.deactivationDialogVisible.set(false);
    this.pendingDeactivation.set(null);
    const nextPage = this.store.students().length === 1 && this.store.page() > 0 ? this.store.page() - 1 : this.store.page();
    await this.store.loadStudents(this.search().trim(), this.groupFilter(), nextPage, this.store.pageSize());
  }
}
