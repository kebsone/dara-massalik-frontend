import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

interface Payment { student: string; month: string; amount: number; date: string; status: 'Paid' | 'Pending'; }

@Component({
  selector: 'dm-payments',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, ButtonModule, CardModule, DialogModule, InputNumberModule, SelectModule, TableModule, TagModule],
  template: `
    <div class="page-enter space-y-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p class="text-sm font-medium text-[var(--brand-primary)]">École coranique · Finance</p><h1 class="text-2xl font-bold text-slate-900">Cotisations</h1><p class="mt-1 text-sm text-slate-500">Suivez les contributions mensuelles liées à l’école.</p></div><p-button label="Enregistrer une cotisation" icon="pi pi-plus" (onClick)="showDialog.set(true)" /></div>
      <div class="grid gap-4 sm:grid-cols-3"><p-card styleClass="border border-[var(--brand-border)] shadow-sm"><p class="text-sm text-slate-500">Collecté en septembre</p><p class="mt-1 text-2xl font-bold">{{ collected() | currency:'EUR':'symbol':'1.0-0':'fr' }}</p></p-card><p-card styleClass="border border-[var(--brand-border)] shadow-sm"><p class="text-sm text-slate-500">En attente</p><p class="mt-1 text-2xl font-bold text-amber-600">{{ pendingAmount() | currency:'EUR':'symbol':'1.0-0':'fr' }}</p></p-card><p-card styleClass="border border-[var(--brand-border)] shadow-sm"><p class="text-sm text-slate-500">Taux de collecte</p><p class="mt-1 text-2xl font-bold text-[var(--brand-primary)]">76 %</p></p-card></div>
      <p-card styleClass="border border-[var(--brand-border)] shadow-sm"><div class="mb-5 grid gap-3 sm:grid-cols-2"><p-select [options]="months" [(ngModel)]="selectedMonth" styleClass="w-full" /><p-select [options]="groups" [(ngModel)]="selectedGroup" styleClass="w-full" /></div><p-table [value]="payments" responsiveLayout="scroll" styleClass="text-sm"><ng-template #header><tr><th>Élève</th><th>Mois</th><th>Montant</th><th>Date de paiement</th><th>Statut</th><th></th></tr></ng-template><ng-template #body let-payment><tr><td class="font-semibold">{{ payment.student }}</td><td>{{ payment.month }}</td><td>{{ payment.amount }} €</td><td>{{ payment.date }}</td><td><p-tag [value]="payment.status === 'Paid' ? 'Payé' : 'En attente'" [severity]="payment.status === 'Paid' ? 'success' : 'warn'" /></td><td class="text-right"><p-button icon="pi pi-ellipsis-v" [text]="true" [rounded]="true" aria-label="Actions de cotisation" /></td></tr></ng-template></p-table></p-card>
      <p-dialog header="Enregistrer une cotisation" [(visible)]="showDialog" [modal]="true" [style]="{ width: 'min(32rem, 95vw)' }"><div class="space-y-4 pt-2"><div><label class="mb-2 block text-sm font-medium">Élève</label><p-select [options]="students" placeholder="Sélectionner un élève" styleClass="w-full" /></div><div><label class="mb-2 block text-sm font-medium">Montant</label><p-inputnumber [min]="0" [max]="1000" suffix=" €" styleClass="w-full" inputStyleClass="w-full" /></div><div class="flex justify-end gap-2"><p-button label="Annuler" severity="secondary" [text]="true" (onClick)="showDialog.set(false)" /><p-button label="Enregistrer" icon="pi pi-check" (onClick)="showDialog.set(false)" /></div></div></p-dialog>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentsComponent {
  readonly showDialog = signal(false);
  readonly months = ['Septembre 2026', 'Août 2026', 'Juillet 2026'];
  selectedMonth = 'Septembre 2026';
  selectedGroup = 'Tous les groupes';
  readonly groups = ['Tous les groupes', 'Groupe 1', 'Groupe 2', 'Groupe 3'];
  readonly students = ['Amadou Diallo', 'Aïssatou Diop', 'Moussa Ndiaye', 'Fatou Kane', 'Ibrahima Sy', 'Mariama Ba'];
  readonly payments: Payment[] = [
    { student: 'Amadou Diallo', month: 'Septembre 2026', amount: 15, date: '05/09/2026', status: 'Paid' },
    { student: 'Aïssatou Diop', month: 'Septembre 2026', amount: 15, date: '06/09/2026', status: 'Paid' },
    { student: 'Moussa Ndiaye', month: 'Septembre 2026', amount: 0, date: '—', status: 'Pending' },
    { student: 'Fatou Kane', month: 'Septembre 2026', amount: 15, date: '12/09/2026', status: 'Paid' },
    { student: 'Ibrahima Sy', month: 'Septembre 2026', amount: 10, date: '14/09/2026', status: 'Paid' },
    { student: 'Mariama Ba', month: 'Septembre 2026', amount: 0, date: '—', status: 'Pending' }
  ];
  readonly collected = computed(() => this.payments.filter(payment => payment.status === 'Paid').reduce((sum, payment) => sum + payment.amount, 0));
  readonly pendingAmount = computed(() => this.payments.filter(payment => payment.status === 'Pending').reduce(sum => sum + 15, 0));
}
