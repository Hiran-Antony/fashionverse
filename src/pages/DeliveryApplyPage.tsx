import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee, Clock, Shield, Truck, Hourglass,
  CheckCircle, ChevronDown, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import BrandLogo from '../components/layout/BrandLogo';
import GoldParticles from '../components/GoldParticles';
import type { VehicleType, DeliveryExperience } from '../types';

// ─── Constants ────────────────────────────────────────────────
const BENEFITS = [
  {
    icon: <IndianRupee size={22} style={{ color: '#C9973A' }} />,
    title: 'Earn ₹500–2000/day',
    desc: 'Flexible earnings',
  },
  {
    icon: <Clock size={22} style={{ color: '#C9973A' }} />,
    title: 'Flexible Hours',
    desc: 'Work your schedule',
  },
  {
    icon: <Shield size={22} style={{ color: '#C9973A' }} />,
    title: 'Instant Payments',
    desc: 'Weekly settlements',
  },
];

const VEHICLE_TYPES: VehicleType[] = [
  'Two Wheeler', 'Three Wheeler', 'Four Wheeler', 'Cargo Van',
];

const EXPERIENCE_OPTIONS: DeliveryExperience[] = [
  'No experience (fresher)',
  'Less than 1 year',
  '1-2 years',
  '3+ years',
];

// ─── Shared input style ────────────────────────────────────────
const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'rgba(26,15,8,0.8)',
  border: '1px solid rgba(201,151,58,0.2)',
  borderRadius: '10px',
  padding: '14px 16px',
  color: '#F5EDD4',
  fontFamily: "'Syne', sans-serif",
  fontSize: '14px',
  outline: 'none',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '10px',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'rgba(201,151,58,0.7)',
      fontWeight: 700,
      marginBottom: '12px',
      marginTop: '24px',
      fontFamily: "'Syne', sans-serif",
    }}>
      {children}
    </p>
  );
}

function FocusInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inputBase, ...props.style }}
      onFocus={e => {
        e.currentTarget.style.borderColor = 'rgba(201,151,58,0.55)';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,151,58,0.1)';
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = 'rgba(201,151,58,0.2)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
  );
}

function FocusSelect(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        {...props}
        style={{
          ...inputBase,
          appearance: 'none',
          WebkitAppearance: 'none',
          cursor: 'pointer',
          paddingRight: '40px',
          ...props.style,
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'rgba(201,151,58,0.55)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,151,58,0.1)';
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'rgba(201,151,58,0.2)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {props.children}
      </select>
      <ChevronDown
        size={16}
        style={{
          position: 'absolute', right: '14px', top: '50%',
          transform: 'translateY(-50%)', color: 'rgba(201,151,58,0.6)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function DeliveryApplyPage() {
  const navigate = useNavigate();
  const { user, profile, isDeliveryApproved } = useAuthStore();

  // Application state tracking
  const [applicationStatus, setApplicationStatus] = useState<'idle' | 'pending' | 'approved'>('idle');
  const [applicationDate, setApplicationDate] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Two Wheeler');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experience, setExperience] = useState<DeliveryExperience>('No experience (fresher)');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // ── Determine which state to show ──────────────────────────
  useEffect(() => {
    const check = async () => {
      setCheckingStatus(true);
      if (!user) {
        setApplicationStatus('idle');
        setCheckingStatus(false);
        return;
      }
      if (isDeliveryApproved || profile?.role === 'delivery_approved') {
        navigate('/delivery-dashboard', { replace: true });
        return;
      }
      
      // Check if they have a pending application in the DB
      const { data: appData } = await supabase
        .from('delivery_applications')
        .select('applied_at, status')
        .eq('user_id', user.id)
        .order('applied_at', { ascending: false })
        .limit(1)
        .single();

      if (appData && appData.status === 'pending') {
        setApplicationDate(appData.applied_at);
        setApplicationStatus('pending');
      } else {
        setApplicationStatus('idle');
        if (profile?.name) setFullName(profile.name);
        if (profile?.phone) setPhone(profile.phone);
      }
      setCheckingStatus(false);
    };
    check();
  }, [user, profile, isDeliveryApproved, navigate]);

  // ── Submit application ─────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let uid = user?.id;

      // If not logged in yet, create account first
      if (!user) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: undefined,
          },
        });
        if (signUpError) throw signUpError;
        
        // Supabase often requires email confirmation. If no session is returned, they are not logged in.
        if (!signUpData.session) {
          setError('Account created! Please check your email to verify your account. Once verified, click "Sign In" above to finish submitting your application.');
          setIsLoading(false);
          return;
        }
        
        uid = signUpData.user?.id;
      }

      if (!uid) throw new Error('Could not determine user ID.');

      // Insert application
      const { error: appError } = await supabase
        .from('delivery_applications')
        .insert({
          user_id: uid,
          full_name: fullName,
          phone,
          vehicle_type: vehicleType,
          vehicle_number: vehicleNumber.toUpperCase(),
          license_number: licenseNumber.toUpperCase(),
          city,
          experience,
          status: 'pending',
        });
      if (appError) throw appError;

      setApplicationDate(new Date().toISOString());
      setApplicationStatus('pending');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Loading guard ──────────────────────────────────────────
  if (checkingStatus) {
    return (
      <div style={{ minHeight: '100vh', background: '#120a06', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(201,151,58,0.2)', borderTop: '3px solid #C9973A', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#120a06', position: 'relative', overflowX: 'hidden' }}>
      <GoldParticles />

      {/* Navbar */}
      <nav style={{
        height: '64px', display: 'flex', alignItems: 'center',
        padding: '0 24px', borderBottom: '1px solid rgba(201,151,58,0.15)',
        background: 'rgba(12,8,3,0.9)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
        justifyContent: 'space-between',
      }}>
        <BrandLogo size="sm" showWordmark />
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'rgba(245,237,212,0.6)', fontSize: '12px' }}>{user.email}</span>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate('/auth'); }}
              style={{
                background: 'none', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px', color: '#f87171',
                padding: '8px 18px', cursor: 'pointer',
                fontSize: '13px', fontFamily: "'Syne', sans-serif",
                fontWeight: 600, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            style={{
              background: 'none', border: '1px solid rgba(201,151,58,0.3)',
              borderRadius: '8px', color: '#C9973A',
              padding: '8px 18px', cursor: 'pointer',
              fontSize: '13px', fontFamily: "'Syne', sans-serif",
              fontWeight: 600, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,151,58,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            Sign In
          </button>
        )}
      </nav>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 16px 80px', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: '560px' }}>

          <AnimatePresence mode="wait">

            {/* ══ STATE 2: PENDING REVIEW ════════════════════════════ */}
            {applicationStatus === 'pending' && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.4 }}
              >
                {/* Pending card */}
                <div style={{
                  background: 'rgba(18,10,6,0.92)',
                  border: '1px solid rgba(201,151,58,0.2)',
                  borderRadius: '20px',
                  padding: '48px 36px',
                  textAlign: 'center',
                  backdropFilter: 'blur(20px)',
                }}>
                  {/* Animated hourglass */}
                  <div style={{
                    width: '80px', height: '80px',
                    background: 'rgba(201,151,58,0.1)',
                    border: '1px solid rgba(201,151,58,0.25)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 28px',
                    animation: 'pendingSpin 3s linear infinite',
                  }}>
                    <Hourglass size={32} style={{ color: '#C9973A' }} />
                  </div>

                  <h1 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '28px', fontWeight: 700,
                    color: '#F5EDD4', marginBottom: '12px',
                  }}>
                    Application Under Review
                  </h1>
                  <p style={{ fontSize: '14px', color: 'rgba(245,237,212,0.55)', lineHeight: 1.7, marginBottom: '32px', maxWidth: '380px', margin: '0 auto 32px' }}>
                    Thank you for applying to FashionVerse Delivery Partners. Our team is reviewing your application. You will receive an email once approved.
                  </p>

                  {/* Status card */}
                  <div style={{
                    background: 'rgba(201,151,58,0.06)',
                    border: '1px solid rgba(201,151,58,0.15)',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'left',
                    marginBottom: '28px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <p style={{ color: 'rgba(245,237,212,0.6)', fontSize: '13px', fontWeight: 600 }}>
                        Application Status
                      </p>
                      <span style={{
                        background: 'rgba(201,151,58,0.2)',
                        color: '#E8B84B',
                        border: '1px solid rgba(201,151,58,0.3)',
                        borderRadius: '20px',
                        padding: '3px 12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}>
                        Pending Review
                      </span>
                    </div>
                    {applicationDate && (
                      <p style={{ fontSize: '12px', color: 'rgba(245,237,212,0.4)', marginBottom: '4px' }}>
                        Applied on: {new Date(applicationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                    <p style={{ fontSize: '12px', color: 'rgba(245,237,212,0.4)' }}>
                      Expected review: 24–48 hours
                    </p>
                  </div>

                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate('/');
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(201,151,58,0.35)',
                      borderRadius: '10px',
                      color: '#C9973A',
                      padding: '12px 28px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,151,58,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                  >
                    Sign Out & Return Home
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══ STATE 1: APPLICATION FORM ══════════════════════════ */}
            {applicationStatus === 'idle' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.4 }}
              >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: 'rgba(201,151,58,0.08)',
                    border: '1px solid rgba(201,151,58,0.2)',
                    borderRadius: '20px',
                    padding: '5px 16px',
                    marginBottom: '20px',
                  }}>
                    <Truck size={12} style={{ color: '#C9973A' }} />
                    <span style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9973A', fontWeight: 700 }}>
                      Join Our Team
                    </span>
                  </div>

                  <h1 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(28px, 5vw, 36px)',
                    fontWeight: 700, color: '#F5EDD4',
                    lineHeight: 1.2, marginBottom: '12px',
                  }}>
                    Become a Delivery Partner
                  </h1>
                  <p style={{ fontSize: '14px', color: 'rgba(245,237,212,0.55)', lineHeight: 1.65 }}>
                    Earn on your schedule. Deliver fashion, earn rewards.
                  </p>
                </div>

                {/* Benefits row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '36px' }}>
                  {BENEFITS.map(b => (
                    <div key={b.title} style={{
                      background: 'rgba(201,151,58,0.06)',
                      border: '1px solid rgba(201,151,58,0.15)',
                      borderRadius: '12px', padding: '16px',
                      textAlign: 'center',
                    }}>
                      <div style={{ marginBottom: '8px' }}>{b.icon}</div>
                      <p style={{ color: '#F5EDD4', fontSize: '12px', fontWeight: 600, margin: '0 0 4px' }}>{b.title}</p>
                      <p style={{ color: 'rgba(245,237,212,0.45)', fontSize: '11px', margin: 0 }}>{b.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Form card */}
                <div style={{
                  background: 'rgba(18,10,6,0.92)',
                  border: '1px solid rgba(201,151,58,0.2)',
                  borderRadius: '20px',
                  padding: '36px 32px',
                  backdropFilter: 'blur(20px)',
                }}>
                  <form onSubmit={handleSubmit}>

                    {/* Only show email/pass if not already logged in */}
                    {!user && (
                      <>
                        <SectionLabel>Account Details</SectionLabel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <FocusInput
                            type="email"
                            required
                            placeholder="Email Address"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                          />
                          <FocusInput
                            type="password"
                            required
                            minLength={6}
                            placeholder="Create Password (min. 6 characters)"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    <SectionLabel>Personal Details</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <FocusInput
                        type="text"
                        required
                        placeholder="Full Name"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                      />
                      <FocusInput
                        type="tel"
                        required
                        placeholder="Phone Number"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                      <FocusInput
                        type="text"
                        required
                        placeholder="City"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                      />
                    </div>

                    <SectionLabel>Vehicle Details</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <FocusSelect
                        required
                        value={vehicleType}
                        onChange={e => setVehicleType(e.target.value as VehicleType)}
                      >
                        {VEHICLE_TYPES.map(v => (
                          <option key={v} value={v} style={{ background: '#1a0f08' }}>{v}</option>
                        ))}
                      </FocusSelect>
                      <FocusInput
                        type="text"
                        required
                        placeholder="Vehicle Number (e.g. TN 01 AB 1234)"
                        value={vehicleNumber}
                        onChange={e => setVehicleNumber(e.target.value)}
                        style={{ textTransform: 'uppercase' }}
                      />
                      <FocusInput
                        type="text"
                        required
                        placeholder="Driving License Number"
                        value={licenseNumber}
                        onChange={e => setLicenseNumber(e.target.value)}
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>

                    <SectionLabel>Experience</SectionLabel>
                    <FocusSelect
                      required
                      value={experience}
                      onChange={e => setExperience(e.target.value as DeliveryExperience)}
                    >
                      {EXPERIENCE_OPTIONS.map(opt => (
                        <option key={opt} value={opt} style={{ background: '#1a0f08' }}>{opt}</option>
                      ))}
                    </FocusSelect>

                    {/* Error */}
                    {error && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(220,60,60,0.08)',
                        border: '1px solid rgba(220,60,60,0.2)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        marginTop: '20px',
                        color: '#ff8a7a', fontSize: '13px',
                      }}>
                        <AlertCircle size={16} />
                        {error}
                      </div>
                    )}

                    {/* Buttons */}
                    <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                          width: '100%',
                          padding: '15px',
                          background: isLoading
                            ? 'rgba(201,151,58,0.4)'
                            : 'linear-gradient(135deg, #C9973A, #E8B84B)',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#120a06',
                          fontSize: '14px',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          fontFamily: "'Syne', sans-serif",
                          boxShadow: '0 8px 28px rgba(201,151,58,0.3)',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                        onMouseEnter={e => {
                          if (!isLoading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 36px rgba(201,151,58,0.5)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(201,151,58,0.3)';
                        }}
                      >
                        {isLoading ? (
                          <>
                            <div style={{
                              width: 16, height: 16,
                              border: '2px solid rgba(18,10,6,0.3)',
                              borderTop: '2px solid #120a06',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite',
                            }} />
                            Submitting...
                          </>
                        ) : (
                          'Submit Application →'
                        )}
                      </button>

                      {!user && (
                        <button
                          type="button"
                          onClick={() => navigate('/auth')}
                          style={{
                            background: 'none', border: 'none',
                            color: '#C9973A', fontSize: '13px',
                            cursor: 'pointer', fontFamily: "'Syne', sans-serif",
                            textAlign: 'center', padding: '4px',
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#E8B84B')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#C9973A')}
                        >
                          Already have an account? Sign In
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Global keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pendingSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
