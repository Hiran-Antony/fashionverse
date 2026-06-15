// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Done Tab (Completed Deliveries)
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import CompletedCard from '../../components/driver/CompletedCard';
import { useDriverStore } from '../../store/driverStore';

type FilterPeriod = 'today' | 'week' | 'month';

export default function DoneTab() {
  const { completedDeliveries } = useDriverStore();
  const [filter, setFilter] = useState<FilterPeriod>('today');

  const now = new Date();

  const filteredOrders = useMemo(() => {
    return completedDeliveries.filter((o) => {
      if (!o.delivered_at) return false;
      const d = new Date(o.delivered_at);
      switch (filter) {
        case 'today':
          return d.toDateString() === now.toDateString();
        case 'week': {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return d >= weekAgo;
        }
        case 'month': {
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return d >= monthAgo;
        }
        default:
          return true;
      }
    });
  }, [completedDeliveries, filter]);

  const totalEarnings = filteredOrders.reduce(
    (sum, o) => sum + (o.driver_earnings || Math.round((o.total_amount || 0) * 0.1)),
    0
  );
  const avgPerDrop = filteredOrders.length > 0 ? Math.round(totalEarnings / filteredOrders.length) : 0;

  const filterLabel = filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : 'This Month';

  return (
    <div>
      {/* Summary Card */}
      <div className="dh-summary-card" style={{ marginTop: '4px' }}>
        <p style={{ fontSize: '12px', color: 'var(--dh-muted)', marginBottom: '4px' }}>{filterLabel}</p>
        <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--dh-gold)', lineHeight: 1 }}>
          ₹{totalEarnings.toLocaleString('en-IN')}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--dh-muted)', marginTop: '6px' }}>
          {filteredOrders.length} deliveries · Avg ₹{avgPerDrop}/drop
        </p>
      </div>

      {/* Filter Pills */}
      <div className="dh-filter-pills">
        {(['today', 'week', 'month'] as FilterPeriod[]).map((period) => (
          <button
            key={period}
            className={`dh-filter-pill ${filter === period ? 'active' : ''}`}
            onClick={() => setFilter(period)}
          >
            {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Completed Orders */}
      {filteredOrders.length > 0 ? (
        filteredOrders.map((order) => <CompletedCard key={order.id} order={order} />)
      ) : (
        <div className="dh-empty-state">
          <div className="dh-empty-check">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="var(--dh-green)" strokeWidth="4" fill="none"
                strokeDasharray="226" strokeDashoffset="0"
                style={{ animation: 'dh-draw-check 1s ease forwards' }} />
              <path
                d="M25 42L35 52L55 30"
                stroke="var(--dh-green)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray="60"
                strokeDashoffset="0"
                style={{ animation: 'dh-draw-check 0.8s ease 0.3s forwards' }}
              />
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 600, marginTop: '16px' }}>
            {filter === 'today' ? 'No deliveries today yet' : 'No deliveries in this period'}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--dh-muted)', marginTop: '4px' }}>
            Complete deliveries to see them here
          </p>
        </div>
      )}
    </div>
  );
}
