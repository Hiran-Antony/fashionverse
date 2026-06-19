import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StylistItem {
  slot: string;
  product_name: string;
  brand: string;
  price: number;
  image_url: string;
  reason: string;
}

export interface StylistResponse {
  outfit_name: string;
  analysis: string;
  dress_code_level: string;
  items: StylistItem[];
  total_price: number;
  style_tip: string;
  mediator_note: string;
  confidence_score: number;
}

// 5-feature AI response types
export interface AIColorAdvisor {
  feature: 'color_advisor';
  skin_tone: string;
  best_colors: string[];
  avoid_colors: string[];
  borderline_colors: string[];
  reason: string;
  catalog_matches: { name: string; color: string; price: string; why: string }[];
}

export interface AIDressCode {
  feature: 'dress_code_explainer';
  dress_code: string;
  vibe_summary: string;
  wear: string[];
  avoid: string[];
  borderline: string[];
  indian_context: string;
  catalog_picks: { name: string; price: string; why: string }[];
}

export interface AIStyleChat {
  feature: 'style_chat';
  response: string;
  style_tags: string[];
  confidence: string;
  catalog_recommendations: { name: string; price: string; occasion: string; why: string }[];
}

export interface AIOutfit {
  feature: 'outfit';
  chat_response: string;
  outfit_name: string;
  analysis: string;
  dress_code_level: string;
  items: StylistItem[];
  total_price: number;
  style_tip: string;
  mediator_note: string;
  confidence_score: number;
}

export interface AIFabricScanner {
  feature: 'fabric_scanner';
  fabric_type: string;
  care_instructions: string;
  season_suitability: string;
  catalog_matches: { name: string; price: string; why: string }[];
}

export type AIFeatureResponse = AIColorAdvisor | AIDressCode | AIStyleChat | AIOutfit | AIFabricScanner;

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  outfit?: StylistResponse;
  aiResponse?: AIFeatureResponse;
  photoThumb?: string; // base64 thumbnail shown in chat
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
