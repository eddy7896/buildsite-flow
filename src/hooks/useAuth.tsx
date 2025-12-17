import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { AppRole } from '@/utils/roleUtils';
import { selectRecords, selectOne } from '@/services/api/postgresql-service';
import { loginUser, registerUser } from '@/services/api/auth-postgresql';

interface User {
  id: string;
  email: string;
  email_confirmed: boolean;
  is_active: boolean;
}

interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: User;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  hire_date: string | null;
  avatar_url: string | null;
  is_active: boolean;
  agency_id: string;
}

interface UserRole {
  role: AppRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        // Verify token is still valid
        // Token can be either:
        // 1. Simple base64-encoded JSON (our format): btoa(JSON.stringify({...}))
        // 2. JWT format (legacy): header.payload.signature
        let decoded: { userId?: string; email?: string; exp?: number };
        
        if (token.includes('.')) {
          // JWT format - decode the payload part
          decoded = JSON.parse(atob(token.split('.')[1]));
        } else {
          // Simple base64 format - decode directly
          decoded = JSON.parse(atob(token));
        }
        
        if (decoded.exp && decoded.exp * 1000 > Date.now()) {
          // Token is still valid – restore minimal user from token,
          // then hydrate full user/profile/roles from the database where possible
          const restoredUser: User = {
            id: decoded.userId || '',
            email: decoded.email || '',
            email_confirmed: true,
            is_active: true
          };
          setUser(restoredUser);
          
          // Prefer stored role from previous real login if available
          const storedRole = localStorage.getItem('user_role') as AppRole | null;
          if (storedRole) {
            setUserRole(storedRole);
          } else if (decoded.userId) {
            // Fallback to client-side DB lookup for legacy/mock flows
            fetchUserProfile(decoded.userId);
            fetchUserRole(decoded.userId);
          }
        } else {
          // Token expired
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Error validating token:', error);
        localStorage.removeItem('auth_token');
      }
    }
    setLoading(false);
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const data = await selectOne('profiles', { user_id: userId });
      if (data) {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      // Query the database for roles
      const data = await selectRecords('user_roles', {
        where: { user_id: userId }
      });

      if (!data || data.length === 0) {
        setUserRole('employee');
        return;
      }

      // Define role hierarchy (lower number = higher priority)
      const roleHierarchy: Record<AppRole, number> = {
        'super_admin': 1,
        'ceo': 2,
        'cto': 3,
        'cfo': 4,
        'coo': 5,
        'admin': 6,
        'operations_manager': 7,
        'department_head': 8,
        'team_lead': 9,
        'project_manager': 10,
        'hr': 11,
        'finance_manager': 12,
        'sales_manager': 13,
        'marketing_manager': 14,
        'quality_assurance': 15,
        'it_support': 16,
        'legal_counsel': 17,
        'business_analyst': 18,
        'customer_success': 19,
        'employee': 20,
        'contractor': 21,
        'intern': 22
      };

      // Find the highest priority role
      const userRoles = (data as any[]).map(r => r.role as AppRole);
      const highestRole = userRoles.reduce((highest, current) => {
        const currentPriority = roleHierarchy[current] || 99;
        const highestPriority = roleHierarchy[highest] || 99;
        return currentPriority < highestPriority ? current : highest;
      });

      setUserRole(highestRole);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchUserProfile(user.id);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Get agency_id from current user's profile or localStorage
      let agencyId: string | null = null;
      if (profile?.agency_id) {
        agencyId = profile.agency_id;
      } else if (typeof window !== 'undefined') {
        agencyId = localStorage.getItem('agency_id') || null;
      }
      
      if (!agencyId) {
        throw new Error('Agency ID not found. Please ensure you are logged in to an agency account or provide an agency ID.');
      }
      
      const result = await registerUser({
        email,
        password,
        fullName,
        agencyId
      });

      // Store token
      localStorage.setItem('auth_token', result.token);
      
      // Set user state
      setUser(result.user as any);
      
      toast({
        title: "Sign up successful",
        description: "Welcome to BuildFlow!"
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    // Real database login (multi-tenant agency-aware)
    try {
      const result = await loginUser({ email, password });
      
      // Store token
      localStorage.setItem('auth_token', result.token);
      
      // Set user state from server response
      setUser(result.user as any);

      // If profile came back from server, use it directly
      const serverProfile = (result.user as any).profile;
      if (serverProfile) {
        setProfile(serverProfile as any);
      } else {
        // Fallback to DB lookup if profile not included
        fetchUserProfile(result.user.id);
      }

      // Prefer roles returned by the server (agency DB) to avoid main-DB mismatch
      const serverRoles = ((result.user as any).roles || []) as Array<{ role: AppRole }>;
      if (serverRoles.length > 0) {
        // Same hierarchy rules as fetchUserRole
        const roleHierarchy: Record<AppRole, number> = {
          'super_admin': 1,
          'ceo': 2,
          'cto': 3,
          'cfo': 4,
          'coo': 5,
          'admin': 6,
          'operations_manager': 7,
          'department_head': 8,
          'team_lead': 9,
          'project_manager': 10,
          'hr': 11,
          'finance_manager': 12,
          'sales_manager': 13,
          'marketing_manager': 14,
          'quality_assurance': 15,
          'it_support': 16,
          'legal_counsel': 17,
          'business_analyst': 18,
          'customer_success': 19,
          'employee': 20,
          'contractor': 21,
          'intern': 22
        };

        const highestRole = serverRoles
          .map(r => r.role)
          .reduce((highest, current) => {
            const currentPriority = roleHierarchy[current] || 99;
            const highestPriority = roleHierarchy[highest] || 99;
            return currentPriority < highestPriority ? current : highest;
          });

        setUserRole(highestRole);
        // Persist role for future reloads so we don't have to guess
        localStorage.setItem('user_role', highestRole);
      } else {
        // Fallback: derive role from database if server didn't include it
        fetchUserRole(result.user.id);
      }

      toast({
        title: "Login successful",
        description: "Welcome back!"
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('agency_id');
      localStorage.removeItem('agency_database');
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRole(null);
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully"
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const value = {
    user,
    session,
    profile,
    userRole,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
