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

  // Login prompt for guests
  showLoginPrompt: boolean;
  loginPromptReason: string;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;

  // Login prompt
  triggerLoginPrompt: (reason?: string) => void;
  closeLoginPrompt: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      isLoading: true,
      isAdmin: false,
      showLoginPrompt: false,
      loginPromptReason: 'sign in to continue',

      setSession: (session) =>
        set({
          session,
          user: session?.user ?? null,
        }),

      setProfile: (profile) =>
        set({
          profile,
          isAdmin: profile?.role === 'admin',
        }),

      setLoading: (isLoading) => set({ isLoading }),

      fetchProfile: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) throw error;

          set({
            profile: data as Profile,
            isAdmin: data?.role === 'admin',
          });
        } catch (error) {
          console.error('Error fetching profile:', error);
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
