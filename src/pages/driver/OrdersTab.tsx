// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Orders Tab (Available Orders)
// ═══════════════════════════════════════════════════════════════

import CompanyFilter from '../../components/driver/CompanyFilter';
import OrderCard from '../../components/driver/OrderCard';
import { useDriverStore } from '../../store/driverStore';

interface OrdersTabProps {
  onAcceptOrder: (orderId: string) => Promise<boolean>;
}

export default function OrdersTab({ onAcceptOrder }: OrdersTabProps) {
  const { availableOrders, selectedCompanyId, newOrderCount, isLoading } = useDriverStore();

  // Filter by selected company
  const filteredOrders = selectedCompanyId
    ? availableOrders.filter((o) => o.courier_companies?.id === selectedCompanyId)
    : availableOrders;

  return (
    <div>
      {/* Company Filter */}
      <CompanyFilter />

      {/* Section Header */}
      <div className="section-header">
        <div className="section-title">
          <div className="pulse-dot" />
          <span>Available Orders</span>
        </div>
        {filteredOrders.length > 0 && (
          <span className="new-badge">{filteredOrders.length} NEW</span>
        )}
      </div>

      {/* Loading */}
      {isLoading && availableOrders.length === 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="dh-spinner" />
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.map((order) => (
        <OrderCard key={order.id} order={order} onAccept={onAcceptOrder} />
      ))}

      {/* Empty State */}
      {!isLoading && filteredOrders.length === 0 && (
        <div className="empty-state">
          <div className="truck-track">
            <svg className="truck-anim" width="60" height="40" viewBox="0 0 60 40">
              <rect x="2" y="10" width="35" height="22" rx="3" fill="#00C853"/>
              <rect x="37" y="18" width="18" height="14" rx="2" fill="#00C853"/>
              <circle cx="12" cy="34" r="5" fill="#111" stroke="#00C853" strokeWidth="2"/>
              <circle cx="45" cy="34" r="5" fill="#111" stroke="#00C853" strokeWidth="2"/>
              <rect x="37" y="18" width="18" height="10" rx="1" fill="#0a3d1f"/>
              <line x1="42" y1="11" x2="42" y2="8" stroke="#00C853" strokeWidth="1.5"/>
            </svg>
          </div>
          <p className="empty-title">No orders right now</p>
          <p className="empty-sub">New orders appear here instantly ⚡</p>
          <div className="live-indicator">
            <span className="live-dot"/>
            <span>Listening for orders...</span>
          </div>
        </div>
      )}
    </div>
  );
}
