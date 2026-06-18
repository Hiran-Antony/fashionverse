// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Main App Wrapper
// Route: /delivery-dashboard
// Replaces the old monolithic DeliveryDashboard.tsx
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useDriverStore, type DriverDelivery } from '../store/driverStore';
import { useDriver } from '../hooks/useDriver';
import { supabase } from '../lib/supabase';

// CSS
import '../styles/driver-hub.css';

// Components
import DriverHeader from '../components/driver/DriverHeader';
import StatusBar from '../components/driver/StatusBar';
import StatsRow from '../components/driver/StatsRow';
import DriverNav from '../components/driver/DriverNav';
import OTPModal from '../components/driver/OTPModal';

// Tab Pages
import OrdersTab from './driver/OrdersTab';
import ActiveTab from './driver/ActiveTab';
import MapTab from './driver/MapTab';
import DoneTab from './driver/DoneTab';
import ProfileTab from './driver/ProfileTab';

// ── Driver Registration (lazy — only for new drivers) ─────────
const DriverRegistration = lazy(() => import('./driver/DriverRegistration'));

// Offline overlay
function OfflineOverlay({ onGoOnline }: { onGoOnline: () => void }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--dh-bg)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          background: 'var(--dh-card)',
          border: '2px dashed var(--dh-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '28px',
          fontSize: '44px',
        }}
      >
        📴
      </div>
      <h3
        style={{
          fontSize: '28px',
          fontWeight: 800,
          marginBottom: '10px',
        }}
      >
        You are Offline
      </h3>
      <p
        style={{
          fontSize: '15px',
          color: 'var(--dh-muted)',
          lineHeight: 1.7,
          marginBottom: '40px',
          maxWidth: '280px',
        }}
      >
        Go online to start receiving new orders and earning today.
      </p>
      <button
        onClick={onGoOnline}
        style={{
          padding: '18px 48px',
          background: 'var(--dh-green)',
          border: 'none',
          borderRadius: '50px',
          color: '#000',
          fontSize: '17px',
          fontWeight: 800,
          cursor: 'pointer',
          fontFamily: "'Inter', sans-serif",
          boxShadow: '0 8px 32px rgba(0,200,83,0.4)',
          letterSpacing: '0.04em',
        }}
      >
        GO ONLINE
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const { user, profile, isDeliveryApproved } = useAuthStore();
  const { activeTab, isOnline, setOnline, activeDeliveries, isSidebarOpen, setActiveTab } = useDriverStore();

  const {
    acceptOrder,
    verifyDeliveryPin,
    todayEarnings,
    todayCount,
    totalDeliveries,
    totalEarnings,
    driverTier,
    weeklyData,
    fetchOrders,
  } = useDriver();

  const [otpOrder, setOtpOrder] = useState<DriverDelivery | null>(null);
  const [mapMounted, setMapMounted] = useState(false);

  // ── Registration flow state (new drivers only) ───────────
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationChecked, setRegistrationChecked] = useState(false);

  // ── Auth guard ──────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      navigate('/delivery/apply', { replace: true });
      return;
    }
    if (profile && !isDeliveryApproved) {
      navigate('/delivery/apply', { replace: true });
    }
  }, [user, profile, isDeliveryApproved, navigate]);

  // ── Check affiliations for new driver registration ──────
  useEffect(() => {
    if (!user || !isDeliveryApproved || registrationChecked) return;

    const checkAffiliations = async () => {
      try {
        const { data: affiliations } = await supabase
          .from('driver_companies')
          .select('id')
          .eq('driver_id', user.id);

        setRegistrationChecked(true);
        if (!affiliations || affiliations.length === 0) {
          setShowRegistration(true);
        }
      } catch (_err) {
        // On error (e.g. table doesn't exist yet), skip registration
        setRegistrationChecked(true);
      }
    };

    checkAffiliations();
  }, [user, isDeliveryApproved, registrationChecked]);

  const handleRegistrationComplete = () => {
    setShowRegistration(false);
    setActiveTab('orders');
  };

  // ── Override body background ────────────────────────────
  useEffect(() => {
    const prevBg = document.body.style.background;
    const prevBgImg = document.body.style.backgroundImage;
    const prevBgColor = document.body.style.backgroundColor;
    document.body.style.background = '#0a0a0a';
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#0a0a0a';
    return () => {
      document.body.style.background = prevBg;
      document.body.style.backgroundImage = prevBgImg;
      document.body.style.backgroundColor = prevBgColor;
    };
  }, []);

  // Mount map lazily on first visit
  useEffect(() => {
    if (activeTab === 'map' && !mapMounted) {
      setMapMounted(true);
    }
  }, [activeTab, mapMounted]);

  const handleMarkDelivered = (order: DriverDelivery) => {
    setOtpOrder(order);
  };

  const handleOtpSuccess = () => {
    setOtpOrder(null);
    useDriverStore.getState().setActiveTab('done');
    fetchOrders();
  };

  return (
    <>
      <div className={`dh-root ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} data-lenis-prevent="true">
        <div className="dh-container">
          <div className="dh-content-wrapper">
            {/* Header */}
            <DriverHeader />

            {/* Status Bar */}
            <StatusBar />

            {/* Stats Row (only when online) */}
            {isOnline && (
              <StatsRow
                earnings={Math.round(todayEarnings)}
                done={todayCount}
                inProgress={activeDeliveries.length}
              />
            )}

            {/* Offline overlay */}
            {!isOnline && <OfflineOverlay onGoOnline={() => setOnline(true)} />}

            {/* Tab Content */}
            {isOnline && (
              <div className="dh-tab-content">
                {/* Orders Tab */}
                <div className={`dh-tab-panel ${activeTab === 'orders' ? 'active' : ''}`}>
                  <OrdersTab onAcceptOrder={acceptOrder} />
                </div>

                {/* Active Tab */}
                <div className={`dh-tab-panel ${activeTab === 'active' ? 'active' : ''}`}>
                  <ActiveTab onMarkDelivered={handleMarkDelivered} />
                </div>

                {/* Map Tab — uses CSS show/hide to preserve Leaflet instance */}
                <div
                  className={`dh-tab-panel ${activeTab === 'map' ? 'active' : ''}`}
                  style={{ display: mapMounted ? (activeTab === 'map' ? 'block' : 'none') : 'none' }}
                >
                  {mapMounted && <MapTab key={activeDeliveries.length} />}
                </div>

                {/* Done Tab */}
                <div className={`dh-tab-panel ${activeTab === 'done' ? 'active' : ''}`}>
                  <DoneTab />
                </div>

                {/* Profile Tab */}
                <div className={`dh-tab-panel ${activeTab === 'profile' ? 'active' : ''}`}>
                  <ProfileTab
                    todayCount={todayCount}
                    todayEarnings={todayEarnings}
                    totalDeliveries={totalDeliveries}
                    totalEarnings={totalEarnings}
                    driverTier={driverTier}
                    weeklyData={weeklyData}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Nav */}
          <DriverNav />

          {/* OTP Modal */}
          {otpOrder && (
            <OTPModal
              order={otpOrder}
              onClose={() => setOtpOrder(null)}
              onVerify={verifyDeliveryPin}
              onSuccess={handleOtpSuccess}
            />
          )}
        </div>
      </div>

      {/* ── Driver Registration — rendered OUTSIDE dh-root so position:fixed
           is truly viewport-level, not clipped by dh-root's overflow:hidden ── */}
      {showRegistration && user && (
        <Suspense fallback={null}>
          <DriverRegistration
            driverId={user.id}
            onComplete={handleRegistrationComplete}
            onBack={() => {
              setShowRegistration(false);
              navigate('/delivery/apply', { replace: true });
            }}
          />
        </Suspense>
      )}
    </>
  );
}
