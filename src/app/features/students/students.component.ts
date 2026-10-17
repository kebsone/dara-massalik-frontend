import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { Student, StudentRequest, StudentStore } from './student.store';

@Component({
  selector: 'dm-students',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, ReactiveFormsModule, ButtonModule, CardModule, DialogModule, InputTextModule, SelectModule, TableModule, TagModule, PaginatorModule],
  template: `
    <div class="page-enter space-y-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p class="text-sm font-medium text-[var(--brand-primary)]">École coranique</p>
          <h1 class="text-2xl font-bold text-slate-900">Élèves</h1>
          <p class="mt-1 text-sm text-slate-500">Les dossiers sont maintenant chargés depuis la base de données.</p>
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
            <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input pInputText [value]="search()" (input)="search.set($any($event.target).value)" (keydown.enter)="applyFilters()" placeholder="Nom, prénom, parent ou téléphone..." class="w-full pl-10" aria-label="Rechercher un élève" />
          </div>
          <p-select [options]="groupFilterOptions()" [ngModel]="groupFilter()" (ngModelChange)="onGroupFilterChange($event)" [ngModelOptions]="{standalone: true}" optionLabel="label" optionValue="value" placeholder="Tous les groupes" styleClass="w-full" />
          <p-button label="Rechercher" icon="pi pi-search" (onClick)="applyFilters()" />
        </div>

        @if (store.groupsError(); as groupsError) {
          <div class="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{{ groupsError }}</div>
        }

        <div class="mb-4 flex flex-wrap gap-3 text-sm text-slate-500">
          <span><strong class="text-slate-800">{{ store.totalElements() }}</strong> élève(s)</span>
          <span><strong class="text-slate-800">{{ store.activeOnPage() }}</strong> actif(s) sur cette page</span>
        </div>

        <p-table [value]="store.students()" [loading]="store.loading()" dataKey="id" responsiveLayout="scroll" styleClass="text-sm">
          <ng-template #header>
            <tr><th>Élève</th><th>Groupe</th><th>Date de naissance</th><th>Parent / responsable</th><th>Statut</th><th class="text-right">Actions</th></tr>
          </ng-template>
          <ng-template #body let-student>
            <tr>
              <td>
                <a [routerLink]="['/students', student.id]" class="flex items-center gap-3 font-semibold text-slate-800 hover:text-[var(--brand-primary)]">
                  <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm text-[var(--brand-primary)]">{{ student.firstName.charAt(0) }}{{ student.lastName.charAt(0) }}</span>
                  <span>{{ student.firstName }} {{ student.lastName }}</span>
                </a>
              </td>
              <td class="px-4 py-3">
  @if (student.groupColor && student.groupName) {
    <span
      class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
      [style.background-color]="(student.groupColor || '#2563EB') + '20'"
      [style.color]="student.groupColor || '#2563EB'"
    >
      <span
        class="h-2 w-2 rounded-full"
        [style.background-color]="student.groupColor || '#2563EB'"
      ></span>

      {{ student.groupName }}
    </span>
  } @else {
    <span class="text-sm text-slate-400">
      Non affecté
    </span>
  }
</td>
              <td>{{ student.birthDate ? (student.birthDate | date:'dd/MM/yyyy') : '—' }}</td>
              <td><div>{{ student.parentName || '—' }}</div><div class="text-xs text-slate-400">{{ student.parentPhone || student.phone || '' }}</div></td>
              <td><p-tag [value]="student.active ? 'Actif' : 'Inactif'" [severity]="student.active ? 'success' : 'secondary'" /></td>
              <td>
                <div class="flex justify-end gap-1">
                  <p-button icon="pi pi-pencil" severity="secondary" [text]="true" [rounded]="true" (onClick)="openEditDialog(student)" aria-label="Modifier l’élève" />
                  <p-button icon="pi pi-user-minus" severity="danger" [text]="true" [rounded]="true" (onClick)="askDeactivate(student)" aria-label="Désactiver l’élève" />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr><td colspan="6" class="py-10 text-center text-slate-500">{{ store.loading() ? 'Chargement des élèves…' : 'Aucun élève trouvé.' }}</td></tr>
          </ng-template>
        </p-table>

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
          <div class="sm:col-span-2"><label for="student-group" class="mb-2 block text-sm font-medium">Groupe</label><p-select inputId="student-group" [options]="formGroupOptions()" optionLabel="label" optionValue="value" formControlName="groupId" placeholder="Sans groupe" class="w-full"  scroll
           appendTo="body"/></div>
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
  readonly editingStudent = signal<Student | null>(null);
  readonly pendingDeactivation = signal<Student | null>(null);

  readonly groupFilterOptions = computed(() => [
    { label: 'Tous les groupes', value: null as number | null },
    ...this.store.groups().map(group => ({ label: group.name, value: group.id }))
  ]);

  readonly formGroupOptions = computed(() => [
    { label: 'Sans groupe', value: null as number | null },
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

  openEditDialog(student: Student): void {
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
      ? await this.store.updateStudent(editing.id, request)
      : await this.store.createStudent(request);

    if (!result) return;
    this.dialogVisible.set(false);
    const page = editing ? this.store.page() : 0;
    await this.store.loadStudents(this.search().trim(), this.groupFilter(), page, this.store.pageSize());
  }

  askDeactivate(student: Student): void {
    this.pendingDeactivation.set(student);
    this.deactivationDialogVisible.set(true);
  }

  async confirmDeactivate(): Promise<void> {
    const student = this.pendingDeactivation();
    if (!student) return;
    const succeeded = await this.store.deactivateStudent(student.id);
    if (!succeeded) return;
    this.deactivationDialogVisible.set(false);
    this.pendingDeactivation.set(null);
    const nextPage = this.store.students().length === 1 && this.store.page() > 0 ? this.store.page() - 1 : this.store.page();
    await this.store.loadStudents(this.search().trim(), this.groupFilter(), nextPage, this.store.pageSize());
  }
}
