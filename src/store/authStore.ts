import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isDeliveryApproved: boolean;
  isDeliveryPending: boolean;
  walletAddress: string | null;

  // Login prompt for guests
  showLoginPrompt: boolean;
  loginPromptReason: string;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;

  // Login prompt
  triggerLoginPrompt: (reason?: string) => void;
  closeLoginPrompt: () => void;
  
  // Web3 Wallet
  setWalletAddress: (address: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      profile: null,
      session: null,
      isLoading: true,
      isAdmin: false,
      isDeliveryApproved: false,
      isDeliveryPending: false,
      walletAddress: null,
      showLoginPrompt: false,
      loginPromptReason: 'sign in to continue',

      setWalletAddress: (address) => set({ walletAddress: address }),

      setSession: (session) =>
        set({
          session,
          user: session?.user ?? null,
        }),

      setProfile: (profile) =>
        set({
          profile,
          isAdmin: profile?.role === 'admin',
          isDeliveryApproved: profile?.role === 'delivery_approved' || profile?.role === 'admin',
          isDeliveryPending: profile?.role === 'delivery_pending',
        }),

      setLoading: (isLoading) => set({ isLoading }),

      fetchProfile: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, email, name, avatar_url, role, loyalty_points, phone, addresses, created_at')
            .eq('id', userId)
            .single();

          if (error) throw error;

          set({
            profile: data as Profile,
            isAdmin: data?.role === 'admin',
            isDeliveryApproved: data?.role === 'delivery_approved' || data?.role === 'admin',
            isDeliveryPending: data?.role === 'delivery_pending',
            isLoading: false,
          });
        } catch (error) {
          console.error('Error fetching profile:', error);
          set({ isLoading: false });
        }
      },

      updateProfile: async (updates: Partial<Profile>) => {
        const currentProfile = _get().profile;
        if (!currentProfile) return;
        // Optimistic update — reflect changes instantly in the UI
        set({ profile: { ...currentProfile, ...updates } });
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', currentProfile.id);
        if (error) {
          // Roll back on failure
          set({ profile: currentProfile });
          throw error;
        }
      },

      signInWithGoogle: async () => {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          profile: null,
          session: null,
          isAdmin: false,
          isDeliveryApproved: false,
          isDeliveryPending: false,
        });
      },

      triggerLoginPrompt: (reason = 'sign in to continue') =>
        set({ showLoginPrompt: true, loginPromptReason: reason }),

      closeLoginPrompt: () => set({ showLoginPrompt: false }),
    }),
    {
      name: 'fashionverse-auth',
      partialize: (state) => ({
        isAdmin: state.isAdmin,
      }),
    }
  )
);
