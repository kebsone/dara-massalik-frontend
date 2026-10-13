import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ShopStore } from './shop.store';

@Component({
  selector: 'dm-shop-product-detail',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, ButtonModule, CardModule, TagModule],
  template: `
    <div class="page-enter space-y-6">
      @if (product(); as currentProduct) {
        <div class="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <a routerLink="/shop" class="hover:text-[var(--brand-primary)]">Boutique</a>
          <i class="pi pi-angle-right text-xs"></i>
          <span>{{ currentProduct.name }}</span>
        </div>

        <a routerLink="/shop" class="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]">
          <i class="pi pi-arrow-left"></i> Retour à la boutique
        </a>

        <div class="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
          <div class="overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-white shadow-sm">
            <div class="flex min-h-[22rem] items-center justify-center bg-gradient-to-br p-8 {{ currentProduct.accentClass }} sm:min-h-[34rem]">
              <div class="flex size-48 items-center justify-center rounded-[3rem] bg-white/85 shadow-md ring-1 ring-white sm:size-64">
                <i [class]="currentProduct.icon + ' text-8xl text-[var(--brand-primary)] sm:text-[10rem]'"></i>
              </div>
            </div>
          </div>

          <div class="space-y-5 rounded-3xl border border-[var(--brand-border)] bg-white p-6 shadow-sm sm:p-8">
            <div class="flex flex-wrap gap-2">
              <p-tag [value]="categoryLabel(currentProduct.category)" severity="info" />
              <p-tag [value]="currentProduct.stock <= 5 ? 'Stock limité' : 'Disponible'" [severity]="currentProduct.stock <= 5 ? 'warn' : 'success'" />
            </div>

            <div>
              <h1 class="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{{ currentProduct.name }}</h1>
              <p class="mt-2 text-sm text-slate-400">Référence {{ currentProduct.reference }}</p>
            </div>

            <div class="text-3xl font-bold text-[var(--brand-primary)]">
              {{ currentProduct.price | currency:'EUR':'symbol':'1.2-2':'fr' }}
            </div>

            <p class="text-base leading-7 text-slate-600">{{ currentProduct.description }}</p>

            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-2xl bg-slate-50 p-4">
                <div class="text-xs uppercase tracking-wider text-slate-400">Disponibilité</div>
                <div class="mt-1 font-semibold text-slate-800">{{ currentProduct.stock }} articles</div>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <div class="text-xs uppercase tracking-wider text-slate-400">Référence</div>
                <div class="mt-1 font-semibold text-slate-800">{{ currentProduct.reference }}</div>
              </div>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row">
              <p-button
                label="Ajouter au panier"
                icon="pi pi-shopping-cart"
                size="large"
                class="flex-1"
                [disabled]="currentProduct.stock === 0"
                (onClick)="addToCart(currentProduct.id)"
              />
              <p-button
                label="Voir le panier"
                icon="pi pi-arrow-right"
                severity="secondary"
                variant="outlined"
                size="large"
                (onClick)="goToCart()"
              />
            </div>

            <div class="flex items-start gap-3 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-4 text-sm text-slate-600">
              <i class="pi pi-info-circle mt-0.5 text-[var(--brand-primary)]"></i>
              <span>Le paiement sera ajouté dans une prochaine version. Pour le moment, votre panier reste disponible pour préparer la commande.</span>
            </div>
          </div>
        </div>
      } @else {
        <div class="rounded-3xl border border-dashed border-[var(--brand-border)] bg-white p-12 text-center">
          <i class="pi pi-box text-4xl text-slate-300"></i>
          <h1 class="mt-4 text-xl font-bold text-slate-800">Produit introuvable</h1>
          <p class="mt-1 text-sm text-slate-500">Le produit demandé n'est plus disponible.</p>
          <a routerLink="/shop" class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]">Retour à la boutique</a>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopProductDetailComponent {
  readonly id = input.required<string>();
  readonly shopStore = inject(ShopStore);
  private readonly router = inject(Router);

  readonly product = computed(() => this.shopStore.products().find((candidate) => candidate.id === this.id()));

  categoryLabel(category: 'Clothing' | 'Books' | 'Accessories'): string {
    return category === 'Clothing' ? 'Vêtements' : category === 'Books' ? 'Livres' : 'Accessoires';
  }

  addToCart(productId: string): void {
    this.shopStore.addToCart(productId);
  }

  goToCart(): void {
    this.router.navigateByUrl('/shop/cart');
  }
}
