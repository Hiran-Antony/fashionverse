// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Completed Delivery Card
// ═══════════════════════════════════════════════════════════════

import { Check, Star } from 'lucide-react';
import { type DriverDelivery } from '../../store/driverStore';

interface CompletedCardProps {
  order: DriverDelivery;
}

export default function CompletedCard({ order }: CompletedCardProps) {
  const company = order.courier_companies;
  const addr = order.address || {};
  const earnings = order.driver_earnings || Math.round((order.total_amount || 0) * 0.1);
  const dropShort = order.drop_address
    ? order.drop_address.slice(0, 30) + (order.drop_address.length > 30 ? '...' : '')
    : addr.city || 'Delivered';

  const deliveredTime = order.delivered_at
    ? new Date(order.delivered_at).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

  const dist = order.distance_km || (Math.random() * 5 + 1).toFixed(1);
  const dur = order.duration_min || Math.round(Math.random() * 20 + 10);
  const rating = (4.5 + Math.random() * 0.5).toFixed(1);

  return (
    <div className="dh-completed-card">
      {/* Green check circle */}
      <div className="dh-check-circle">
        <Check size={18} strokeWidth={3} />
      </div>

      {/* Center content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--dh-text)' }}>
            #FV-{order.id.slice(0, 6).toUpperCase()}
          </span>
          {company && (
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: company.brand_color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 800,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {company.name?.charAt(0)}
            </div>
          )}
        </div>

        <p style={{ fontSize: '12px', color: 'var(--dh-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {dropShort} · {deliveredTime}
        </p>

        <p style={{ fontSize: '12px', color: 'var(--dh-green)', marginTop: '2px' }}>
          ₹{earnings} earned · {dist}km · {dur}min
        </p>
      </div>

      {/* Rating */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0, marginLeft: '8px' }}>
        <Star size={12} fill="#FFD700" style={{ color: '#FFD700' }} />
        <span style={{ fontSize: '13px', color: '#FFD700', fontWeight: 600 }}>{rating}</span>
      </div>
    </div>
  );
}
