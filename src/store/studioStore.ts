import { create } from 'zustand';
import type { Product } from '../lib/supabase';

export type MannequinType = 'male' | 'female' | 'kids';
export type SlotType = 'top' | 'bottom' | 'shoes';

interface StudioState {
  activeMannequin: MannequinType;
  outfit: Record<SlotType, Product | null>;
  budget: number | null;
  aiScore: number | null;
  isCinematicPreview: boolean;
  
  // Actions
  setMannequin: (type: MannequinType) => void;
  equipItem: (slot: SlotType, product: Product) => void;
  removeItem: (slot: SlotType) => void;
  setBudget: (budget: number | null) => void;
  setAiScore: (score: number | null) => void;
  setCinematicPreview: (isActive: boolean) => void;
  clearOutfit: () => void;
  getTotalPrice: () => number;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  activeMannequin: 'male',
  outfit: {
    top: null,
    bottom: null,
    shoes: null,
  },
  budget: null,
  aiScore: null,
  isCinematicPreview: false,

  setMannequin: (type) => set({ activeMannequin: type }),
  
  equipItem: (slot, product) => 
    set((state) => ({
      outfit: {
        ...state.outfit,
        [slot]: product,
      },
      aiScore: null, // Reset score when outfit changes
    })),

  removeItem: (slot) =>
    set((state) => ({
      outfit: {
        ...state.outfit,
        [slot]: null,
      },
      aiScore: null,
    })),

  setBudget: (budget) => set({ budget }),
  
  setAiScore: (score) => set({ aiScore: score }),
  
  setCinematicPreview: (isActive) => set({ isCinematicPreview: isActive }),

  clearOutfit: () =>
    set({
      outfit: { top: null, bottom: null, shoes: null, accessory: null },
      aiScore: null,
    }),

  getTotalPrice: () => {
    const { outfit } = get();
    return Object.values(outfit).reduce((sum, item) => sum + (item?.price || 0), 0);
  },
}));
