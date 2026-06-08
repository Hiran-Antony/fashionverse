import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { queryClient } from './lib/queryClient';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';

import Layout from './components/layout/Layout';
import SmoothScroll from './components/SmoothScroll';
import PageTransition from './components/PageTransition';
import GoldParticles from './components/GoldParticles';
import HomePage from './pages/HomePage';
import PlaceholderPage from './pages/PlaceholderPage';

// ─── Lazy-loaded pages (code splitting) ──────────────────────
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const TryOnPage = lazy(() => import('./pages/TryOnPage'));
const StyleBuilderPage = lazy(() => import('./pages/StyleBuilderPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// ─── Loading Spinner ─────────────────────────────────────────
function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("/photos/hero-bg.jpeg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: 'scale(1.05)',
        }}
      />
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-0" />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-[#C9973A]/20 border-t-[#C9973A] rounded-full animate-spin" />
        <p className="text-sm tracking-[0.2em] uppercase font-bold text-[#C9973A]">
          Loading FashionVerse
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
    // Get initial session — wrapped in try/catch so mock/unconfigured Supabase never crashes
    supabase.auth.getSession()
      .then(({ data }) => {
        const session = data?.session ?? null;
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
        }
      })
      .catch((err) => {
        console.warn('Auth session init error:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    // Listen for auth changes
    let unsubscribe = () => {};
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      });
      unsubscribe = subscription.unsubscribe.bind(subscription);
    } catch (err) {
      console.warn('Auth state change listener error:', err);
    }

    return () => unsubscribe();
  }, [setSession, fetchProfile, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <GoldParticles />
      <BrowserRouter>
        <SmoothScroll>
          <PageTransition>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* ── Standalone pages (no Navbar/Footer) ─── */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/order-confirmation" element={<OrderConfirmationPage />} />

                {/* ── Admin Dashboard (standalone, no Navbar/Footer) ─── */}
                <Route path="/admin-dashboard/*" element={<AdminDashboard />} />

                {/* ── Main app with Navbar + Footer ──────── */}
                <Route element={<Layout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductListPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/account/*" element={<AccountPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/try-on" element={<TryOnPage />} />
                  <Route path="/style-builder" element={<StyleBuilderPage />} />
                  <Route path="*" element={<PlaceholderPage title="404 — Page Not Found" description="The page you're looking for doesn't exist." />} />
                </Route>
              </Routes>
            </Suspense>
          </PageTransition>
        </SmoothScroll>
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
