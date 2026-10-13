import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'dm-shop-sales',
  standalone: true,
  imports: [CurrencyPipe, ButtonModule, CardModule, TagModule],
  template: `
    <div class="page-enter space-y-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p class="text-sm font-medium text-[var(--brand-primary)]">Boutique</p><h1 class="text-2xl font-bold text-slate-900">Ventes</h1><p class="mt-1 text-sm text-slate-500">Historique des ventes et encaissements de la boutique.</p></div><p-button label="Nouvelle vente" icon="pi pi-plus" /></div>
      <div class="grid gap-4 sm:grid-cols-3"><p-card styleClass="border border-[var(--brand-border)] shadow-sm"><p class="text-sm text-slate-500">CA du mois</p><p class="mt-1 text-2xl font-bold">{{ 2480 | currency:'EUR':'symbol':'1.0-0':'fr' }}</p></p-card><p-card styleClass="border border-[var(--brand-border)] shadow-sm"><p class="text-sm text-slate-500">Nombre de ventes</p><p class="mt-1 text-2xl font-bold">96</p></p-card><p-card styleClass="border border-[var(--brand-border)] shadow-sm"><p class="text-sm text-slate-500">Panier moyen</p><p class="mt-1 text-2xl font-bold text-[var(--brand-primary)]">25,83 €</p></p-card></div>
      <p-card styleClass="border border-[var(--brand-border)] shadow-sm"><div class="overflow-x-auto"><table class="w-full min-w-[720px] text-sm"><thead><tr class="border-b text-left text-xs uppercase tracking-wide text-slate-400"><th class="px-3 py-3">Date</th><th class="px-3 py-3">Référence</th><th class="px-3 py-3">Client</th><th class="px-3 py-3">Articles</th><th class="px-3 py-3">Montant</th><th class="px-3 py-3">Paiement</th></tr></thead><tbody>@for (sale of sales; track sale.reference) {<tr class="border-b border-slate-100 last:border-0"><td class="px-3 py-4 text-slate-500">{{ sale.date }}</td><td class="px-3 py-4 font-semibold text-slate-700">{{ sale.reference }}</td><td class="px-3 py-4 text-slate-500">{{ sale.customer }}</td><td class="px-3 py-4 text-slate-500">{{ sale.items }}</td><td class="px-3 py-4 font-semibold text-slate-700">{{ sale.amount }} €</td><td class="px-3 py-4"><p-tag value="Payé" severity="success" /></td></tr>}</tbody></table></div></p-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopSalesComponent {
  readonly sales = [
    { date: '04/10/2026', reference: 'V-2026-0096', customer: 'Mamadou Ndiaye', items: 3, amount: '42,00' },
    { date: '04/10/2026', reference: 'V-2026-0095', customer: 'Sokhna Diouf', items: 2, amount: '22,00' },
    { date: '03/10/2026', reference: 'V-2026-0094', customer: 'Abdoulaye Fall', items: 5, amount: '65,00' },
    { date: '03/10/2026', reference: 'V-2026-0093', customer: 'Aminata Seck', items: 1, amount: '12,00' },
    { date: '02/10/2026', reference: 'V-2026-0092', customer: 'Cheikh Mbaye', items: 4, amount: '38,00' }
  ];
}
