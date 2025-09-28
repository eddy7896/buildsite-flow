import { supabase } from '@/integrations/supabase/client';
import { BaseApiService, type ApiResponse, type ApiOptions } from './base';
import { MOCK_USERS, ROUTES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import type { AppRole } from '@/utils/roleUtils';

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

interface SignInData {
  email: string;
  password: string;
}

interface UserProfile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  hire_date: string | null;
  avatar_url: string | null;
  is_active: boolean;
  agency_id: string | null;
}

interface UserRole {
  role: AppRole;
}

export class AuthService extends BaseApiService {
  static async signUp(data: SignUpData, options: ApiOptions = {}): Promise<ApiResponse<any>> {
    const redirectUrl = `${window.location.origin}${ROUTES.HOME}`;
    
    return this.execute(async () => {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.fullName
          }
        }
      });

      if (error) throw error;

      // Show success notification
      const { addNotification } = useAppStore.getState();
      addNotification({
        type: 'success',
        title: 'Check your email',
        message: SUCCESS_MESSAGES.CREATE_SUCCESS,
        priority: 'medium'
      });

      return { data: authData, error: null };
    }, { showErrorToast: true, ...options });
  }

  static async signIn(data: SignInData, options: ApiOptions = {}): Promise<ApiResponse<any>> {
    // Check for mock users first
    const mockUser = MOCK_USERS.find(u => u.email === data.email && u.password === data.password);
    
    if (mockUser) {
      return this.handleMockUserSignIn(mockUser);
    }

    // Regular Supabase authentication
    return this.execute(async () => {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) throw error;

      // Show success notification
      const { addNotification } = useAppStore.getState();
      addNotification({
        type: 'success',
        title: 'Welcome back!',
        message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
        priority: 'medium'
      });

      return { data: authData, error: null };
    }, { showErrorToast: true, ...options });
  }

  static async signOut(options: ApiOptions = {}): Promise<ApiResponse<any>> {
    return this.execute(async () => {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      // Clear stores
      useAuthStore.getState().reset();
      useAppStore.getState().reset();

      // Show success notification
      const { addNotification } = useAppStore.getState();
      addNotification({
        type: 'success',
        title: 'Signed out',
        message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
        priority: 'low'
      });

      return { data: null, error: null };
    }, { showErrorToast: true, ...options });
  }

  static async fetchUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    return this.query<UserProfile>('profiles', {
      select: '*',
      filters: { user_id: userId },
      single: true
    });
  }

  static async fetchUserRole(userId: string): Promise<ApiResponse<AppRole>> {
    // Check for mock user first
    const mockUser = MOCK_USERS.find(u => u.userId === userId);
    if (mockUser) {
      return {
        data: mockUser.role,
        error: null,
        success: true
      };
    }

    const response = await this.query<UserRole>('user_roles', {
      select: 'role',
      filters: { user_id: userId },
      orderBy: { 
        column: 'role',
        ascending: true // This will prioritize higher roles due to enum ordering
      }
    });

    if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
      // Get the highest priority role (first in the ordered list)
      return {
        data: response.data[0].role,
        error: null,
        success: true
      };
    }

    return {
      data: null,
      error: response.error || 'No role found',
      success: false
    };
  }

  private static handleMockUserSignIn(mockUser: typeof MOCK_USERS[number]): ApiResponse<any> {
    try {
      // Create mock session data
      const mockSession = {
        user: {
          id: mockUser.userId,
          email: mockUser.email,
          user_metadata: { full_name: mockUser.fullName }
        }
      };

      const mockProfile = {
        user_id: mockUser.userId,
        full_name: mockUser.fullName,
        phone: null,
        department: null,
        position: null,
        hire_date: null,
        avatar_url: null,
        is_active: true,
        agency_id: '11111111-1111-1111-1111-111111111111' // Default agency for mock users
      };

      // Update auth store
      const { setSession, setProfile, setUserRole } = useAuthStore.getState();
      setSession(mockSession as any);
      setProfile(mockProfile);
      setUserRole(mockUser.role);

      // Show success notification
      const { addNotification } = useAppStore.getState();
      addNotification({
        type: 'success',
        title: 'Welcome back!',
        message: `Signed in as ${mockUser.fullName}`,
        priority: 'medium'
      });

      return {
        data: mockSession,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: ERROR_MESSAGES.SERVER_ERROR,
        success: false
      };
    }
  }

  static async getCurrentSession(): Promise<ApiResponse<any>> {
    return this.execute(async () => {
      const { data, error } = await supabase.auth.getSession();
      return { data: data.session, error };
    });
  }

  static setupAuthStateListener(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}