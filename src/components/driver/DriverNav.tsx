// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Bottom Navigation
// ═══════════════════════════════════════════════════════════════

import { Package, Truck, Map, CheckCircle, User } from 'lucide-react';
import { useDriverStore, type DriverTab } from '../../store/driverStore';

const TABS: { id: DriverTab; label: string; icon: React.ReactNode }[] = [
  { id: 'orders',  label: 'ORDERS',  icon: <Package size={22} /> },
  { id: 'active',  label: 'ACTIVE',  icon: <Truck size={22} /> },
  { id: 'map',     label: 'MAP',     icon: <Map size={22} /> },
  { id: 'done',    label: 'DONE',    icon: <CheckCircle size={22} /> },
  { id: 'profile', label: 'PROFILE', icon: <User size={22} /> },
];

export default function DriverNav() {
  const { activeTab, setActiveTab, availableOrders, activeDeliveries } = useDriverStore();

  return (
    <nav className="driver-nav">
      {/* Desktop Logo */}
      <div className="dh-nav-logo">
        <div className="dh-logo-cube">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7.5L12 13L22 7.5L12 2Z" fill="url(#topGlow)"/>
            <path d="M2 7.5V18.5L12 24V13L2 7.5Z" fill="url(#leftSide)"/>
            <path d="M22 7.5V18.5L12 24V13L22 7.5Z" fill="url(#rightSide)"/>
            <defs>
              <linearGradient id="topGlow" x1="2" y1="7.5" x2="22" y2="7.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00FF87"/>
                <stop offset="1" stopColor="#60EFFF"/>
              </linearGradient>
              <linearGradient id="leftSide" x1="2" y1="7.5" x2="12" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00C853"/>
                <stop offset="1" stopColor="#007A33"/>
              </linearGradient>
              <linearGradient id="rightSide" x1="22" y1="7.5" x2="12" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00963E"/>
                <stop offset="1" stopColor="#004D1F"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="dh-logo-text-wrapper">
          <span className="dh-logo-text">FashionVerse</span>
          <span className="dh-logo-sub">DELIVERY PARTNER</span>
        </div>
      </div>

      <div className="dh-nav-links">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const badge =
            tab.id === 'orders'
              ? availableOrders.length
              : tab.id === 'active'
              ? activeDeliveries.length
              : 0;

          return (
            <button
              key={tab.id}
              className={`dh-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ border: 'none', background: 'none' }}
            >
              {/* Badge */}
              {badge > 0 && <span className="dh-nav-badge">{badge}</span>}

              {/* Icon */}
              <span className="dh-nav-icon">{tab.icon}</span>

              {/* Label */}
              <span className="dh-nav-label">{tab.label}</span>
              
              {/* Glow indicator */}
              {isActive && <div className="dh-nav-glow" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
