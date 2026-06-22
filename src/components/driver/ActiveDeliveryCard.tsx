// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Active Delivery Card
// ═══════════════════════════════════════════════════════════════

import { Phone, MapPin } from 'lucide-react';
import { type DriverDelivery } from '../../store/driverStore';
import { distanceKm, getOrderCoords } from '../../hooks/useDriver';
import { useDriverStore } from '../../store/driverStore';

interface ActiveDeliveryCardProps {
  order: DriverDelivery;
  onMarkDelivered: (order: DriverDelivery) => void;
  onOpenMap: () => void;
}

export default function ActiveDeliveryCard({ order, onMarkDelivered, onOpenMap }: ActiveDeliveryCardProps) {
  const { driverLocation } = useDriverStore();
  const company = order.courier_companies;
  const dropAddr = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {});
  const addrStr = order.drop_address || [dropAddr.line1, dropAddr.line2, dropAddr.city, dropAddr.state, dropAddr.pincode].filter(Boolean).join(', ') || 'Customer Location';
  const customerName = order.customer_name || dropAddr.name || 'Customer';
  const customerPhone = order.customer_phone || dropAddr.phone;
  const earnings = order.driver_earnings || Math.round((order.total_amount || 0) * 0.1);

  const [lat, lng] = order.drop_lat && order.drop_lng
    ? [order.drop_lat, order.drop_lng]
    : getOrderCoords(order.id, 11.0168, 76.9558); // Fixed hub location (Coimbatore)
  const dist = distanceKm(driverLocation[0], driverLocation[1], lat, lng).toFixed(1);

  // Progress: assigned = 33%, picked/in_transit = 66%
  const progressPercent = order.status === 'out_for_delivery' ? 66 : order.status === 'assigned' ? 33 : 33;

  return (
    <div className="dh-active-card">
      {/* Top Row */}
      <div className="dh-order-row" style={{ marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {company && (
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: company.brand_color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {company.name?.charAt(0)}
            </div>
          )}
          <span style={{ fontSize: '14px', fontWeight: 700 }}>
            ORDER #FV-{order.id.slice(0, 6).toUpperCase()}
          </span>
        </div>
        <div className="dh-live-pill">
          <span className="dh-live-dot" />
          LIVE
        </div>
      </div>

      {/* Progress Bar */}
      <div className="dh-progress-bar-track">
        <div className="dh-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Customer + Contact */}
      <p style={{ fontSize: '13px', color: 'var(--dh-muted)', marginBottom: '8px' }}>
        📞 Customer: {customerName}
      </p>

      {customerPhone && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <a href={`tel:${customerPhone}`} className="dh-contact-btn call">
            <Phone size={14} /> Call
          </a>
          <a
            href={`https://wa.me/91${customerPhone.replace(/\D/g, '')}?text=Hi%2C+I'm+your+FashionVerse+delivery+partner.+I'll+reach+you+shortly!`}
            target="_blank"
            rel="noopener noreferrer"
            className="dh-contact-btn whatsapp"
          >
            WhatsApp
          </a>
        </div>
      )}

      {/* Drop Address */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
          padding: '10px',
          background: '#0a0a0a',
          borderRadius: '10px',
          border: '1px solid var(--dh-border)',
          marginBottom: '4px',
        }}
      >
        <MapPin size={14} style={{ color: 'var(--dh-orange)', flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '13px', color: 'var(--dh-muted)', lineHeight: 1.5 }}>{addrStr}</p>
      </div>

      {/* Meta */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--dh-muted)',
          margin: '8px 0 0',
        }}
      >
        <span>
          <MapPin size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {dist} km away
        </span>
        <span style={{ color: 'var(--dh-green)', fontWeight: 700 }}>₹{earnings}</span>
      </div>

      {/* Action Row */}
      <div className="dh-action-row">
        <button className="dh-btn-outline" onClick={onOpenMap}>
          🗺 OPEN MAP
        </button>
        <button className="dh-btn-solid" onClick={() => onMarkDelivered(order)}>
          ✓ MARK DELIVERED
        </button>
      </div>
    </div>
  );
}
