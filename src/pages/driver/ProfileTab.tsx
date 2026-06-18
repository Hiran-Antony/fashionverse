// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Profile Tab
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Star, TrendingUp, LogOut, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useDriverStore } from '../../store/driverStore';
import { supabase } from '../../lib/supabase';

const DriverRegistration = lazy(() => import('./DriverRegistration'));

interface ProfileTabProps {
  todayCount: number;
  todayEarnings: number;
  totalDeliveries: number;
  totalEarnings: number;
  driverTier: string;
  weeklyData: { day: string; amt: number; count: number; isToday: boolean }[];
}

// Local company color map for affiliation display
const COMPANY_COLORS: Record<string, string> = {
  shadowfax: '#6C3BEB', borzo: '#FF6B00', porter: '#F7B731',
  amazon: '#FF9900', delhivery: '#E31837', ecom_express: '#0056A2',
  xpressbees: '#FF6600', shiprocket: '#F7C325', bluedart: '#003366',
  flipkart: '#2874F0',
};

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
  const [showAddCompany, setShowAddCompany] = useState(false);

  // Affiliation list with employee_id
  const [affiliations, setAffiliations] = useState<{
    id: string;
    company_id: string | null;
    company_slug: string | null;
    employee_id: string | null;
    status: string;
    courier_companies?: { name: string } | null;
  }[]>([]);

  const fetchAffiliations = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('driver_companies')
        .select('id, company_id, company_slug, employee_id, status, courier_companies(name)')
        .eq('driver_id', user.id);
      if (data) setAffiliations(data as any);
    } catch (_) {}
  };

  useEffect(() => {
    fetchAffiliations();
  }, [user]);

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

        {/* Company Affiliations — with Employee IDs */}
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

          {affiliations.length > 0 ? (
            <div>
              {affiliations.map((aff) => {
                const name =
                  (aff.courier_companies as any)?.name ||
                  aff.company_slug?.replace('_', ' ') ||
                  'Company';
                const slug = aff.company_slug || '';
                const color = COMPANY_COLORS[slug] || '#888';
                const initial = name.charAt(0).toUpperCase();
                return (
                  <div key={aff.id} className="dr-affiliation-row">
                    {/* Logo circle */}
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: `${color}26`,
                        border: `1.5px solid ${color}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color, fontSize: 14, fontWeight: 700, flexShrink: 0,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {initial}
                    </div>
                    {/* Name */}
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>
                      {name}
                    </p>
                    {/* Employee ID badge */}
                    {aff.employee_id && (
                      <span className="dr-emp-id-badge">{aff.employee_id}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback: existing company stack if affiliations table empty */
            companies.length > 0 && (
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
                  <div className="dh-company-stack-item" style={{ background: '#333' }}>
                    +{companies.length - 6}
                  </div>
                )}
              </div>
            )
          )}

          {/* Add Company button */}
          <button
            className="dr-add-company-btn"
            onClick={() => setShowAddCompany(true)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round"/>
            </svg>
            Add Company
          </button>
        </div>
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
                    background: d.isToday 
                      ? 'linear-gradient(180deg, #00E676 0%, #00B248 100%)' 
                      : 'linear-gradient(180deg, var(--dh-green) 0%, rgba(0,200,83,0.3) 100%)',
                    boxShadow: d.isToday ? '0 0 16px rgba(0,230,118,0.4)' : 'none',
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

      {/* Add Company — DriverRegistration modal */}
      {showAddCompany && user && (
        <Suspense fallback={null}>
          <DriverRegistration
            driverId={user.id}
            preSelected={new Set(affiliations.map((a) => a.company_slug).filter(Boolean) as string[])}
            onComplete={() => {
              setShowAddCompany(false);
              fetchAffiliations();
            }}
            onBack={() => setShowAddCompany(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
