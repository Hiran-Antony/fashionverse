import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const AdminSecretGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [verified, setVerified] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  
  const { user } = useAuthStore();

  const logAdminAccess = async (action: string) => {
    if (!user) return;
    try {
      await supabase.from('admin_access_log').insert({
        user_id: user.id,
        action: action,
        user_agent: navigator.userAgent,
        success: action === 'SUCCESS',
      });
    } catch (e) {
      console.error('Failed to log admin access:', e);
    }
  };

  const verifySecret = () => {
    if (locked) return;
    
    if (secretKey === import.meta.env.VITE_ADMIN_SECRET_KEY) {
      setVerified(true);
      logAdminAccess('SUCCESS');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setLocked(true);
        let timer = 300; // 5 minutes
        setLockTimer(timer);
        
        const countdown = setInterval(() => {
          timer--;
          setLockTimer(timer);
          if (timer <= 0) {
            clearInterval(countdown);
            setLocked(false);
            setAttempts(0);
          }
        }, 1000);
        
        logAdminAccess('FAILED_LOCKED');
      } else {
        logAdminAccess('FAILED_ATTEMPT');
      }
    }
  };

  if (verified) return <>{children}</>;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#080400',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: 'rgba(18,10,6,0.98)',
        border: '1px solid rgba(201,151,58,0.25)',
        borderRadius: '20px',
        padding: '40px',
        width: '360px',
        textAlign: 'center',
      }}>
        {/* Lock icon */}
        <div style={{
          width: '64px',
          height: '64px',
          background: 'rgba(201,151,58,0.1)',
          border: '1px solid rgba(201,151,58,0.3)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '24px'
        }}>
          🔐
        </div>

        <h2 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '22px',
          color: '#F5EDD4',
          marginBottom: '8px',
        }}>
          Admin Verification
        </h2>

        <p style={{
          fontSize: '13px',
          color: 'rgba(245,237,212,0.45)',
          marginBottom: '24px',
        }}>
          Enter your secret admin key to continue
        </p>

        {locked ? (
          <div style={{
            padding: '16px',
            background: 'rgba(220,60,60,0.1)',
            border: '1px solid rgba(220,60,60,0.2)',
            borderRadius: '10px',
            color: '#f87171',
            fontSize: '13px',
          }}>
            🔒 Too many attempts.<br/>
            Locked for {Math.floor(lockTimer/60)}:
            {String(lockTimer%60).padStart(2,'0')}
          </div>
        ) : (
          <>
            <input
              type="password"
              value={secretKey}
              onChange={e => setSecretKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && verifySecret()}
              placeholder="Enter secret key..."
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(10,6,2,0.8)',
                border: '1px solid rgba(201,151,58,0.2)',
                borderRadius: '10px',
                color: '#F5EDD4',
                fontSize: '14px',
                marginBottom: '12px',
                outline: 'none',
                fontFamily: 'monospace',
                letterSpacing: '0.2em',
                boxSizing: 'border-box'
              }}
            />

            {attempts > 0 && (
              <p style={{
                color: '#f87171',
                fontSize: '12px',
                marginBottom: '12px',
              }}>
                Wrong key. {3 - attempts} attempts remaining.
              </p>
            )}

            <button
              onClick={verifySecret}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #C9973A, #E8B84B)',
                border: 'none',
                borderRadius: '10px',
                color: '#120a06',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Verify & Enter →
            </button>
          </>
        )}

        <p style={{
          marginTop: '16px',
          fontSize: '11px',
          color: 'rgba(245,237,212,0.2)',
        }}>
          All access attempts are logged
        </p>
      </div>
    </div>
  );
};

export default AdminSecretGate;
