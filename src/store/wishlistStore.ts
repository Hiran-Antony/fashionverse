import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';

interface WishlistState {
  items: string[]; // Array of product IDs
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (productId) => {
        const { user, triggerLoginPrompt } = useAuthStore.getState();
        if (!user) {
          triggerLoginPrompt('save items to your wishlist');
          return;
        }
        set((state) => ({
          items: state.items.includes(productId)
            ? state.items
            : [...state.items, productId],
        }));
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((id) => id !== productId),
        })),

      toggleItem: (productId) => {
        const { user, triggerLoginPrompt } = useAuthStore.getState();
        if (!user) {
          triggerLoginPrompt('save items to your wishlist');
          return;
        }
        const { items } = get();
        if (items.includes(productId)) {
          set({ items: items.filter((id) => id !== productId) });
        } else {
          set({ items: [...items, productId] });
        }
      },

      isInWishlist: (productId) => get().items.includes(productId),

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'fashionverse-wishlist',
    }
  )
);
