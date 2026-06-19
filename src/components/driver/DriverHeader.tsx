import { useState, useEffect } from 'react';
import { Bell, Menu, Truck, Zap } from 'lucide-react';
import { useDriverStore } from '../../store/driverStore';
import { useAuthStore } from '../../store/authStore';
import { timeAgo } from '../../hooks/useDriver';

export default function DriverHeader() {
  const { profile } = useAuthStore();
  const {
    newOrderCount,
    setNewOrderCount,
    bellShaking,
    setActiveTab,
    availableOrders,
    activeDeliveries,
    toggleSidebar
  } = useDriverStore();
  const initial = profile?.name?.charAt(0)?.toUpperCase() || 'D';
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!showNotifications) return;
    const handleClose = () => setShowNotifications(false);
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [showNotifications]);

  const notifications = [
    ...availableOrders.map((o) => ({
      id: `avail-${o.id}`,
      title: 'New Order Available',
      message: `Claim order from ${o.courier_companies?.name || 'partner'} (Earn ₹${o.driver_earnings || Math.round((o.total_amount || 0) * 0.1)})`,
      time: o.created_at ? timeAgo(o.created_at) : 'just now',
      type: 'order',
      action: () => {
        setActiveTab('orders');
        setShowNotifications(false);
      }
    })),
    ...activeDeliveries.map((o) => ({
      id: `active-${o.id}`,
      title: 'Delivery In Progress',
      message: `Deliver to ${o.address?.name || 'Customer'} (${o.address?.city || ''})`,
      time: o.claimed_at ? timeAgo(o.claimed_at) : 'ongoing',
      type: 'delivery',
      action: () => {
        setActiveTab('active');
        setShowNotifications(false);
      }
    })),
    {
      id: 'sys-welcome',
      title: 'System Active',
      message: 'Welcome to FashionVerse Hub! Set status to Live to receive drops.',
      time: 'system',
      type: 'system',
      action: () => setShowNotifications(false)
    },
    {
      id: 'sys-tier',
      title: 'Bronze Partner Tier',
      message: 'Unlock Silver Tier at 50+ successful deliveries to boost earnings.',
      time: 'system',
      type: 'tier',
      action: () => {
        setActiveTab('profile');
        setShowNotifications(false);
      }
    }
  ];

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      background: 'var(--glass-bg, rgba(26, 15, 0, 0.78))',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--dh-border)',
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
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--dh-green), var(--dh-gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px var(--dh-green-glow)' }}>
            <Truck size={20} color="#120a06" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>
            FashionVerse <span style={{ color: 'var(--dh-green)' }}>Hub</span>
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--dh-green-glow)', padding: '6px 14px', borderRadius: '24px', border: '1px solid var(--dh-green-border)' }}>
         <Zap size={14} color="var(--dh-green)" fill="var(--dh-green)" />
         <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dh-green)', letterSpacing: '0.5px' }}>LIVE</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
        <button
          style={{
             position: 'relative', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', transition: 'all 0.2s ease'
          }}
          onClick={(e) => {
            e.stopPropagation();
            setShowNotifications(!showNotifications);
            setNewOrderCount(0);
          }}
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
            width: '44px', height: '44px', borderRadius: '50%', background: 'var(--dh-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', color: '#fff', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.1)', transition: 'border 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--dh-green)'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        >
          {initial}
        </div>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div
            className="dh-notifications-dropdown"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '56px',
              right: 0,
              width: '320px',
              maxHeight: '400px',
              background: 'rgba(26, 15, 6, 0.96)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(201, 168, 76, 0.25)',
              borderRadius: '16px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 100,
              overflow: 'hidden',
              animation: 'dh-fade-in 0.2s ease',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid rgba(201, 168, 76, 0.15)',
              background: 'rgba(201, 168, 76, 0.04)'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--dh-green)', letterSpacing: '1px' }}>
                NOTIFICATIONS
              </span>
              {newOrderCount > 0 && (
                <button
                  onClick={() => setNewOrderCount(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--dh-muted)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Clear Badge
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--dh-muted)', fontSize: '13px' }}>
                  No active alerts
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={notif.action}
                    style={{
                      padding: '12px 18px',
                      borderBottom: '1px solid rgba(201, 168, 76, 0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(201, 168, 76, 0.06)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'baseline' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: notif.type === 'order' ? 'var(--dh-green)' : notif.type === 'delivery' ? 'var(--dh-blue)' : '#fff'
                      }}>
                        {notif.title}
                      </span>
                      <span style={{ fontSize: '9px', color: 'var(--dh-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        {notif.time}
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--dh-text)', opacity: 0.85, margin: 0, lineHeight: 1.45 }}>
                      {notif.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
