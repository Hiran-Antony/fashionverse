import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

import { queryClient } from './lib/queryClient';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';

import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import PlaceholderPage from './pages/PlaceholderPage';

// ─── Lazy-loaded pages (code splitting) ──────────────────────
// These heavy pages only load when the user navigates to them
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/PlaceholderPage').then(m => ({ default: () => <m.default title="Shopping Cart" description="Review your items and proceed to checkout." /> })));
const CheckoutPage = lazy(() => import('./pages/PlaceholderPage').then(m => ({ default: () => <m.default title="Checkout" description="Complete your order with secure payment." /> })));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AccountPage = lazy(() => import('./pages/PlaceholderPage').then(m => ({ default: () => <m.default title="My Account" description="Manage your profile, orders, and preferences." /> })));
const WishlistPage = lazy(() => import('./pages/PlaceholderPage').then(m => ({ default: () => <m.default title="Wishlist" description="Your saved items — buy them before they're gone!" /> })));
const TryOnPage = lazy(() => import('./pages/PlaceholderPage').then(m => ({ default: () => <m.default title="Virtual Try-On ✨" description="AI-powered fitting room — see clothes on yourself." /> })));
const StyleBuilderPage = lazy(() => import('./pages/PlaceholderPage').then(m => ({ default: () => <m.default title="Style Builder" description="Build complete outfits and add them to cart." /> })));
const AdminDashboard = lazy(() => import('./pages/PlaceholderPage').then(m => ({ default: () => <m.default title="Admin Dashboard" description="Manage products, orders, and customers." /> })));

// ─── Loading Spinner ─────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="spinner" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Loading...
        </p>
      </div>
    </div>
  );
}

// ─── App Root ────────────────────────────────────────────────
function App() {
  const { theme } = useThemeStore();
  const { setSession, fetchProfile, setLoading } = useAuthStore();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initialize auth listener
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, fetchProfile, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── Standalone pages (no Navbar/Footer) ─── */}
              <Route
                path="/auth"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AuthPage />
                  </Suspense>
                }
              />

              {/* ── Main app with Navbar + Footer ──────── */}
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<Suspense fallback={<PageLoader />}><ProductListPage /></Suspense>} />
                <Route path="/product/:id" element={<Suspense fallback={<PageLoader />}><ProductDetailPage /></Suspense>} />
                <Route path="/cart" element={<Suspense fallback={<PageLoader />}><CartPage /></Suspense>} />
                <Route path="/checkout" element={<Suspense fallback={<PageLoader />}><CheckoutPage /></Suspense>} />
                <Route path="/account/*" element={<Suspense fallback={<PageLoader />}><AccountPage /></Suspense>} />
                <Route path="/wishlist" element={<Suspense fallback={<PageLoader />}><WishlistPage /></Suspense>} />
                <Route path="/try-on" element={<Suspense fallback={<PageLoader />}><TryOnPage /></Suspense>} />
                <Route path="/style-builder" element={<Suspense fallback={<PageLoader />}><StyleBuilderPage /></Suspense>} />
                {/* Hidden Admin Route */}
                <Route path="/admin-dashboard/*" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
                {/* 404 */}
                <Route path="*" element={<PlaceholderPage title="404 — Page Not Found" description="The page you're looking for doesn't exist." />} />
              </Route>
            </Routes>
          </Suspense>
        </AnimatePresence>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
