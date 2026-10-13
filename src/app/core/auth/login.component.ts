import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthStore } from './auth.store';
import { phoneNumberValidator } from './login.utils';

@Component({
  selector: 'dm-login',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, CheckboxModule, InputTextModule, PasswordModule],
  template: `
    <main class="min-h-screen bg-[var(--brand-bg)] px-4 py-8 sm:px-6">
      <div class="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <section class="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
          <div class="hidden bg-[var(--brand-primary-dark)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div class="mb-8 flex items-center gap-3">
                <div class="flex size-11 items-center justify-center rounded-xl bg-white/10 text-2xl">☪</div>
                <div>
                  <div class="text-lg font-semibold">Dara Massalik</div>
                  <div class="text-sm text-white/70">Gestion du Dahira</div>
                </div>
              </div>
              <h1 class="max-w-md text-4xl font-bold leading-tight">Gérez votre Dahira et accompagnez toutes ses activités.</h1>
              <p class="mt-5 max-w-md text-white/70">École coranique, boutique, commissions, activités et finances dans un espace unique et responsive.</p>
            </div>
            <div class="grid grid-cols-3 gap-3 text-center text-sm">
              <div class="rounded-2xl bg-white/10 p-4"><div class="text-2xl font-bold">87</div><div class="text-white/60">Membres</div></div>
              <div class="rounded-2xl bg-white/10 p-4"><div class="text-2xl font-bold">12</div><div class="text-white/60">Élèves</div></div>
              <div class="rounded-2xl bg-white/10 p-4"><div class="text-2xl font-bold">6</div><div class="text-white/60">Commissions</div></div>
            </div>
          </div>

          <div class="flex flex-col justify-center p-6 sm:p-10">
            <div class="mx-auto w-full max-w-md">
              <div class="mb-8 flex items-center gap-3 lg:hidden">
                <div class="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-xl text-white">☪</div>
                <div><div class="font-bold">Dara Massalik</div><div class="text-xs text-slate-500">Gestion du Dahira</div></div>
              </div>

              <div class="mb-6">
                <h2 class="text-3xl font-bold tracking-tight text-slate-900">Bienvenue</h2>
                <p class="mt-2 text-slate-500">Connectez-vous à votre espace.</p>
              </div>

              <div class="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                <button type="button" (click)="mode.set('otp')"
                  [class.bg-white]="mode() === 'otp'" [class.shadow-sm]="mode() === 'otp'"
                  class="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 transition">
                  <i class="pi pi-mobile mr-2"></i>Code SMS
                </button>
                <button type="button" (click)="mode.set('password')"
                  [class.bg-white]="mode() === 'password'" [class.shadow-sm]="mode() === 'password'"
                  class="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 transition">
                  <i class="pi pi-lock mr-2"></i>Mot de passe
                </button>
              </div>

              @if (mode() === 'otp') {
                @if (otpStep() === 'phone') {
                  <form [formGroup]="phoneForm" (ngSubmit)="requestOtp()" class="space-y-5">
                    <div>
                      <label for="phone" class="mb-2 block text-sm font-medium text-slate-700">Numéro de téléphone</label>
                      <input id="phone" pInputText formControlName="phone" type="tel" class="w-full" placeholder="+33 6 12 34 56 78" autocomplete="tel" />
                      <p class="mt-2 text-xs text-slate-500">Nous vous enverrons un code de vérification par SMS.</p>
                    </div>
                    @if (authStore.error()) {
                      <div class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ authStore.error() }}</div>
                    }
                    <p-button type="submit" label="Recevoir le code" icon="pi pi-arrow-right" iconPos="right" styleClass="w-full" [loading]="authStore.loading()" [disabled]="phoneForm.invalid || authStore.loading()" />
                    <div class="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-3 text-xs text-slate-600">
                      Votre numéro sert à retrouver ou créer votre compte.
                    </div>
                  </form>
                } @else {
                  <form [formGroup]="otpForm" (ngSubmit)="verifyOtp()" class="space-y-5">
                    <div class="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                      Un code a été envoyé au <strong>{{ phoneForm.controls.phone.value }}</strong>.
                      @if (!authStore.otpExistingUser()) { <div class="mt-1">C'est votre première connexion : nous allons créer votre compte.</div> }
                    </div>

                    @if (!authStore.otpExistingUser()) {
                      <div class="grid grid-cols-2 gap-3">
                        <div><label for="firstName" class="mb-2 block text-sm font-medium text-slate-700">Prénom</label><input id="firstName" pInputText formControlName="firstName" class="w-full" /></div>
                        <div><label for="lastName" class="mb-2 block text-sm font-medium text-slate-700">Nom</label><input id="lastName" pInputText formControlName="lastName" class="w-full" /></div>
                      </div>
                      <div><label for="emailOtp" class="mb-2 block text-sm font-medium text-slate-700">E-mail <span class="font-normal text-slate-400">(facultatif)</span></label><input id="emailOtp" pInputText formControlName="email" type="email" class="w-full" placeholder="vous@exemple.fr" /></div>
                    }

                    <div>
                      <label for="code" class="mb-2 block text-sm font-medium text-slate-700">Code de vérification</label>
                      <input id="code" pInputText formControlName="code" inputmode="numeric" maxlength="6" class="w-full text-center text-2xl tracking-[0.5em]" placeholder="••••••" autocomplete="one-time-code" />
                    </div>

                    <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-600"><p-checkbox formControlName="remember" [binary]="true" />Se souvenir de moi</label>

                    @if (authStore.otpDebugCode()) {
                      <div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                        Mode développement — code affiché par le backend : <strong>{{ authStore.otpDebugCode() }}</strong>
                      </div>
                    }

                    @if (authStore.error()) {
                      <div class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ authStore.error() }}</div>
                    }
{{otpForm.invalid }}
                    <p-button type="submit" label="Vérifier et se connecter" icon="pi pi-check" iconPos="right" styleClass="w-full" [loading]="authStore.loading()" [disabled]="otpForm.invalid || authStore.loading()" />
                    <div class="flex items-center justify-between text-sm"><button type="button" (click)="otpStep.set('phone'); authStore.clearOtp()" class="text-slate-500 hover:text-slate-800">Changer de numéro</button><button type="button" (click)="resendOtp()" class="font-medium text-[var(--brand-primary)]">Renvoyer le code</button></div>
                  </form>
                }
              } @else {
                <form [formGroup]="passwordForm" (ngSubmit)="loginWithPassword()" class="space-y-5">
                  <div><label for="email" class="mb-2 block text-sm font-medium text-slate-700">E-mail</label><input id="email" pInputText formControlName="email" type="email" class="w-full" placeholder="admin@daramassalik.local" autocomplete="email" /></div>
                  <div><label for="password" class="mb-2 block text-sm font-medium text-slate-700">Mot de passe</label><p-password inputId="password" formControlName="password" [feedback]="false" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full" placeholder="••••••••" autocomplete="current-password" /></div>
                  <div class="flex items-center justify-between gap-4 text-sm"><label class="flex cursor-pointer items-center gap-2 text-slate-600"><p-checkbox formControlName="remember" [binary]="true" />Se souvenir de moi</label><button type="button" class="font-medium text-[var(--brand-primary)]">Mot de passe oublié ?</button></div>
                  @if (authStore.error()) { <div class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ authStore.error() }}</div> }
                  <p-button type="submit" label="Se connecter" icon="pi pi-arrow-right" iconPos="right" styleClass="w-full" [loading]="authStore.loading()" [disabled]="passwordForm.invalid || authStore.loading()" />
                  <div class="rounded-xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-bg)] p-3 text-xs text-slate-600">Compte administrateur de démonstration : <strong>admin&#64;daramassalik.local</strong> / <strong>ChangeMe123!</strong></div>
                </form>
              }
            </div>
          </div>
        </section>
      </div>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly mode = signal<'otp' | 'password'>('otp');
  readonly otpStep = signal<'phone' | 'code'>('phone');

  readonly phoneForm = new FormGroup({
phone: new FormControl('', {
  nonNullable: true,
  validators: [
    Validators.required,
    phoneNumberValidator
  ]
})  });



  readonly otpForm = new FormGroup({
code: new FormControl('', {
  nonNullable: true,
  validators: [
    Validators.required,
    Validators.pattern(/^\d{6}$/)
  ]
}),    firstName: new FormControl('', { nonNullable: true }),
    lastName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    remember: new FormControl(true, { nonNullable: true })
  });

  readonly passwordForm = new FormGroup({
    email: new FormControl('admin@daramassalik.local', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('ChangeMe123!', { nonNullable: true, validators: [Validators.required, Validators.minLength(4)] }),
    remember: new FormControl(true, { nonNullable: true })
  });

  async requestOtp(): Promise<void> {
    if (this.phoneForm.invalid) return;

    const phoneNumber = this.phoneForm.controls.phone.value
  .replace(/[\s().-]/g, '');


    const result =  await this.authStore.requestOtp(phoneNumber);
    if (result) {
      this.otpForm.controls.code.reset();
      this.otpForm.controls.firstName.reset();
      this.otpForm.controls.lastName.reset();
      this.otpForm.controls.email.reset();
      this.otpStep.set('code');
    }
  }

  async resendOtp(): Promise<void> {
    this.otpForm.controls.code.reset();
    await this.requestOtp();
  }

  async verifyOtp(): Promise<void> {
    if (this.otpForm.invalid) return;
    if (!this.authStore.otpExistingUser() && (this.otpForm.controls.firstName.invalid || this.otpForm.controls.lastName.invalid)) return;

    const success = await this.authStore.verifyOtp({
      phoneNumber: this.phoneForm.controls.phone.value.trim(),
      code: this.otpForm.controls.code.value,
      firstName: this.otpForm.controls.firstName.value || undefined,
      lastName: this.otpForm.controls.lastName.value || undefined,
      email: this.otpForm.controls.email.value || undefined
    }, this.otpForm.controls.remember.value);

    if (success) await this.router.navigateByUrl('/dashboard');
  }

  async loginWithPassword(): Promise<void> {
    if (this.passwordForm.invalid) return;
    const success = await this.authStore.login({
      email: this.passwordForm.controls.email.value,
      password: this.passwordForm.controls.password.value
    }, this.passwordForm.controls.remember.value);
    if (success) await this.router.navigateByUrl('/dashboard');
  }
}
