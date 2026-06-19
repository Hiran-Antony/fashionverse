// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Driver Registration Flow
// One-time onboarding for new drivers with 0 company affiliations
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// ── Company Data ──────────────────────────────────────────────
const COMPANIES = [
  { id: 'shadowfax',    name: 'Shadowfax',    color: '#6C3BEB', prefix: 'SF-'  },
  { id: 'borzo',        name: 'Borzo',         color: '#FF6B00', prefix: 'BZ-'  },
  { id: 'porter',       name: 'Porter',        color: '#F7B731', prefix: 'PT-'  },
  { id: 'amazon',       name: 'Amazon',        color: '#FF9900', prefix: 'AMZ-' },
  { id: 'delhivery',    name: 'Delhivery',     color: '#E31837', prefix: 'DL-'  },
  { id: 'ecom_express', name: 'Ecom Express',  color: '#0056A2', prefix: 'EX-'  },
  { id: 'xpressbees',   name: 'Xpressbees',   color: '#FF6600', prefix: 'XB-'  },
  { id: 'shiprocket',   name: 'Shiprocket',   color: '#F7C325', prefix: 'SR-'  },
  { id: 'bluedart',     name: 'Bluedart',      color: '#003366', prefix: 'BD-'  },
  { id: 'flipkart',     name: 'Flipkart',      color: '#2874F0', prefix: 'FK-'  },
];

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Inline styles ─────────────────────────────────────────────
const S = {
  // Full-viewport backdrop
  backdrop: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Outfit', sans-serif",
    padding: '16px',
    boxSizing: 'border-box',
  },

  // Centered card — mobile-style panel
  card: {
    width: '100%',
    maxWidth: '480px',
    height: '100%',
    maxHeight: '780px',
    background: '#0f0f0f',
    borderRadius: '24px',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,200,83,0.06)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    animation: 'dr-pop-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
    minHeight: 0,
  },

  // Green top accent line
  accentBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #00C853, transparent)',
    borderRadius: '24px 24px 0 0',
  },

  // Header row
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px 20px 12px',
    flexShrink: 0,
    gap: 0,
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },

  backBtn: {
    width: 38,
    height: 38,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
    transition: 'background 0.15s',
  },

  // Scrollable body
  body: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '24px 20px 0',
    minHeight: 0,
  },

  // Step indicator dots
  stepDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
  },

  // Company grid
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },

  // Footer
  footer: {
    padding: '16px 20px 20px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    background: '#0f0f0f',
    flexShrink: 0,
  },

  primaryBtn: (disabled) => ({
    width: '100%',
    height: 52,
    borderRadius: 14,
    border: 'none',
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "'Outfit', sans-serif",
    background: disabled ? '#1e1e1e' : 'var(--dh-green)',
    color: disabled ? '#444' : '#000',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    letterSpacing: '0.01em',
    boxShadow: disabled ? 'none' : '0 4px 20px rgba(0,200,83,0.3)',
    transition: 'all 0.2s ease',
  }),
};

// ── Step Indicator ────────────────────────────────────────────
function StepIndicator({ current, total }) {
  return (
    <div style={S.stepDots}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i + 1 === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            background: i + 1 === current ? '#00C853' : i + 1 < current ? 'rgba(0,200,83,0.4)' : 'rgba(255,255,255,0.1)',
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

// ── Company Logo Circle ───────────────────────────────────────
function CompanyLogo({ company, size = 40, fontSize = 16 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: hexToRgba(company.color, 0.12),
        border: `1.5px solid ${company.color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: company.color, fontSize, fontWeight: 700,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {company.name.charAt(0)}
    </div>
  );
}

// ── SVG Animated Checkmark ────────────────────────────────────
function AnimatedCheck({ size = 80 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'radial-gradient(circle, #00E676, #00C853)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 60px rgba(0,200,83,0.5), 0 0 120px rgba(0,200,83,0.2)',
      animation: 'dr-pop-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
    }}>
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        <polyline
          points="9,22 19,32 35,13"
          stroke="#000" strokeWidth="3.5"
          strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="46" strokeDashoffset="0"
          style={{ animation: 'dr-draw-check 0.45s ease 0.35s both' }}
        />
      </svg>
    </div>
  );
}

// ── Shared Header ─────────────────────────────────────────────
function ScreenHeader({ title, step, totalSteps, onBack }) {
  return (
    <div style={S.header}>
      <button style={S.backBtn} onClick={onBack} aria-label="Go back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div style={{ flex: 1, textAlign: 'center' }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{title}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3, letterSpacing: '0.06em' }}>
          STEP {step} OF {totalSteps}
        </p>
      </div>
      <div style={{ width: 38 }} />
    </div>
  );
}

// ── Step 1 — Select Companies ─────────────────────────────────
function StepSelectCompanies({ selected, onToggle, onContinue, onBack }) {
  return (
    <>
      <ScreenHeader title="Setup Your Profile" step={1} totalSteps={2} onBack={onBack} />

      <div style={S.body}>
        <StepIndicator current={1} total={2} />

        <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.25, margin: 0 }}>
          Which companies do you
        </p>
        <p style={{ fontSize: 22, fontWeight: 800, color: '#00C853', marginTop: 2, marginBottom: 6 }}>
          deliver for?
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 0, marginBottom: 20 }}>
          Select all that apply. You can change this later.
        </p>

        <div style={S.grid}>
          {COMPANIES.map((company) => {
            const isSelected = selected.has(company.id);
            return (
              <button
                key={company.id}
                onClick={() => onToggle(company.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 12px',
                  borderRadius: 14,
                  border: `1.5px solid ${isSelected ? '#00C853' : 'rgba(255,255,255,0.07)'}`,
                  background: isSelected ? 'rgba(0,200,83,0.07)' : '#161616',
                  cursor: 'pointer',
                  position: 'relative',
                  textAlign: 'left',
                  minWidth: 0,
                  fontFamily: "'Outfit', sans-serif",
                  transition: 'all 0.18s ease',
                  boxShadow: isSelected ? '0 0 0 1px rgba(0,200,83,0.15) inset' : 'none',
                }}
              >
                {/* Green check badge */}
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: 7, right: 7,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#00C853',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'dr-pop-in 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <polyline points="2,5 4,7.5 8,3" stroke="#000"
                        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}

                <CompanyLogo company={company} size={36} fontSize={14} />
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 700,
                    color: isSelected ? '#00C853' : '#fff',
                    margin: 0, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    transition: 'color 0.18s',
                  }}>
                    {company.name}
                  </p>
                  <p style={{
                    fontSize: 10, marginTop: 2,
                    color: isSelected ? 'rgba(0,200,83,0.8)' : 'rgba(255,255,255,0.3)',
                    transition: 'color 0.18s',
                  }}>
                    {isSelected ? 'Selected ✓' : 'Tap to select'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ height: 16 }} />
      </div>

      <div style={S.footer}>
        {selected.size > 0 && (
          <div style={{
            background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.25)',
            borderRadius: 50, padding: '7px 16px', textAlign: 'center',
            fontSize: 12, fontWeight: 600, color: '#00C853',
            marginBottom: 10, animation: 'dh-fade-in 0.2s ease',
          }}>
            {selected.size} {selected.size === 1 ? 'company' : 'companies'} selected
          </div>
        )}
        <button
          style={S.primaryBtn(selected.size === 0)}
          disabled={selected.size === 0}
          onClick={onContinue}
        >
          Continue →
        </button>
      </div>
    </>
  );
}

// ── Step 2 — Employee IDs ─────────────────────────────────────
function StepEmployeeIds({ selectedIds, employeeIds, onChange, onSubmit, onBack, isSubmitting }) {
  const selectedCompanies = COMPANIES.filter((c) => selectedIds.has(c.id));

  return (
    <>
      <ScreenHeader title="Setup Your Profile" step={2} totalSteps={2} onBack={onBack} />

      <div style={S.body}>
        <StepIndicator current={2} total={2} />

        <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>
          Enter your Employee IDs
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6, marginBottom: 20 }}>
          These verify you as an authorized partner driver.
        </p>

        {selectedCompanies.map((company) => (
          <div
            key={company.id}
            style={{
              background: '#161616',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <CompanyLogo company={company} size={30} fontSize={13} />
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>
                {company.name}
              </p>
              <span style={{
                marginLeft: 'auto', fontSize: 10, fontWeight: 600,
                color: company.color, background: hexToRgba(company.color, 0.1),
                border: `1px solid ${hexToRgba(company.color, 0.25)}`,
                borderRadius: 20, padding: '2px 8px',
              }}>
                {company.prefix}
              </span>
            </div>
            <input
              type="text"
              placeholder={`e.g. ${company.prefix}2847`}
              value={employeeIds[company.id] || ''}
              onChange={(e) => onChange(company.id, e.target.value)}
              style={{
                width: '100%', height: 42,
                background: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '0 14px',
                fontSize: 13, color: '#fff', outline: 'none',
                fontFamily: "'Outfit', sans-serif",
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#00C853';
                e.target.style.boxShadow = '0 0 0 3px rgba(0,200,83,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
              Optional — skip if you don't have one yet
            </p>
          </div>
        ))}
        <div style={{ height: 8 }} />
      </div>

      <div style={S.footer}>
        <button
          style={{ ...S.primaryBtn(isSubmitting), opacity: isSubmitting ? 0.75 : 1 }}
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 16, height: 16,
                border: '2.5px solid rgba(0,0,0,0.2)',
                borderTopColor: '#000', borderRadius: '50%',
                animation: 'dh-spin 0.7s linear infinite', display: 'inline-block',
              }} />
              Saving…
            </span>
          ) : (
            'Complete Setup ✓'
          )}
        </button>
      </div>
    </>
  );
}

// ── Success Screen ─────────────────────────────────────────────
function SuccessScreen({ selectedIds }) {
  const selectedCompanies = COMPANIES.filter((c) => selectedIds.has(c.id));

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 28px', textAlign: 'center', gap: 24,
      animation: 'dh-fade-in 0.3s ease',
    }}>
      {/* Glowing circle BG */}
      <div style={{
        position: 'absolute', width: 200, height: 200,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,83,0.12), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <AnimatedCheck size={88} />

      <div style={{ animation: 'dh-slide-up 0.4s ease 0.45s both' }}>
        <p style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
          You're all set!
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
          Welcome to FashionVerse Delivery Hub
        </p>
      </div>

      {/* Overlapping company logos */}
      <div style={{ display: 'flex', justifyContent: 'center', animation: 'dh-slide-up 0.4s ease 0.6s both' }}>
        {selectedCompanies.slice(0, 6).map((company, i) => (
          <div key={company.id} style={{
            width: 38, height: 38, borderRadius: '50%',
            background: hexToRgba(company.color, 0.18),
            border: `2px solid ${company.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: company.color, fontSize: 14, fontWeight: 700,
            marginLeft: i === 0 ? 0 : -12, zIndex: selectedCompanies.length - i,
            position: 'relative', boxShadow: '0 0 0 2px #0f0f0f',
            fontFamily: "'Outfit', sans-serif",
          }}>
            {company.name.charAt(0)}
          </div>
        ))}
        {selectedCompanies.length > 6 && (
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: '#222', border: '2px solid #333',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700,
            marginLeft: -12, position: 'relative', boxShadow: '0 0 0 2px #0f0f0f',
            fontFamily: "'Outfit', sans-serif",
          }}>
            +{selectedCompanies.length - 6}
          </div>
        )}
      </div>

      <p style={{
        fontSize: 12, color: 'rgba(255,255,255,0.25)',
        animation: 'dh-slide-up 0.4s ease 0.75s both',
      }}>
        Redirecting to your dashboard…
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN EXPORT — DriverRegistration
// ══════════════════════════════════════════════════════════════
export default function DriverRegistration({ driverId, onComplete, onBack, preSelected = new Set() }) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(preSelected || new Set());
  const [employeeIds, setEmployeeIds] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const toggleCompany = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!driverId) return;
    setIsSubmitting(true);
    try {
      const selectedCompanyNames = COMPANIES.filter((c) => selected.has(c.id)).map((c) => c.name);
      const { data: dbCompanies } = await supabase
        .from('courier_companies').select('id, name').in('name', selectedCompanyNames);

      const rows = COMPANIES.filter((c) => selected.has(c.id)).map((localCompany) => {
        const dbMatch = dbCompanies?.find((d) => d.name.toLowerCase() === localCompany.name.toLowerCase());
        return {
          driver_id: driverId,
          company_id: dbMatch?.id ?? null,
          status: 'active',
          employee_id: employeeIds[localCompany.id] || null,
          company_slug: localCompany.id,
        };
      });

      if (rows.length > 0) await supabase.from('driver_companies').insert(rows);

      setShowSuccess(true);
      setTimeout(() => onComplete?.(), 1800);
    } catch (err) {
      console.error('Registration error:', err);
      setIsSubmitting(false);
    }
  };

  return (
    // Full-viewport dark backdrop
    <div style={S.backdrop} data-lenis-prevent="true">
      {/* Centered card */}
      <div style={S.card}>
        {/* Green top accent */}
        <div style={S.accentBar} />

        {showSuccess ? (
          <SuccessScreen selectedIds={selected} />
        ) : step === 1 ? (
          <StepSelectCompanies
            selected={selected}
            onToggle={toggleCompany}
            onContinue={() => setStep(2)}
            onBack={onBack}
          />
        ) : (
          <StepEmployeeIds
            selectedIds={selected}
            employeeIds={employeeIds}
            onChange={(id, val) => setEmployeeIds((p) => ({ ...p, [id]: val }))}
            onSubmit={handleSubmit}
            onBack={() => setStep(1)}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
