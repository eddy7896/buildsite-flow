import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
}

interface UserRole {
  role: 'admin' | 'hr' | 'finance_manager' | 'employee';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: UserRole['role'] | null;
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
  const [userRole, setUserRole] = useState<UserRole['role'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile and role fetching
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }

      setUserRole(data?.role || 'employee');
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Check your email",
        description: "Please check your email for verification link"
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Check for mock credentials first
    const mockUsers = [
      { email: 'admin@buildflow.com', password: 'admin123', fullName: 'System Administrator', role: 'admin' },
      { email: 'hr@buildflow.com', password: 'hr123', fullName: 'HR Manager', role: 'hr' },
      { email: 'finance@buildflow.com', password: 'finance123', fullName: 'Finance Manager', role: 'finance_manager' },
      { email: 'employee@buildflow.com', password: 'employee123', fullName: 'John Employee', role: 'employee' }
    ];

    const mockUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (mockUser) {
      // Simulate successful login with mock data
      try {
        // Check if profile exists in database, create if needed
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('full_name', mockUser.fullName)
          .maybeSingle();

        let userId = existingProfile?.user_id;
        
        if (!existingProfile) {
          // Create profile and role for mock user
          userId = crypto.randomUUID();
          
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              full_name: mockUser.fullName,
              department: mockUser.role === 'admin' ? 'Administration' : 
                         mockUser.role === 'hr' ? 'Human Resources' :
                         mockUser.role === 'finance_manager' ? 'Finance' : 'Construction',
              position: mockUser.role === 'admin' ? 'System Admin' :
                       mockUser.role === 'hr' ? 'HR Manager' :
                       mockUser.role === 'finance_manager' ? 'Finance Manager' : 'Site Worker',
              is_active: true
            });

          if (profileError) {
            console.error('Error creating mock profile:', profileError);
          }

          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: mockUser.role as 'admin' | 'hr' | 'finance_manager' | 'employee'
            });

          if (roleError) {
            console.error('Error creating mock role:', roleError);
          }

          // Create employee details for employee role
          if (mockUser.role === 'employee') {
            const { error: empError } = await supabase
              .from('employee_details')
              .insert({
                user_id: userId,
                employee_id: 'EMP-001',
                first_name: 'John',
                last_name: 'Employee',
                employment_type: 'full_time',
                is_active: true
              });

            if (empError) {
              console.error('Error creating employee details:', empError);
            }

            // Add salary data for testing
            const { error: salaryError } = await supabase
              .from('employee_salary_details')
              .insert({
                employee_id: userId,
                salary: 75000.00
              });

            if (salaryError) {
              console.error('Error creating salary details:', salaryError);
            }
          }
        }

        // Create mock session
        const mockSession = {
          access_token: 'mock-token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          refresh_token: 'mock-refresh',
          user: {
            id: userId,
            email: mockUser.email,
            email_confirmed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            app_metadata: {},
            user_metadata: { full_name: mockUser.fullName }
          }
        };

        // Set auth state manually for mock user
        setUser(mockSession.user as any);
        setSession(mockSession as any);
        
        // Fetch profile and role
        await fetchUserProfile(userId);
        await fetchUserRole(userId);

        toast({
          title: "Mock login successful",
          description: `Logged in as ${mockUser.fullName} (${mockUser.role})`
        });

        return { error: null };
      } catch (error) {
        console.error('Mock login error:', error);
        toast({
          title: "Mock login failed",
          description: "Error setting up mock session",
          variant: "destructive"
        });
        return { error };
      }
    }

    // Fall back to regular Supabase auth for real users
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign out failed",
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