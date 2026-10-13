import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ShopProduct, ShopStore } from './shop.store';

@Component({
  selector: 'dm-shop-cart',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, ButtonModule, CardModule],
  template: `
    <div class="page-enter space-y-6">
      <section class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm font-semibold text-[var(--brand-primary)]">Boutique</p>
          <h1 class="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Votre panier</h1>
          <p class="mt-2 text-sm text-slate-500">Vérifiez vos articles avant de préparer votre commande.</p>
        </div>
        <a routerLink="/shop" class="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]">
          <i class="pi pi-arrow-left"></i> Continuer mes achats
        </a>
      </section>

      @if (cartLines().length === 0) {
        <div class="rounded-3xl border border-dashed border-[var(--brand-border)] bg-white p-12 text-center shadow-sm">
          <div class="mx-auto flex size-20 items-center justify-center rounded-3xl bg-[var(--brand-bg)] text-[var(--brand-primary)]">
            <i class="pi pi-shopping-cart text-3xl"></i>
          </div>
          <h2 class="mt-5 text-xl font-bold text-slate-800">Votre panier est vide</h2>
          <p class="mt-2 text-sm text-slate-500">Ajoutez un produit depuis la boutique pour commencer votre commande.</p>
          <a routerLink="/shop" class="mt-5 inline-flex items-center justify-center rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white">Découvrir les produits</a>
        </div>
      } @else {
        <div class="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <div class="space-y-3">
            @for (line of cartLines(); track line.product.id) {
              <div class="grid gap-4 rounded-3xl border border-[var(--brand-border)] bg-white p-4 shadow-sm sm:grid-cols-[7rem_1fr_auto] sm:items-center">
                <a [routerLink]="['/shop/products', line.product.id]" class="flex h-28 items-center justify-center rounded-2xl bg-gradient-to-br {{ line.product.accentClass }}">
                  <i [class]="line.product.icon + ' text-3xl text-[var(--brand-primary)]'"></i>
                </a>
                <div class="min-w-0">
                  <a [routerLink]="['/shop/products', line.product.id]" class="text-lg font-bold text-slate-900 hover:text-[var(--brand-primary)]">{{ line.product.name }}</a>
                  <div class="mt-1 text-xs text-slate-400">Réf. {{ line.product.reference }}</div>
                  <div class="mt-3 text-sm font-semibold text-slate-700">{{ line.product.price | currency:'EUR':'symbol':'1.2-2':'fr' }} / unité</div>
                  <div class="mt-3 flex items-center gap-2">
                    <button class="flex size-9 items-center justify-center rounded-xl border border-[var(--brand-border)] text-slate-600 hover:bg-slate-50" (click)="decrease(line.product.id, line.quantity)" aria-label="Diminuer la quantité"><i class="pi pi-minus text-xs"></i></button>
                    <span class="min-w-8 text-center text-sm font-bold">{{ line.quantity }}</span>
                    <button class="flex size-9 items-center justify-center rounded-xl border border-[var(--brand-border)] text-slate-600 hover:bg-slate-50 disabled:opacity-40" [disabled]="line.quantity >= line.product.stock" (click)="increase(line.product.id, line.quantity, line.product.stock)" aria-label="Augmenter la quantité"><i class="pi pi-plus text-xs"></i></button>
                  </div>
                </div>
                <div class="flex items-center justify-between gap-4 sm:block sm:text-right">
                  <div class="text-lg font-bold text-slate-900">{{ line.product.price * line.quantity | currency:'EUR':'symbol':'1.2-2':'fr' }}</div>
                  <button class="mt-2 text-sm font-semibold text-red-500 hover:text-red-600" (click)="remove(line.product.id)"><i class="pi pi-trash mr-1"></i>Retirer</button>
                </div>
              </div>
            }
          </div>

          <aside class="h-fit rounded-3xl border border-[var(--brand-border)] bg-white p-5 shadow-sm xl:sticky xl:top-24">
            <div class="text-lg font-bold text-slate-900">Résumé</div>
            <div class="mt-5 space-y-3 text-sm">
              <div class="flex items-center justify-between text-slate-500"><span>Articles</span><span>{{ shopStore.cartCount() }}</span></div>
              <div class="flex items-center justify-between text-slate-500"><span>Sous-total</span><span>{{ shopStore.cartTotal() | currency:'EUR':'symbol':'1.2-2':'fr' }}</span></div>
              <div class="border-t border-slate-100 pt-4">
                <div class="flex items-center justify-between"><span class="font-semibold text-slate-800">Total</span><span class="text-xl font-bold text-[var(--brand-primary)]">{{ shopStore.cartTotal() | currency:'EUR':'symbol':'1.2-2':'fr' }}</span></div>
              </div>
            </div>

            <div class="mt-5 rounded-2xl bg-[var(--brand-bg)] p-4 text-sm text-slate-600">
              Le paiement en ligne n'est pas encore activé. Le panier sert pour l'instant à préparer la commande.
            </div>

            <p-button label="Paiement — bientôt disponible" icon="pi pi-lock" [disabled]="true" fluid class="mt-4" />
            <p-button label="Vider le panier" severity="secondary" variant="text" fluid class="mt-2" (onClick)="shopStore.clearCart()" />
          </aside>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopCartComponent {
  readonly shopStore = inject(ShopStore);

  readonly cartLines = computed(() => this.shopStore.cart().map((item) => {
    const product = this.shopStore.products().find((candidate) => candidate.id === item.productId);
    return product ? { product, quantity: item.quantity } : null;
  }).filter((line): line is { product: ShopProduct; quantity: number } => line !== null));

  increase(productId: string, quantity: number, stock: number): void {
    if (quantity < stock) {
      this.shopStore.setQuantity(productId, quantity + 1);
    }
  }

  decrease(productId: string, quantity: number): void {
    this.shopStore.setQuantity(productId, quantity - 1);
  }

  remove(productId: string): void {
    this.shopStore.removeFromCart(productId);
  }
}
