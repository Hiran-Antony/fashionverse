import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';

import Layout from './components/layout/Layout';
import SmoothScroll from './components/SmoothScroll';
import PageTransition from './components/PageTransition';
import GoldParticles from './components/GoldParticles';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import PageSkeleton from './components/PageSkeleton';
import AdminSecureRoute from './components/admin/AdminSecureRoute';

// ─── Lazy-loaded pages (code splitting) ──────────────────────
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage'));
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const TryOnPage = lazy(() => import('./pages/TryOnPage'));
const StyleBuilderPage = lazy(() => import('./pages/StyleBuilderPage'));
const StyleMatchPage = lazy(() => import('./pages/StyleMatchPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const MenPage = lazy(() => import('./pages/MenPage'));
const WomenPage = lazy(() => import('./pages/WomenPage'));
const KidsPage = lazy(() => import('./pages/KidsPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const DeliveryApplyPage = lazy(() => import('./pages/DeliveryApplyPage'));
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard'));



// ─── Route-aware gold particles (hidden on delivery dashboard) ──
function GoldParticlesGuard() {
  const { pathname } = useLocation();
  const hidden = pathname === '/delivery-dashboard' || pathname.startsWith('/delivery-dashboard')
    || pathname === '/driver' || pathname.startsWith('/driver');
  if (hidden) return null;
  return <GoldParticles />;
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
    <>
      <BrowserRouter>
        <GoldParticlesGuard />
        <SmoothScroll>
          <PageTransition>
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                {/* ── Standalone pages (no Navbar/Footer) ─── */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/order-confirmation" element={<OrderConfirmationPage />} />

                {/* ── Delivery System pages (standalone) ─── */}
                <Route path="/delivery/apply" element={<DeliveryApplyPage />} />
                <Route path="/delivery-dashboard" element={<DeliveryDashboard />} />
                <Route path="/driver" element={<DeliveryDashboard />} />

                {/* ── Admin Dashboard (standalone, no Navbar/Footer) ─── */}
                <Route path="/admin-dashboard/*" element={<Navigate to="/404" replace />} />
                <Route path="/fv-secure-panel-x7k9m2/*" element={
                  <AdminSecureRoute>
                    <AdminDashboard />
                  </AdminSecureRoute>
                } />

                {/* ── Main app with Navbar + Footer ──────── */}
                <Route element={<Layout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/men" element={<MenPage />} />
                  <Route path="/women" element={<WomenPage />} />
                  <Route path="/kids" element={<KidsPage />} />
                  <Route path="/category-preview-hidden" element={<CategoryPage category="men" heroTitle="Preview" subTabs={[]} />} />
                  <Route path="/products" element={<ProductListPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/account/*" element={<AccountPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/try-on" element={<TryOnPage />} />
                  <Route path="/style-builder" element={<StyleBuilderPage />} />
                  <Route path="/style-match" element={<StyleMatchPage />} />
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
            fontSize: '0.875rem',
          },
        }}
      />
    </>
  );
}

export default App;

