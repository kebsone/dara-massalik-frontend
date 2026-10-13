import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

export interface ShopProduct {
  id: string;
  name: string;
  reference: string;
  category: 'Clothing' | 'Books' | 'Accessories';
  description: string;
  price: number;
  stock: number;
  active: boolean;
  icon: string;
  accentClass: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

interface ShopState {
  products: ShopProduct[];
  cart: CartItem[];
}

const PRODUCTS: ShopProduct[] = [
  {
    id: 'tunique-enfant',
    name: 'Tunique enfant',
    reference: 'TUN-ENF-01',
    category: 'Clothing',
    description: 'Tunique légère et confortable pour les enfants, adaptée aux cours et aux activités du Dahira.',
    price: 18,
    stock: 14,
    active: true,
    icon: 'pi pi-user',
    accentClass: 'from-emerald-50 via-white to-amber-50'
  },
  {
    id: 'coran-enfant',
    name: 'Livre Coran – édition enfant',
    reference: 'COR-ENF-02',
    category: 'Books',
    description: 'Édition pensée pour accompagner l’apprentissage et la lecture du Coran chez les enfants.',
    price: 12,
    stock: 22,
    active: true,
    icon: 'pi pi-book',
    accentClass: 'from-amber-50 via-white to-emerald-50'
  },
  {
    id: 'tshirt-dara-massalik',
    name: 'T-shirt Dara Massalik',
    reference: 'TSH-DM-04',
    category: 'Clothing',
    description: 'T-shirt aux couleurs de Dara Massalik, disponible pour enfants et adultes.',
    price: 10,
    stock: 31,
    active: true,
    icon: 'pi pi-heart',
    accentClass: 'from-slate-50 via-white to-emerald-50'
  },
  {
    id: 'chapelet',
    name: 'Chapelet',
    reference: 'CHA-001',
    category: 'Accessories',
    description: 'Chapelet classique, compact et facile à emporter pour les activités quotidiennes.',
    price: 5,
    stock: 18,
    active: true,
    icon: 'pi pi-circle',
    accentClass: 'from-stone-50 via-white to-amber-50'
  },
  {
    id: 'agenda-dahira',
    name: 'Agenda du Dahira',
    reference: 'AGE-DM-01',
    category: 'Books',
    description: 'Agenda annuel pour noter les cours, activités, réunions et temps forts du Dahira.',
    price: 8,
    stock: 11,
    active: true,
    icon: 'pi pi-calendar',
    accentClass: 'from-violet-50 via-white to-emerald-50'
  },
  {
    id: 'sac-enfant',
    name: 'Sac enfant',
    reference: 'SAC-ENF-01',
    category: 'Accessories',
    description: 'Sac pratique pour transporter les cahiers, livres et fournitures des enfants.',
    price: 20,
    stock: 9,
    active: true,
    icon: 'pi pi-shopping-bag',
    accentClass: 'from-blue-50 via-white to-amber-50'
  }
];

export const ShopStore = signalStore(
  { providedIn: 'root' },
  withState<ShopState>({
    products: PRODUCTS,
    cart: loadCart()
  }),
  withComputed((store) => ({
    cartCount: computed(() => store.cart().reduce((total, item) => total + item.quantity, 0)),
    cartTotal: computed(() =>
      store.cart().reduce((total, item) => {
        const product = store.products().find((candidate) => candidate.id === item.productId);
        return total + (product?.price ?? 0) * item.quantity;
      }, 0)
    )
  })),
  withMethods((store) => ({
    addToCart(productId: string): void {
      const product = store.products().find((candidate) => candidate.id === productId);
      if (!product || product.stock <= 0) return;

      const existing = store.cart().find((item) => item.productId === productId);
      const nextCart = existing
        ? store.cart().map((item) => item.productId === productId
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item)
        : [...store.cart(), { productId, quantity: 1 }];

      patchState(store, { cart: nextCart });
      persistCart(nextCart);
    },

    removeFromCart(productId: string): void {
      const nextCart = store.cart().filter((item) => item.productId !== productId);
      patchState(store, { cart: nextCart });
      persistCart(nextCart);
    },

    setQuantity(productId: string, quantity: number): void {
      const product = store.products().find((candidate) => candidate.id === productId);
      if (!product) return;

      if (quantity <= 0) {
       // store.removeFromCart(productId);
        return;
      }

      const nextCart = store.cart().map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(quantity, product.stock) }
          : item
      );

      patchState(store, { cart: nextCart });
      persistCart(nextCart);
    },

    clearCart(): void {
      patchState(store, { cart: [] });
      persistCart([]);
    }
  }))
);

function loadCart(): CartItem[] {
  try {
    const value = localStorage.getItem('dara-massalik-cart');
    return value ? JSON.parse(value) as CartItem[] : [];
  } catch {
    return [];
  }
}

function persistCart(cart: CartItem[]): void {
  try {
    localStorage.setItem('dara-massalik-cart', JSON.stringify(cart));
  } catch {
    // Ignore persistence failures; the cart still works for the current session.
  }
}
