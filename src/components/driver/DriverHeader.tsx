// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Header Component
// ═══════════════════════════════════════════════════════════════

import { Bell, Menu, Truck, Zap } from 'lucide-react';
import { useDriverStore } from '../../store/driverStore';
import { useAuthStore } from '../../store/authStore';

export default function DriverHeader() {
  const { profile } = useAuthStore();
  const { newOrderCount, bellShaking, setActiveTab, availableOrders, toggleSidebar } = useDriverStore();
  const initial = profile?.name?.charAt(0)?.toUpperCase() || 'D';

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      background: 'rgba(10, 10, 10, 0.75)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button
          onClick={toggleSidebar}
          className="dh-hamburger-btn"
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
        >
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #00C853, #009624)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,200,83,0.35)' }}>
            <Truck size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>
            FashionVerse <span style={{ color: '#00C853' }}>Hub</span>
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 200, 83, 0.1)', padding: '6px 14px', borderRadius: '24px', border: '1px solid rgba(0, 200, 83, 0.2)' }}>
         <Zap size={14} color="#00C853" fill="#00C853" />
         <span style={{ fontSize: '13px', fontWeight: 700, color: '#00C853', letterSpacing: '0.5px' }}>LIVE</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          style={{
             position: 'relative', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', transition: 'all 0.2s ease'
          }}
          onClick={() => setActiveTab('orders')}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <Bell size={20} className={bellShaking ? 'shake-animation' : ''} />
          {(newOrderCount > 0 || availableOrders.length > 0) && (
            <span style={{ position: 'absolute', top: '10px', right: '12px', width: '8px', height: '8px', background: '#FF3D00', borderRadius: '50%', boxShadow: '0 0 10px #FF3D00' }} />
          )}
        </button>
        <div
          onClick={() => setActiveTab('profile')}
          style={{
            width: '44px', height: '44px', borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', color: '#fff', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.1)', transition: 'border 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#00C853'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        >
          {initial}
        </div>
      </div>
    </header>
  );
}
