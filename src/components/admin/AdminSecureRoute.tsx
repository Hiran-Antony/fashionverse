import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import AdminSecretGate from './AdminSecretGate';

const AdminSecureRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  useEffect(() => {
    // If auth store is still loading initial session, wait.
    if (isLoading) return;

    // Check 1: Must be logged in
    if (!user) {
      setErrorMsg('Not logged in (user is null). Please log in first.');
      return;
    }
    
    // Wait for profile to load before failing
    if (!profile) {
      return; // Still loading profile
    }

    // Check 2: Must have admin role in frontend state
    if (profile.role !== 'admin') {
      setErrorMsg(`Profile role is not admin. Current role: ${profile.role}. Did you change it in Supabase and re-login?`);
      return;
    }
    
    // Check 3: Must be one of the strict whitelisted emails in .env
    const allowedEmails = (import.meta.env.VITE_ADMIN_EMAIL || '').split(',').map((e: string) => e.trim());
    if (!allowedEmails.includes(user.email)) {
      setErrorMsg(`Email mismatch. Logged in as: ${user.email}, but .env expects one of: ${allowedEmails.join(', ')}`);
      return;
    }

    // Clear any previous error messages if we made it this far
    setErrorMsg('');
    
    // Check 4: Verify with Supabase directly (not just frontend state)
    const verifyAdminServer = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) {
          setErrorMsg(`Server error checking role: ${error.message}`);
        } else if (data?.role !== 'admin') {
          setErrorMsg(`Server database says your role is not admin: ${data?.role}`);
        } else {
          setIsVerified(true);
        }
      } catch (err: any) {
        setErrorMsg(`Exception checking role: ${err.message}`);
      }
    };
    
    verifyAdminServer();
  }, [user, profile, isLoading, navigate]);

  // If there's an error, redirect to 404 silently so hackers don't know this is a real page
  if (errorMsg && !isLoading) {
    navigate('/404');
    return null;
  }

  if (isLoading || !isVerified) {
    return <div style={{ padding: 50, color: 'white', textAlign: 'center', marginTop: 100 }}>Verifying secure connection...</div>;
  }

  return (
    <AdminSecretGate>
      {children}
    </AdminSecretGate>
  );
};

export default AdminSecureRoute;
