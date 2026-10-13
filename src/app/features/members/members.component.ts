import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

interface Member {
  name: string;
  phone: string;
  role: string;
  commission: string;
  status: 'Actif' | 'À contacter';
}

@Component({
  selector: 'dm-members',
  standalone: true,
  imports: [FormsModule, ButtonModule, CardModule, InputTextModule, TagModule],
  template: `
    <div class="page-enter space-y-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><p class="text-sm font-medium text-[var(--brand-primary)]">Dahira</p><h1 class="text-2xl font-bold text-slate-900">Membres</h1><p class="mt-1 text-sm text-slate-500">Gérez les membres et leurs rattachements aux commissions.</p></div>
        <p-button label="Nouveau membre" icon="pi pi-plus" (onClick)="showForm.set(!showForm())" />
      </div>

      @if (showForm()) {
        <p-card styleClass="border border-[var(--brand-border)] shadow-sm">
          <div class="grid gap-4 sm:grid-cols-3">
            <div><label class="mb-2 block text-sm font-medium">Prénom et nom</label><input pInputText class="w-full" placeholder="Ex. Mamadou Ndiaye" /></div>
            <div><label class="mb-2 block text-sm font-medium">Téléphone</label><input pInputText class="w-full" placeholder="06 00 00 00 00" /></div>
            <div><label class="mb-2 block text-sm font-medium">Commission</label><input pInputText class="w-full" placeholder="Éducation" /></div>
          </div>
          <div class="mt-4 flex justify-end gap-2"><p-button label="Annuler" severity="secondary" [text]="true" (onClick)="showForm.set(false)" /><p-button label="Ajouter" icon="pi pi-check" (onClick)="showForm.set(false)" /></div>
        </p-card>
      }

      <div class="grid gap-4 sm:grid-cols-3">
        <p-card styleClass="border border-[var(--brand-border)] shadow-sm"><p class="text-sm text-slate-500">Membres actifs</p><p class="mt-1 text-2xl font-bold">124</p></p-card>
        <p-card styleClass="border border-[var(--brand-border)] shadow-sm"><p class="text-sm text-slate-500">Nouveaux ce mois</p><p class="mt-1 text-2xl font-bold text-[var(--brand-primary)]">+4</p></p-card>
        <p-card styleClass="border border-[var(--brand-border)] shadow-sm"><p class="text-sm text-slate-500">Sans commission</p><p class="mt-1 text-2xl font-bold text-amber-600">12</p></p-card>
      </div>

      <p-card styleClass="border border-[var(--brand-border)] shadow-sm">
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="font-semibold text-slate-800">Annuaire du Dahira</h2><p class="text-xs text-slate-400">{{ filteredMembers().length }} membres affichés</p></div><input pInputText [(ngModel)]="query" class="w-full sm:w-80" placeholder="Rechercher un membre..." /></div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[700px] text-sm"><thead><tr class="border-b text-left text-xs uppercase tracking-wide text-slate-400"><th class="px-3 py-3">Membre</th><th class="px-3 py-3">Téléphone</th><th class="px-3 py-3">Rôle</th><th class="px-3 py-3">Commission</th><th class="px-3 py-3">Statut</th></tr></thead><tbody>
            @for (member of filteredMembers(); track member.name) {
              <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"><td class="px-3 py-4 font-semibold text-slate-700">{{ member.name }}</td><td class="px-3 py-4 text-slate-500">{{ member.phone }}</td><td class="px-3 py-4 text-slate-500">{{ member.role }}</td><td class="px-3 py-4 text-slate-500">{{ member.commission }}</td><td class="px-3 py-4"><p-tag [value]="member.status" [severity]="member.status === 'Actif' ? 'success' : 'warn'" /></td></tr>
            }
          </tbody></table>
        </div>
      </p-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MembersComponent {
  readonly showForm = signal(false);
  query = '';
  readonly members: Member[] = [
    { name: 'Mamadou Ndiaye', phone: '06 18 22 44 90', role: 'Membre', commission: 'Éducation', status: 'Actif' },
    { name: 'Abdoulaye Fall', phone: '06 20 41 55 31', role: 'Responsable', commission: 'Communication', status: 'Actif' },
    { name: 'Aminata Seck', phone: '07 11 48 77 02', role: 'Membre', commission: 'Femmes', status: 'Actif' },
    { name: 'Cheikh Mbaye', phone: '06 32 81 12 09', role: 'Responsable', commission: 'Boutique', status: 'Actif' },
    { name: 'Sokhna Diouf', phone: '07 65 21 48 12', role: 'Membre', commission: 'Éducation', status: 'À contacter' }
  ];

  filteredMembers(): Member[] {
    const term = this.query.trim().toLowerCase();
    if (!term) return this.members;
    return this.members.filter(member => `${member.name} ${member.commission} ${member.role}`.toLowerCase().includes(term));
  }
}
