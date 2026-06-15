// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Active Tab
// ═══════════════════════════════════════════════════════════════

import { ChevronRight, Truck } from 'lucide-react';
import ProgressTracker from '../../components/driver/ProgressTracker';
import ActiveDeliveryCard from '../../components/driver/ActiveDeliveryCard';
import { useDriverStore, type DriverDelivery } from '../../store/driverStore';

interface ActiveTabProps {
  onMarkDelivered: (order: DriverDelivery) => void;
}

export default function ActiveTab({ onMarkDelivered }: ActiveTabProps) {
  const { activeDeliveries, setActiveTab } = useDriverStore();

  // Calculate progress step based on status
  const getStep = (status: string) => {
    switch (status) {
      case 'assigned':
        return 0;
      case 'picked':
        return 1;
      case 'out_for_delivery':
      case 'in_transit':
        return 1;
      default:
        return 0;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', marginTop: '4px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Active Deliveries</h2>
        {activeDeliveries.length > 0 && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--dh-green)',
              background: 'var(--dh-green-glow)',
              border: '1px solid var(--dh-green-border)',
              borderRadius: '20px',
              padding: '3px 10px',
            }}
          >
            {activeDeliveries.length} ACTIVE
          </span>
        )}
      </div>

      {activeDeliveries.length === 0 ? (
        <div className="dh-empty-state">
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '2px dashed var(--dh-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Truck size={36} style={{ color: 'var(--dh-muted)' }} />
          </div>
          <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
            No active deliveries
          </p>
          <p style={{ fontSize: '13px', color: 'var(--dh-muted)', marginBottom: '16px' }}>
            Pick up an order to get started!
          </p>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              background: 'none',
              border: '1px solid var(--dh-border)',
              borderRadius: '8px',
              color: 'var(--dh-muted)',
              padding: '8px 20px',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: "'Inter', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            View Available <ChevronRight size={14} />
          </button>
        </div>
      ) : (
        activeDeliveries.map((order) => (
          <div key={order.id}>
            <ProgressTracker step={getStep(order.status)} />
            <ActiveDeliveryCard
              order={order}
              onMarkDelivered={onMarkDelivered}
              onOpenMap={() => setActiveTab('map')}
            />
          </div>
        ))
      )}
    </div>
  );
}
