import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';

export interface LocalCartItem {
  product_id: string;
  color_name: string;
  size: string;
  quantity: number;
  product_name: string;
  product_price: number;
  image_url: string;
}

interface CartState {
  items: LocalCartItem[];
  isCartOpen: boolean;
  appliedCoupon: { code: string; discount: number } | null;

  addItem: (item: LocalCartItem) => void;
  removeItem: (productId: string, color: string, size: string) => void;
  updateQuantity: (productId: string, color: string, size: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;

  getItemCount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,
      appliedCoupon: null,

      addItem: (newItem) => {
        const { user, triggerLoginPrompt } = useAuthStore.getState();
        if (!user) {
          triggerLoginPrompt('add items to your cart');
          return;
        }

        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.product_id === newItem.product_id &&
              item.color_name === newItem.color_name &&
              item.size === newItem.size
          );

          if (existingIndex >= 0) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + newItem.quantity,
            };
            return { items: updatedItems, isCartOpen: true };
          }

          return { items: [...state.items, newItem], isCartOpen: true };
        });
      },

      removeItem: (productId, color, size) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.product_id === productId &&
                item.color_name === color &&
                item.size === size
              )
          ),
        })),

      updateQuantity: (productId, color, size, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === productId &&
            item.color_name === color &&
            item.size === size
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        })),

      clearCart: () => set({ items: [], appliedCoupon: null }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      applyCoupon: (code, discount) => set({ appliedCoupon: { code, discount } }),
      removeCoupon: () => set({ appliedCoupon: null }),

      getItemCount: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      getTotal: () =>
        get().items.reduce(
          (total, item) => total + item.product_price * item.quantity,
          0
        ),
    }),
    {
      name: 'fashionverse-cart',
    }
  )
);
