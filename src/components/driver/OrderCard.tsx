// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Order Card (Available)
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { type DriverDelivery } from '../../store/driverStore';
import { timeAgo, distanceKm, getOrderCoords } from '../../hooks/useDriver';
import { useDriverStore } from '../../store/driverStore';

interface OrderCardProps {
  order: DriverDelivery;
  onAccept: (orderId: string) => void;
}

export default function OrderCard({ order, onAccept }: OrderCardProps) {
  const [accepting, setAccepting] = useState(false);
  const { driverLocation } = useDriverStore();
  const company = order.courier_companies;

  const itemCount = order.order_items?.length || 0;
  const earnings = order.driver_earnings || Math.round((order.total_amount || 0) * 0.1);

  const pickupAddr = order.pickup_address || 'FashionVerse Warehouse';
  const dropAddrObj = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {});
  const addrStr = order.drop_address || [dropAddrObj.line1, dropAddrObj.city, dropAddrObj.state].filter(Boolean).join(', ') || 'Customer Location';

  const [lat, lng] = order.drop_lat && order.drop_lng
    ? [order.drop_lat, order.drop_lng]
    : getOrderCoords(order.id, 11.0168, 76.9558);
  const dist = distanceKm(driverLocation[0], driverLocation[1], lat, lng).toFixed(1);
  const estMin = Math.max(5, Math.round(parseFloat(dist) * 4));

  const handleAccept = async () => {
    setAccepting(true);
    await onAccept(order.id);
    setAccepting(false);
  };

  return (
    <div className="dh-order-card">
      {/* Row 1: Company + Earnings */}
      <div className="dh-order-row">
        <div className="dh-order-company">
          {company ? (
            <div
              className="dh-order-company-logo"
              style={{ background: company.brand_color || '#444' }}
            >
              {company.name?.charAt(0)}
            </div>
          ) : (
            <div className="dh-order-company-logo" style={{ background: '#444' }}>
              F
            </div>
          )}
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dh-text)' }}>
              {company?.name || 'FashionVerse'}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--dh-muted)' }}>
              #FV-{order.id.slice(0, 6).toUpperCase()}
            </p>
          </div>
        </div>
        <span className="dh-order-earnings">₹{earnings}</span>
      </div>

      {/* Row 2: Items + Accept */}
      <div
        className="dh-order-row"
        style={{ marginTop: '10px', alignItems: 'center' }}
      >
        <span style={{ fontSize: '12px', color: 'var(--dh-muted)' }}>
          📦 {itemCount} item{itemCount !== 1 ? 's' : ''} · Fashion wear
        </span>
        <button
          className="dh-accept-btn"
          onClick={handleAccept}
          disabled={accepting}
          style={{ opacity: accepting ? 0.6 : 1 }}
        >
          {accepting ? '...' : 'ACCEPT'}
        </button>
      </div>

      {/* Row 3: Pickup */}
      <p className="dh-order-address pickup" style={{ marginTop: '8px' }}>
        📍 Pickup: {pickupAddr}
      </p>

      {/* Row 4: Drop */}
      <p className="dh-order-address drop">
        🏠 Drop: {addrStr}
      </p>

      {/* Row 5: Meta */}
      <div className="dh-order-meta">
        <span>
          <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
          {timeAgo(order.created_at)} · Est. {estMin} min
        </span>
        <span style={{ fontSize: '12px', color: 'var(--dh-blue)', fontWeight: 600 }}>
          {dist} km
        </span>
      </div>
    </div>
  );
}
