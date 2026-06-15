// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — OTP Verification Modal
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useCallback, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { type DriverDelivery } from '../../store/driverStore';

interface OTPModalProps {
  order: DriverDelivery;
  onClose: () => void;
  onVerify: (orderId: string, pin: string) => Promise<'success' | 'wrong' | 'locked' | 'error'>;
  onSuccess: () => void;
}

function spawnConfetti() {
  const colors = ['#00C853', '#D4A032', '#ffffff', '#FF9800', '#2979FF'];
  for (let i = 0; i < 60; i++) {
    const particle = document.createElement('div');
    particle.className = 'dh-confetti-particle';
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.left = `${40 + Math.random() * 20}%`;
    particle.style.top = `${30 + Math.random() * 20}%`;
    particle.style.width = `${4 + Math.random() * 6}px`;
    particle.style.height = `${4 + Math.random() * 6}px`;
    particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    const angle = Math.random() * Math.PI * 2;
    const velocity = 80 + Math.random() * 120;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity;
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);
    particle.animate(
      [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${360 + Math.random() * 360}deg)`, opacity: 0 },
      ],
      { duration: 800 + Math.random() * 600, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }
    );
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1500);
  }
}

export default function OTPModal({ order, onClose, onVerify, onSuccess }: OTPModalProps) {
  const [pins, setPins] = useState(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [state, setState] = useState<'idle' | 'error' | 'success' | 'locked'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  const doVerify = useCallback(
    async (code: string) => {
      if (isVerifying) return;
      setIsVerifying(true);
      setErrorMsg('');

      const result = await onVerify(order.id, code);

      switch (result) {
        case 'success':
          setState('success');
          spawnConfetti();
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
          break;
        case 'wrong':
          setState('error');
          setErrorMsg('Wrong PIN. Try again.');
          setTimeout(() => {
            setState('idle');
            setPins(['', '', '', '']);
            inputRefs.current[0]?.focus();
          }, 800);
          break;
        case 'locked':
          setState('locked');
          setErrorMsg('Too many wrong attempts. Contact admin.');
          break;
        case 'error':
          setErrorMsg('Something went wrong. Try again.');
          break;
      }

      setIsVerifying(false);
    },
    [order.id, onVerify, onSuccess, onClose, isVerifying]
  );

  const handleChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...pins];
    next[idx] = digit;
    setPins(next);
    setErrorMsg('');
    setState('idle');

    if (digit && idx < 3) {
      inputRefs.current[idx + 1]?.focus();
    }

    if (next.every((d) => d !== '') && next.join('').length === 4) {
      doVerify(next.join(''));
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pins[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const boxClass = (idx: number) => {
    let cls = 'dh-otp-box';
    if (state === 'success') cls += ' success';
    else if (state === 'error') cls += ' error';
    return cls;
  };

  return (
    <div className="dh-otp-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dh-otp-card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'var(--dh-green-glow)',
                border: '1px solid var(--dh-green-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={22} style={{ color: 'var(--dh-green)' }} />
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 700 }}>Enter Customer PIN</p>
              <p style={{ fontSize: '12px', color: 'var(--dh-muted)', marginTop: '2px' }}>
                Ask for the 4-digit delivery PIN
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--dh-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* OTP Inputs */}
        <div className="dh-otp-inputs">
          {pins.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              className={boxClass(idx)}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              disabled={state === 'locked' || state === 'success'}
            />
          ))}
        </div>

        {/* Error / Success Messages */}
        {errorMsg && (
          <div
            style={{
              background: state === 'locked' ? 'rgba(255,68,68,0.1)' : 'rgba(255,68,68,0.08)',
              border: '1px solid rgba(255,68,68,0.25)',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '13px',
              color: 'var(--dh-red)',
              textAlign: 'center',
              marginBottom: '12px',
            }}
          >
            {errorMsg}
          </div>
        )}

        {state === 'success' && (
          <div
            style={{
              background: 'var(--dh-green-glow)',
              border: '1px solid var(--dh-green-border)',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '15px',
              color: 'var(--dh-green)',
              textAlign: 'center',
              fontWeight: 700,
              marginBottom: '12px',
            }}
          >
            ✓ Delivery Confirmed!
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={() => {
            const code = pins.join('');
            if (code.length === 4) doVerify(code);
          }}
          disabled={isVerifying || pins.join('').length < 4 || state === 'locked' || state === 'success'}
          style={{
            width: '100%',
            padding: '14px',
            background: pins.join('').length < 4 || state === 'locked' ? '#1a1a1a' : 'var(--dh-green)',
            border: 'none',
            borderRadius: '12px',
            color: pins.join('').length < 4 || state === 'locked' ? 'var(--dh-muted)' : '#000',
            fontSize: '15px',
            fontWeight: 700,
            cursor: pins.join('').length < 4 || state === 'locked' ? 'not-allowed' : 'pointer',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {isVerifying ? (
            <>
              <div className="dh-spinner" style={{ width: 16, height: 16, borderWidth: '2px' }} />
              Verifying...
            </>
          ) : (
            'Confirm Delivery'
          )}
        </button>
      </div>
    </div>
  );
}
