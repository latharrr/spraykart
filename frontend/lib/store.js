import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchWithCsrf } from './csrf';

// ─── Cart Store ───────────────────────────────────────────────────────────────
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      discount: 0,

      addItem: (product, variant = null, quantity = 1) => {
        let added = false;
        set((state) => {
          const maxStock = variant ? variant.stock : product.stock;
          const limit = typeof maxStock === 'number' ? maxStock : 0;
          if (limit <= 0) {
            return state;
          }

          const existing = state.items.find(
            (i) => i.id === product.id && i.variant?.id === variant?.id
          );
          if (existing) {
            added = true;
            return {
              items: state.items.map((i) =>
                i.id === product.id && i.variant?.id === variant?.id
                  ? { ...i, quantity: Math.min(i.quantity + quantity, limit) }
                  : i
              ),
            };
          }
          const cartKey = `${product.id}-${variant?.id || 'default'}`;
          added = true;
          return {
            items: [...state.items, { ...product, variant, quantity: Math.min(quantity, limit), cartKey }],
          };
        });
        return added;
      },

      removeItem: (cartKey) =>
        set((state) => ({ items: state.items.filter((i) => i.cartKey !== cartKey) })),

      updateQuantity: (cartKey, quantity) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => i.cartKey !== cartKey)
            : state.items.map((i) => {
                if (i.cartKey === cartKey) {
                  const maxStock = i.variant ? i.variant.stock : i.stock;
                  const limit = typeof maxStock === 'number' ? maxStock : 0;
                  if (limit <= 0) {
                    return null;
                  }
                  return { ...i, quantity: Math.min(quantity, limit) };
                }
                return i;
              }).filter(Boolean),
        })),

      clearCart: () => set({ items: [], coupon: null, discount: 0 }),
      setCoupon: (coupon, discount) => set({ coupon, discount }),
      removeCoupon: () => set({ coupon: null, discount: 0 }),
    }),
    { name: 'shopcore-cart' }
  )
);

// Reactive selector hooks — use these everywhere instead of destructuring getters
export const useCartItemCount = () =>
  useCartStore((state) => state.items.reduce((sum, i) => sum + i.quantity, 0));

export const useCartSubtotal = () =>
  useCartStore((state) => state.items.reduce((sum, i) => {
    const itemPrice = i.variant ? parseFloat(i.price) + parseFloat(i.variant.price_modifier || 0) : parseFloat(i.price);
    return sum + itemPrice * i.quantity;
  }, 0));

export const useCartTotalAfterDiscount = () => {
  const subtotal = useCartSubtotal();
  const discount = useCartStore((state) => state.discount);
  return Math.max(0, subtotal - discount);
};

// ─── Wishlist Store ───────────────────────────────────────────────────────────
export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [], // array of product objects

      addItem: (product) => {
        if (get().items.find((i) => i.id === product.id)) return;
        set((state) => ({ items: [...state.items, product] }));
      },

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== productId) })),

      toggle: (product) => {
        const exists = get().items.find((i) => i.id === product.id);
        if (exists) {
          set((state) => ({ items: state.items.filter((i) => i.id !== product.id) }));
          return false; // removed
        } else {
          set((state) => ({ items: [...state.items, product] }));
          return true; // added
        }
      },
    }),
    { name: 'shopcore-wishlist' }
  )
);

// Reactive wishlist selectors
export const useWishlistCount = () =>
  useWishlistStore((state) => state.items.length);

export const useIsWishlisted = (productId) =>
  useWishlistStore((state) => state.items.some((i) => i.id === productId));

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
          await fetchWithCsrf('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch { /* Ignore — clear local state regardless */ }
        set({ user: null });
      },
    }),
    {
      name: 'shopcore-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
