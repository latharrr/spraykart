import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Cart Store ───────────────────────────────────────────────────────────────
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      discount: 0,

      addItem: (product, variant = null, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.id === product.id && i.variant?.id === variant?.id
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === product.id && i.variant?.id === variant?.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          const cartKey = `${product.id}-${variant?.id || 'default'}`;
          return {
            items: [...state.items, { ...product, variant, quantity, cartKey }],
          };
        });
      },

      removeItem: (cartKey) =>
        set((state) => ({ items: state.items.filter((i) => i.cartKey !== cartKey) })),

      updateQuantity: (cartKey, quantity) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => i.cartKey !== cartKey)
            : state.items.map((i) => (i.cartKey === cartKey ? { ...i, quantity } : i)),
        })),

      clearCart: () => set({ items: [], coupon: null, discount: 0 }),
      setCoupon: (coupon, discount) => set({ coupon, discount }),
      removeCoupon: () => set({ coupon: null, discount: 0 }),

      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
      get total() {
        return Math.max(0, get().subtotal - get().discount);
      },
      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    { name: 'shopcore-cart' }
  )
);

// ─── Auth Store ───────────────────────────────────────────────────────────────
// NOTE: No token is stored here. JWT lives in an httpOnly cookie managed by the backend.
// This store only holds the user object for UI purposes.
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,

      setUser: (user) => set({ user }),

      logout: async () => {
        try {
          // Ask backend to clear the httpOnly cookie
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch { /* Ignore — clear local state regardless */ }
        set({ user: null });
      },
    }),
    {
      name: 'shopcore-auth',
      partialize: (state) => ({ user: state.user }), // Only persist user object
    }
  )
);
