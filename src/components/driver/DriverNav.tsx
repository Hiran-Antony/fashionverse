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
            className={`nav-tab ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ border: 'none', background: 'none' }}
          >
            {/* Badge */}
            {badge > 0 && <span className="dh-nav-badge">{badge}</span>}

            {/* Icon */}
            <span className="dh-nav-icon">{tab.icon}</span>

            {/* Label */}
            <span className="nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
