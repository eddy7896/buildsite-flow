import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function AuthRedirect() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Reset redirection flag when user logs out
    if (!user) {
      setHasRedirected(false);
    }
  }, [user]);

  useEffect(() => {
    // Only redirect if user is authenticated, role is determined, not loading, 
    // haven't redirected yet, and currently on auth page
    if (user && userRole && !loading && !hasRedirected && location.pathname === '/auth') {
      setHasRedirected(true);
      
      if (userRole === 'super_admin') {
        navigate('/system');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, userRole, loading, hasRedirected, location.pathname, navigate]);

  // This component doesn't render anything
  return null;
}