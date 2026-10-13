import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ProfileApiService, Address, UserProfile, AddressRequest } from '../../core/profile/profile-api.service';
import { AuthStore } from '../../core/auth/auth.store';
import { UserRole } from '../../core/auth/auth.models';

@Component({
  selector: 'dm-profile',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, CardModule, TagModule, DialogModule],
  template: `
    <div class="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Mon profil</h1>
        <p class="mt-1 text-slate-500">Vos informations personnelles et vos adresses de livraison.</p>
      </div>

      <p-card header="Informations personnelles">
        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="grid gap-4 sm:grid-cols-2">
          <div><label class="mb-2 block text-sm font-medium">Prénom</label><input pInputText formControlName="firstName" class="w-full" /></div>
          <div><label class="mb-2 block text-sm font-medium">Nom</label><input pInputText formControlName="lastName" class="w-full" /></div>
          <div><label class="mb-2 block text-sm font-medium">Téléphone</label><input pInputText [value]="profile()?.phone ?? ''" disabled class="w-full" /></div>
          <div><label class="mb-2 block text-sm font-medium">E-mail</label><input pInputText formControlName="email" type="email" class="w-full" /></div>
          <div class="sm:col-span-2 flex items-center justify-between gap-4">
            <p-tag [value]="roleLabel()" severity="info" />
            <p-button type="submit" label="Enregistrer" icon="pi pi-check" [loading]="saving()" [disabled]="profileForm.invalid || saving()" />
          </div>
        </form>
      </p-card>

      <p-card>
        <ng-template pTemplate="header"><div class="flex items-center justify-between px-5 pt-5"><div><h2 class="text-lg font-semibold">Adresses de livraison</h2><p class="mt-1 text-sm text-slate-500">Elles pourront être utilisées pour vos futures commandes.</p></div><p-button label="Ajouter" icon="pi pi-plus" (onClick)="openNewAddress()" /></div></ng-template>
        <div class="space-y-3">
          @if (!addresses().length) {
            <div class="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Aucune adresse enregistrée.</div>
          }
          @for (address of addresses(); track address.id) {
            <div class="rounded-2xl border border-slate-200 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div class="min-w-0">
                <div class="flex items-center gap-2"><strong>{{ address.label || 'Adresse' }}</strong>@if (address.defaultAddress) { <p-tag value="Principale" severity="success" /> }</div>
                <div class="mt-2 text-sm text-slate-600">{{ address.firstName }} {{ address.lastName }}</div>
                <div class="text-sm text-slate-600">{{ address.addressLine1 }}@if (address.addressLine2) { <span>, {{ address.addressLine2 }}</span> }</div>
                <div class="text-sm text-slate-600">{{ address.postalCode }} {{ address.city }}, {{ address.country }}</div>
              </div>
              <div class="mt-3 flex shrink-0 gap-2 sm:mt-0"><p-button icon="pi pi-pencil" [text]="true" (onClick)="editAddress(address)" ariaLabel="Modifier" /><p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="removeAddress(address)" ariaLabel="Supprimer" /></div>
            </div>
          }
        </div>
      </p-card>
    </div>

    <p-dialog [(visible)]="addressDialog" [header]="editingAddress() ? 'Modifier l’adresse' : 'Ajouter une adresse'" [modal]="true" [style]="{ width: 'min(42rem, 92vw)' }">
      <form [formGroup]="addressForm" (ngSubmit)="saveAddress()" class="grid gap-4 pt-2 sm:grid-cols-2">
        <div class="sm:col-span-2"><label class="mb-2 block text-sm font-medium">Libellé</label><input pInputText formControlName="label" class="w-full" placeholder="Maison" /></div>
        <div><label class="mb-2 block text-sm font-medium">Prénom</label><input pInputText formControlName="firstName" class="w-full" /></div>
        <div><label class="mb-2 block text-sm font-medium">Nom</label><input pInputText formControlName="lastName" class="w-full" /></div>
        <div class="sm:col-span-2"><label class="mb-2 block text-sm font-medium">Adresse</label><input pInputText formControlName="addressLine1" class="w-full" /></div>
        <div class="sm:col-span-2"><label class="mb-2 block text-sm font-medium">Complément</label><input pInputText formControlName="addressLine2" class="w-full" /></div>
        <div><label class="mb-2 block text-sm font-medium">Code postal</label><input pInputText formControlName="postalCode" class="w-full" /></div>
        <div><label class="mb-2 block text-sm font-medium">Ville</label><input pInputText formControlName="city" class="w-full" /></div>
        <div><label class="mb-2 block text-sm font-medium">Pays</label><input pInputText formControlName="country" class="w-full" /></div>
        <label class="flex items-center gap-2 self-end text-sm"><input type="checkbox" formControlName="defaultAddress" /> Adresse principale</label>
        <div class="sm:col-span-2 flex justify-end gap-2 pt-2"><p-button type="button" label="Annuler" severity="secondary" [text]="true" (onClick)="addressDialog.set(false)" /><p-button type="submit" label="Enregistrer" icon="pi pi-check" [loading]="addressSaving()" [disabled]="addressForm.invalid || addressSaving()" /></div>
      </form>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {
  private readonly api = inject(ProfileApiService);
  readonly authStore = inject(AuthStore);

  readonly profile = signal<UserProfile | null>(null);
  readonly addresses = signal<Address[]>([]);
  readonly saving = signal(false);
  readonly addressSaving = signal(false);
  readonly addressDialog = signal(false);
  readonly editingAddress = signal<Address | null>(null);

  readonly profileForm = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] })
  });

  readonly addressForm = new FormGroup({
    label: new FormControl('', { nonNullable: true }),
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    addressLine1: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    addressLine2: new FormControl('', { nonNullable: true }),
    postalCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    country: new FormControl('France', { nonNullable: true, validators: [Validators.required] }),
    defaultAddress: new FormControl(false, { nonNullable: true })
  });

  constructor() {
    this.load();
  }

  roleLabel(): string {
    switch (this.profile()?.role ?? this.authStore.user()?.role) {
      case 'ADMIN': return 'Administrateur';
      case 'TEACHER': return 'Enseignant';
      case 'TREASURER': return 'Trésorier';
      default: return 'Membre';
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.saving.set(true);
    this.api.updateProfile({
      firstName: this.profileForm.controls.firstName.value,
      lastName: this.profileForm.controls.lastName.value,
      email: this.profileForm.controls.email.value || null
    }).subscribe({ next: user => { this.profile.set(user); this.authStore.setUser({ id: user.id, phone: user.phone, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role as UserRole, roles: this.authStore.roles().length ? this.authStore.roles() : [user.role as UserRole], permissions: this.authStore.permissions() }); this.saving.set(false); }, error: () => this.saving.set(false) });
  }

  openNewAddress(): void {
    this.editingAddress.set(null);
    this.addressForm.reset({ label: '', firstName: this.profile()?.firstName ?? '', lastName: this.profile()?.lastName ?? '', addressLine1: '', addressLine2: '', postalCode: '', city: '', country: 'France', defaultAddress: this.addresses().length === 0 });
    this.addressDialog.set(true);
  }

  editAddress(address: Address): void {
    this.editingAddress.set(address);
    this.addressForm.reset({ ...address, label: address.label ?? '', addressLine2: address.addressLine2 ?? '' });
    this.addressDialog.set(true);
  }

  saveAddress(): void {
    if (this.addressForm.invalid) return;
    const request = this.addressForm.getRawValue() as AddressRequest;
    this.addressSaving.set(true);
    const operation = this.editingAddress() ? this.api.updateAddress(this.editingAddress()!.id, request) : this.api.createAddress(request);
    operation.subscribe({ next: () => { this.addressSaving.set(false); this.addressDialog.set(false); this.loadAddresses(); }, error: () => this.addressSaving.set(false) });
  }

  removeAddress(address: Address): void {
    this.api.deleteAddress(address.id).subscribe({ next: () => this.loadAddresses() });
  }

  private load(): void {
    this.api.getProfile().subscribe(user => {
      this.profile.set(user);
      this.profileForm.reset({ firstName: user.firstName ?? '', lastName: user.lastName ?? '', email: user.email ?? '' });
    });
    this.loadAddresses();
  }

  private loadAddresses(): void {
    this.api.getAddresses().subscribe(addresses => this.addresses.set(addresses));
  }
}
