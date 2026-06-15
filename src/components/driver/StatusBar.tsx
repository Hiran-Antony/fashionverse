// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Status Bar (Online/Offline Toggle)
// ═══════════════════════════════════════════════════════════════

import { useDriverStore } from '../../store/driverStore';

export default function StatusBar() {
  const { isOnline, toggleOnline } = useDriverStore();

  return (
    <div
      className={`dh-status-bar ${isOnline ? 'online' : 'offline'}`}
      onClick={toggleOnline}
      role="button"
      tabIndex={0}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className={`dh-status-dot ${isOnline ? 'online' : 'offline'}`} />
        <div>
          <p
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: isOnline ? 'var(--dh-green)' : 'var(--dh-red)',
              lineHeight: 1,
            }}
          >
            {isOnline ? '● You are Online' : '○ You are Offline'}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--dh-muted)', marginTop: '3px' }}>
            {isOnline ? 'Tap to go offline' : 'Tap to go online'}
          </p>
        </div>
      </div>
      <div className={`dh-toggle-track ${isOnline ? 'online' : 'offline'}`}>
        <div className={`dh-toggle-thumb ${isOnline ? 'online' : 'offline'}`} />
      </div>
    </div>
  );
}
