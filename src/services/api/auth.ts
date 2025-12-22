import { BaseApiService, type ApiResponse, type ApiOptions } from './base';
import { MOCK_USERS, ROUTES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import type { AppRole } from '@/utils/roleUtils';
import { loginUser, registerUser } from '@/services/api/auth-postgresql';

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
    return this.execute(async () => {
      // Get agency_id from localStorage (set during login)
      const agencyId = typeof window !== 'undefined' ? localStorage.getItem('agency_id') : null;
      
      if (!agencyId) {
        throw new Error('Agency ID not found. Please ensure you are logged in to an agency account.');
      }
      
      const result = await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        agencyId
      });

      // Store token
      localStorage.setItem('auth_token', result.token);

      // Show success notification
      const { addNotification } = useAppStore.getState();
      addNotification({
        type: 'success',
        title: 'Account created',
        message: SUCCESS_MESSAGES.CREATE_SUCCESS,
        priority: 'medium'
      });

      return result;
    }, { showErrorToast: true, ...options });
  }

  static async signIn(data: SignInData, options: ApiOptions = {}): Promise<ApiResponse<any>> {
    // Check for mock users first
    const mockUser = MOCK_USERS.find(u => u.email === data.email && u.password === data.password);
    
    if (mockUser) {
      return this.handleMockUserSignIn(mockUser);
    }

    // Real database authentication
    return this.execute(async () => {
      const result = await loginUser({
        email: data.email,
        password: data.password
      });

      // Store token
      localStorage.setItem('auth_token', result.token);

      // Show success notification
      const { addNotification } = useAppStore.getState();
      addNotification({
        type: 'success',
        title: 'Welcome back!',
        message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
        priority: 'medium'
      });

      return result;
    }, { showErrorToast: true, ...options });
  }

  static async signOut(options: ApiOptions = {}): Promise<ApiResponse<any>> {
    return this.execute(async () => {
      // Clear token
      localStorage.removeItem('auth_token');

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

      return null;
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
        ascending: true
      }
    });

    if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
      return {
        data: (response.data as any)[0].role,
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
      // Create mock token
      const mockToken = btoa(JSON.stringify({
        userId: mockUser.userId,
        email: mockUser.email,
        exp: Math.floor(Date.now() / 1000) + 86400
      }));

      // Store token
      localStorage.setItem('auth_token', mockToken);

      // Create mock session data
      const mockSession = {
        user: {
          id: mockUser.userId,
          email: mockUser.email,
          user_metadata: { full_name: mockUser.fullName }
        }
      };

      // Get agency_id from localStorage if available, otherwise null
      const agencyId = typeof window !== 'undefined' 
        ? localStorage.getItem('agency_id') || null 
        : null;

      const mockProfile = {
        user_id: mockUser.userId,
        full_name: mockUser.fullName,
        phone: null,
        department: null,
        position: null,
        hire_date: null,
        avatar_url: null,
        is_active: true,
        agency_id: agencyId
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
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return null;
      }

      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded.exp * 1000 > Date.now()) {
          return { user: { id: decoded.userId, email: decoded.email } };
        }
        localStorage.removeItem('auth_token');
        return null;
      } catch (error) {
        localStorage.removeItem('auth_token');
        return null;
      }
    });
  }

  static setupAuthStateListener(callback: (event: string, session: any) => void) {
    // Check for token on storage change
    const handleStorageChange = (e: StorageEvent | null) => {
      try {
        // Safely access storage event properties with additional checks
        // Ensure e is a valid StorageEvent object with the expected properties
        if (e && 
            typeof e === 'object' && 
            e !== null && 
            'key' in e && 
            'newValue' in e && 
            e.key === 'auth_token') {
          const newValue = (e as StorageEvent).newValue;
          if (newValue !== undefined && newValue !== null) {
            const token = newValue || localStorage.getItem('auth_token');
            if (token) {
              callback('SIGNED_IN', { user: { id: token } });
            } else {
              callback('SIGNED_OUT', null);
            }
            return;
          }
        }
        // Fallback: check localStorage directly
        const token = localStorage.getItem('auth_token');
        if (token) {
          callback('SIGNED_IN', { user: { id: token } });
        } else {
          callback('SIGNED_OUT', null);
        }
      } catch (error) {
        // If any error occurs, fallback to checking localStorage directly
        console.warn('Error handling storage event:', error);
        const token = localStorage.getItem('auth_token');
        if (token) {
          callback('SIGNED_IN', { user: { id: token } });
        } else {
          callback('SIGNED_OUT', null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return { unsubscribe: () => window.removeEventListener('storage', handleStorageChange) };
  }
}
