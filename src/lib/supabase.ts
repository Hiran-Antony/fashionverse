import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Product {
  id: string;
  name: string;
  brand?: string;
  price: number;
  images?: string[];
  category?: string;
  sub_category?: string;
  color?: string;
  [key: string]: any;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseAnonKey !== 'your_supabase_anon_key'
);

if (!isConfigured) {
  console.warn(
    '⚠️ Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.\n' +
    '   The app will run in demo mode without authentication or database features.'
  );
}

// Create a real client only when properly configured.
// Otherwise create a mock-safe proxy so the app doesn't crash.
let supabase: SupabaseClient;

if (isConfigured) {
  supabase = createClient(supabaseUrl!, supabaseAnonKey!);
} else {
  // Create a minimal mock that won't crash the app
  // All queries will return empty data gracefully
  const mockResponse = { data: null, error: null, count: null };
  const mockAuthUser = { data: { session: null }, error: null };

  const chainable = (): any => {
    const handler: any = () => chainable();
    handler.then = (resolve: any) => resolve(mockResponse);
    handler.select = chainable;
    handler.insert = chainable;
    handler.update = chainable;
    handler.delete = chainable;
    handler.eq = chainable;
    handler.neq = chainable;
    handler.single = chainable;
    handler.order = chainable;
    handler.limit = chainable;
    handler.range = chainable;
    handler.match = chainable;
    handler.in = chainable;
    handler.gte = chainable;
    handler.lte = chainable;
    handler.like = chainable;
    handler.ilike = chainable;
    handler.is = chainable;
    handler.filter = chainable;
    handler.or = chainable;
    handler.not = chainable;
    handler.maybeSingle = () => Promise.resolve(mockResponse);
    return handler;
  };

  supabase = {
    from: () => chainable(),
    auth: {
      getSession: () => Promise.resolve(mockAuthUser),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
      signInWithOAuth: () => Promise.resolve({ data: { url: null, provider: '' as any }, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (_callback: any) => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  } as unknown as SupabaseClient;
}

export { supabase, isConfigured };
