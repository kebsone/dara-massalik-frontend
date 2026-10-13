import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Order, OrderApiService } from '../../core/api/order-api.service';

@Component({
  selector: 'dm-my-orders',
  standalone: true,
  imports: [CardModule, TagModule, DatePipe, CurrencyPipe],
  template: `
    <div class="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Mes commandes</h1>
        <p class="mt-1 text-slate-500">Retrouvez l’historique de vos commandes de la boutique.</p>
      </div>

      @if (!orders().length) {
        <p-card>
          <div class="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <i class="pi pi-receipt text-3xl text-slate-300"></i>
            <h2 class="mt-3 text-lg font-semibold text-slate-800">Aucune commande</h2>
            <p class="mt-1 text-sm text-slate-500">Vos futures commandes apparaîtront ici.</p>
          </div>
        </p-card>
      } @else {
        <div class="space-y-4">
          @for (order of orders(); track order.id) {
            <p-card>
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div class="flex items-center gap-3"><strong>{{ order.orderNumber }}</strong><p-tag [value]="orderStatusLabel(order.status)" /></div>
                  <div class="mt-1 text-sm text-slate-500">{{ order.createdAt | date:'dd/MM/yyyy à HH:mm' }}</div>
                  <div class="mt-3 text-sm text-slate-600">{{ order.items.length }} article(s)</div>
                </div>
                <div class="text-right"><div class="text-xl font-bold text-slate-900">{{ order.totalAmount | currency:'EUR':'symbol':'1.2-2':'fr-FR' }}</div><div class="mt-1 text-sm text-slate-500">{{ order.shippingPostalCode }} {{ order.shippingCity }}</div></div>
              </div>
            </p-card>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyOrdersComponent {
  private readonly api = inject(OrderApiService);
  readonly orders = signal<Order[]>([]);

  constructor() {
    this.api.findMine().subscribe(orders => this.orders.set(orders));
  }

  orderStatusLabel(status: string): string {
    switch (status) {
      case 'CREATED': return 'Créée';
      case 'CONFIRMED': return 'Confirmée';
      case 'PREPARING': return 'En préparation';
      case 'SHIPPED': return 'Expédiée';
      case 'DELIVERED': return 'Livrée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  }
}
