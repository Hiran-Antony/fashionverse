import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StylistItem {
  slot: string;
  product_name: string;
  brand: string;
  price: number;
  image_url: string;
  reason: string;
}

interface StylistResponse {
  outfit_name: string;
  analysis: string;
  dress_code_level: string;
  items: StylistItem[];
  total_price: number;
  style_tip: string;
  mediator_note: string;
  confidence_score: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  outfit?: StylistResponse | Record<string, unknown>;
}

interface StylistState {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  clearMessages: () => void;
}

const initialWelcome: Message = {
  id: 'welcome',
  role: 'model',
  text: "Welcome to FashionVerse AI — Your elite personal stylist. \n\nI can help you find the perfect outfit, decode dress codes, and style you for any occasion. \n\nHow can I help you dress today?",
};

export const useStylistStore = create<StylistState>()(
  persist(
    (set) => ({
      messages: [initialWelcome],
      setMessages: (updater) => set((state) => ({
        messages: typeof updater === 'function' ? updater(state.messages) : updater
      })),
      clearMessages: () => set({ messages: [initialWelcome] })
    }),
    {
      name: 'stylist-storage',
    }
  )
);
