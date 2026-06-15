// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Profile Tab
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Star, TrendingUp, LogOut, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useDriverStore } from '../../store/driverStore';

interface ProfileTabProps {
  todayCount: number;
  todayEarnings: number;
  totalDeliveries: number;
  totalEarnings: number;
  driverTier: string;
  weeklyData: { day: string; amt: number; count: number; isToday: boolean }[];
}

export default function ProfileTab({
  todayCount,
  todayEarnings,
  totalDeliveries,
  totalEarnings,
  driverTier,
  weeklyData,
}: ProfileTabProps) {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuthStore();
  const { companies } = useDriverStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());

  const initial = profile?.name?.charAt(0)?.toUpperCase() || 'D';
  const maxWeeklyAmt = Math.max(...weeklyData.map((d) => d.amt), 1);

  const tierConfig: Record<string, { label: string; emoji: string; className: string }> = {
    bronze: { label: 'Bronze Partner', emoji: '🥉', className: 'bronze' },
    silver: { label: 'Silver Partner', emoji: '🥈', className: 'silver' },
    gold: { label: 'Gold Partner', emoji: '🥇', className: 'gold' },
    platinum: { label: 'Platinum Partner', emoji: '💎', className: 'platinum' },
  };

  const tier = tierConfig[driverTier] || tierConfig.bronze;

  const handleLogout = async () => {
    await signOut();
    navigate('/delivery/apply');
  };

  return (
    <div>
      {/* Hero Card */}
      <div className="dh-profile-hero" style={{ marginTop: '4px' }}>
        <div className="dh-profile-avatar">{initial}</div>
        <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
          {profile?.name || 'Driver'}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--dh-muted)' }}>{user?.email}</p>

        {/* Badges */}
        <div className="dh-profile-badges">
          <span className="dh-badge approved">✓ APPROVED PARTNER</span>
          <span className={`dh-badge ${tier.className}`}>
            {tier.emoji} {tier.label}
          </span>
        </div>

        {/* Company Affiliations */}
        {companies.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <p
              style={{
                fontSize: '11px',
                color: 'var(--dh-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '8px',
              }}
            >
              PARTNER COMPANIES
            </p>
            <div className="dh-company-stack">
              {companies.slice(0, 6).map((company) => {
                const showLogo = company.logo_url && !failedLogos.has(company.id);
                return (
                  <div
                    key={company.id}
                    className="dh-company-stack-item"
                    style={{ background: company.brand_color }}
                    title={company.name}
                  >
                    {showLogo ? (
                      <img
                        src={company.logo_url!}
                        alt={company.name}
                        onError={() => setFailedLogos((prev) => new Set(prev).add(company.id))}
                      />
                    ) : (
                      company.name.charAt(0)
                    )}
                  </div>
                );
              })}
              {companies.length > 6 && (
                <div
                  className="dh-company-stack-item"
                  style={{ background: '#333' }}
                >
                  +{companies.length - 6}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="dh-stats-grid">
        <div className="dh-stats-cell">
          <Package size={18} style={{ color: 'var(--dh-orange)', margin: '0 auto 8px', display: 'block' }} />
          <p className="dh-stats-cell-value" style={{ color: 'var(--dh-orange)' }}>
            {totalDeliveries}
          </p>
          <p className="dh-stats-cell-label">Total Deliveries</p>
        </div>
        <div className="dh-stats-cell">
          <span style={{ fontSize: '18px', display: 'block', textAlign: 'center', marginBottom: '8px', color: 'var(--dh-green)' }}>₹</span>
          <p className="dh-stats-cell-value" style={{ color: 'var(--dh-green)' }}>
            ₹{Math.round(totalEarnings).toLocaleString('en-IN')}
          </p>
          <p className="dh-stats-cell-label">Total Earned</p>
        </div>
        <div className="dh-stats-cell">
          <TrendingUp size={18} style={{ color: 'var(--dh-green)', margin: '0 auto 8px', display: 'block' }} />
          <p className="dh-stats-cell-value" style={{ color: 'var(--dh-green)' }}>
            {todayCount}
          </p>
          <p className="dh-stats-cell-label">Today's Drops</p>
        </div>
        <div className="dh-stats-cell">
          <Star size={18} fill="#FFD700" style={{ color: '#FFD700', margin: '0 auto 8px', display: 'block' }} />
          <p className="dh-stats-cell-value" style={{ color: '#FFD700' }}>4.9</p>
          <p className="dh-stats-cell-label">Rating</p>
        </div>
      </div>

      {/* Weekly Performance */}
      <div className="dh-info-card" style={{ marginBottom: '14px' }}>
        <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Weekly Performance</p>
        <div className="dh-weekly-bars">
          {weeklyData.map((d, i) => {
            const barHeight = Math.max(4, (d.amt / maxWeeklyAmt) * 80);
            return (
              <div key={d.day} className="dh-bar-col">
                <span className="dh-bar-amount">
                  {d.amt > 0 ? `₹${d.amt}` : ''}
                </span>
                <div
                  className="dh-bar"
                  style={{
                    height: `${barHeight}px`,
                    background: d.isToday ? '#00E676' : 'var(--dh-green)',
                    animationDelay: `${i * 100}ms`,
                  }}
                />
                <span
                  className="dh-bar-day"
                  style={{ fontWeight: d.isToday ? 700 : 400, color: d.isToday ? 'var(--dh-green)' : undefined }}
                >
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="dh-info-card">
        <p style={{ fontSize: '12px', color: 'var(--dh-muted)', marginBottom: '8px' }}>🚗 Vehicle Info</p>
        <div className="dh-info-row">
          <span className="dh-info-label">Type</span>
          <span className="dh-info-value">Two Wheeler</span>
        </div>
        <div className="dh-info-row">
          <span className="dh-info-label">Status</span>
          <span style={{ color: 'var(--dh-green)', fontSize: '13px', fontWeight: 600 }}>✓ Verified</span>
        </div>
      </div>

      {/* Logout */}
      <button className="dh-logout-btn" onClick={() => setShowLogoutConfirm(true)}>
        <LogOut size={16} /> Sign Out
      </button>

      {/* Logout Confirm */}
      {showLogoutConfirm && (
        <div className="dh-confirm-overlay" onClick={(e) => e.target === e.currentTarget && setShowLogoutConfirm(false)}>
          <div className="dh-confirm-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Sign Out?</h3>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{ background: 'none', border: 'none', color: 'var(--dh-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--dh-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
              Are you sure you want to sign out? You'll need to log in again to access the Delivery Hub.
            </p>
            <div className="dh-confirm-actions">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'none',
                  border: '1px solid var(--dh-border)',
                  color: 'var(--dh-muted)',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'var(--dh-red)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
