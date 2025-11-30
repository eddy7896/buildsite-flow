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
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded.exp * 1000 > Date.now()) {
          // Token is still valid
          const mockUser: User = {
            id: decoded.userId,
            email: decoded.email,
            email_confirmed: true,
            is_active: true
          };
          setUser(mockUser);
          
          // Fetch profile and role
          fetchUserProfile(decoded.userId);
          fetchUserRole(decoded.userId);
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
      // Check if this is a mock user and handle them differently
      const mockUsers = [
        { userId: '550e8400-e29b-41d4-a716-446655440010', role: 'super_admin' as AppRole },
        { userId: '550e8400-e29b-41d4-a716-446655440011', role: 'admin' as AppRole },
        { userId: '550e8400-e29b-41d4-a716-446655440012', role: 'hr' as AppRole },
        { userId: '550e8400-e29b-41d4-a716-446655440013', role: 'finance_manager' as AppRole },
        { userId: '550e8400-e29b-41d4-a716-446655440014', role: 'employee' as AppRole },
      ];

      const mockUser = mockUsers.find(u => u.userId === userId);
      
      if (mockUser) {
        console.log('Setting mock user role:', mockUser.role);
        setUserRole(mockUser.role);
        return;
      }

      // For real users, query the database
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

      console.log('User roles found:', userRoles, 'Selected highest role:', highestRole);
      setUserRole(highestRole);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const result = await registerUser({
        email,
        password,
        fullName,
        agencyId: '550e8400-e29b-41d4-a716-446655440000' // Default agency
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
    // Check for mock credentials first
    const mockUsers: Array<{
      email: string;
      password: string;
      fullName: string;
      role: AppRole;
      userId: string;
    }> = [
      { email: 'super@buildflow.local', password: 'super123', fullName: 'Super Administrator', role: 'super_admin', userId: '550e8400-e29b-41d4-a716-446655440010' },
      { email: 'admin@buildflow.local', password: 'admin123', fullName: 'System Administrator', role: 'admin', userId: '550e8400-e29b-41d4-a716-446655440011' },
      { email: 'hr@buildflow.local', password: 'hr123', fullName: 'HR Manager', role: 'hr', userId: '550e8400-e29b-41d4-a716-446655440012' },
      { email: 'finance@buildflow.local', password: 'finance123', fullName: 'Finance Manager', role: 'finance_manager', userId: '550e8400-e29b-41d4-a716-446655440013' },
      { email: 'employee@buildflow.local', password: 'employee123', fullName: 'John Employee', role: 'employee', userId: '550e8400-e29b-41d4-a716-446655440014' },
    ];

    const mockUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (mockUser) {
      try {
        // Create mock session
        const mockToken = btoa(JSON.stringify({
          userId: mockUser.userId,
          email: mockUser.email,
          exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
        }));

        const mockSession: Session = {
          access_token: mockToken,
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          refresh_token: 'mock-refresh',
          user: {
            id: mockUser.userId,
            email: mockUser.email,
            email_confirmed: true,
            is_active: true
          }
        };

        // Store token
        localStorage.setItem('auth_token', mockToken);
        
        // Set auth state
        setUser(mockSession.user);
        setSession(mockSession);
        
        // Create mock profile
        const mockProfile: Profile = {
          id: `profile${mockUser.userId}`,
          user_id: mockUser.userId,
          full_name: mockUser.fullName,
          phone: null,
          department: null,
          position: null,
          hire_date: null,
          avatar_url: null,
          is_active: true,
          agency_id: '550e8400-e29b-41d4-a716-446655440000'
        };
        
        setProfile(mockProfile);
        setUserRole(mockUser.role);

        toast({
          title: "Login successful",
          description: `Logged in as ${mockUser.fullName}`
        });

        return { error: null };
      } catch (error) {
        console.error('Mock login error:', error);
        toast({
          title: "Login failed",
          description: "Error setting up session",
          variant: "destructive"
        });
        return { error };
      }
    }

    // Try real database login
    try {
      const result = await loginUser({ email, password });
      
      // Store token
      localStorage.setItem('auth_token', result.token);
      
      // Set user state
      setUser(result.user as any);
      
      // Fetch profile and role
      fetchUserProfile(result.user.id);
      fetchUserRole(result.user.id);

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
    signOut
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
