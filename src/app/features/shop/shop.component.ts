import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ShopProduct, ShopStore } from './shop.store';

@Component({
  selector: 'dm-shop',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, FormsModule, ButtonModule, CardModule, SelectModule, TagModule],
  template: `
    <div class="page-enter space-y-6">
      <section class="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p class="text-sm font-semibold text-[var(--brand-primary)]">Boutique</p>
          <h1 class="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">La boutique du Dahira</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Consultez les produits disponibles, découvrez leurs détails et ajoutez vos articles au panier.
          </p>
        </div>
        <a
          routerLink="/shop/cart"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-dark)] sm:w-auto"
        >
          <i class="pi pi-shopping-cart"></i>
          Panier
          @if (shopStore.cartCount() > 0) {
            <span class="rounded-full bg-white/20 px-2 py-0.5 text-xs">{{ shopStore.cartCount() }}</span>
          }
        </a>
      </section>

      <section class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-2xl border border-[var(--brand-border)] bg-white p-4 shadow-sm">
          <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">Produits disponibles</div>
          <div class="mt-2 text-2xl font-bold text-slate-900">{{ availableProducts().length }}</div>
        </div>
        <div class="rounded-2xl border border-[var(--brand-border)] bg-white p-4 shadow-sm">
          <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">Dans votre panier</div>
          <div class="mt-2 text-2xl font-bold text-[var(--brand-primary)]">{{ shopStore.cartCount() }}</div>
        </div>
        <div class="rounded-2xl border border-[var(--brand-border)] bg-white p-4 shadow-sm">
          <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total du panier</div>
          <div class="mt-2 text-2xl font-bold text-slate-900">{{ shopStore.cartTotal() | currency:'EUR':'symbol':'1.2-2':'fr' }}</div>
        </div>
      </section>

      <section class="flex flex-col gap-3 rounded-2xl border border-[var(--brand-border)] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="font-semibold text-slate-800">Catalogue</div>
          <div class="text-sm text-slate-500">Choisissez une catégorie pour affiner la liste.</div>
        </div>
        <p-select
          [options]="categoryOptions"
          [ngModel]="categoryFilter()"
          (ngModelChange)="categoryFilter.set($event)"
          optionLabel="label"
          optionValue="value"
          placeholder="Toutes les catégories"
          class="w-full sm:w-64"
          aria-label="Filtrer les produits par catégorie"
        />
      </section>

      <section class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        @for (product of filteredProducts(); track product.id) {
          <article class="overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <a [routerLink]="['/shop/products', product.id]" class="block">
              <div class="flex h-56 items-center justify-center bg-gradient-to-br p-6 {{ product.accentClass }}">
                <div class="flex size-28 items-center justify-center rounded-[2rem] bg-white/80 shadow-sm ring-1 ring-white/80">
                  <i [class]="product.icon + ' text-5xl text-[var(--brand-primary)]'"></i>
                </div>
              </div>
            </a>
            <div class="space-y-4 p-5">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">{{ categoryLabel(product.category) }}</div>
                  <h2 class="truncate text-lg font-bold text-slate-900">{{ product.name }}</h2>
                  <div class="mt-1 text-xs text-slate-400">Réf. {{ product.reference }}</div>
                </div>
                <p-tag [value]="product.stock <= 5 ? 'Stock limité' : 'Disponible'" [severity]="product.stock <= 5 ? 'warn' : 'success'" />
              </div>

              <p class="min-h-12 text-sm leading-6 text-slate-500">{{ product.description }}</p>

              <div class="flex items-end justify-between gap-3">
                <div>
                  <div class="text-xl font-bold text-slate-900">{{ product.price | currency:'EUR':'symbol':'1.2-2':'fr' }}</div>
                  <div class="mt-1 text-xs text-slate-400">{{ product.stock }} en stock</div>
                </div>
                <div class="flex gap-2">
                  <a [routerLink]="['/shop/products', product.id]" class="inline-flex items-center justify-center rounded-xl border border-[var(--brand-border)] px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Détails</a>
                  <p-button label="Ajouter" icon="pi pi-plus" (onClick)="addToCart($event, product)" />
                </div>
              </div>
            </div>
          </article>
        }
      </section>

      @if (filteredProducts().length === 0) {
        <div class="rounded-2xl border border-dashed border-[var(--brand-border)] bg-white p-12 text-center">
          <i class="pi pi-search text-3xl text-slate-300"></i>
          <div class="mt-3 font-semibold text-slate-700">Aucun produit trouvé</div>
          <div class="mt-1 text-sm text-slate-400">Essayez une autre catégorie.</div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopComponent {
  readonly shopStore = inject(ShopStore);
  readonly categoryFilter = signal<'ALL' | ShopProduct['category']>('ALL');

  readonly categoryOptions = [
    { label: 'Toutes les catégories', value: 'ALL' },
    { label: 'Vêtements', value: 'Clothing' },
    { label: 'Livres', value: 'Books' },
    { label: 'Accessoires', value: 'Accessories' }
  ];

  readonly availableProducts = computed(() => this.shopStore.products().filter((product) => product.active && product.stock > 0));

  readonly filteredProducts = computed(() => {
    const category = this.categoryFilter();
    return this.availableProducts().filter((product) => category === 'ALL' || product.category === category);
  });

  categoryLabel(category: ShopProduct['category']): string {
    return category === 'Clothing' ? 'Vêtements' : category === 'Books' ? 'Livres' : 'Accessoires';
  }

  addToCart(event: Event, product: ShopProduct): void {
    event.preventDefault();
    event.stopPropagation();
    this.shopStore.addToCart(product.id);
  }
}
