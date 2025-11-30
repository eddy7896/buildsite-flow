// PostgreSQL Authentication Service (Browser-compatible)
import { queryOne, queryMany, execute } from '@/integrations/postgresql/client';
import type { User, Profile, UserRole } from '@/integrations/postgresql/types';
import bcrypt from 'bcryptjs';

const JWT_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AuthResponse {
  token: string;
  user: User & { profile?: Profile; roles?: UserRole[] };
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  agencyId?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token (browser-compatible using btoa)
 */
export function generateToken(userId: string, email: string): string {
  const payload = {
    userId,
    email,
    exp: Math.floor((Date.now() + JWT_EXPIRATION_MS) / 1000),
    iat: Math.floor(Date.now() / 1000)
  };
  
  // Simple base64 encoding for browser (not cryptographically secure, but works for demo)
  return btoa(JSON.stringify(payload));
}

/**
 * Verify JWT token (browser-compatible)
 */
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = JSON.parse(atob(token));
    
    // Check expiration
    if (decoded.exp * 1000 < Date.now()) {
      return null;
    }
    
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    return null;
  }
}

/**
 * Register new user
 */
export async function registerUser(data: SignUpData): Promise<AuthResponse> {
  const { email, password, fullName, agencyId } = data;

  // Check if user already exists
  const existingUser = await queryOne<User>(
    'SELECT id FROM public.users WHERE email = $1',
    [email]
  );

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await queryOne<User>(
    `INSERT INTO public.users (email, password_hash, is_active, email_confirmed)
     VALUES ($1, $2, true, false)
     RETURNING *`,
    [email, passwordHash]
  );

  if (!user) {
    throw new Error('Failed to create user');
  }

  // Create profile
  const profile = await queryOne<Profile>(
    `INSERT INTO public.profiles (user_id, full_name, is_active, agency_id)
     VALUES ($1, $2, true, $3)
     RETURNING *`,
    [user.id, fullName, agencyId || '550e8400-e29b-41d4-a716-446655440000']
  );

  // Assign default role
  await execute(
    `INSERT INTO public.user_roles (user_id, role, agency_id)
     VALUES ($1, 'employee', $2)`,
    [user.id, agencyId || '550e8400-e29b-41d4-a716-446655440000']
  );

  // Generate token
  const token = generateToken(user.id, user.email);

  return {
    token,
    user: {
      ...user,
      profile: profile || undefined,
    },
  };
}

/**
 * Login user
 */
export async function loginUser(data: SignInData): Promise<AuthResponse> {
  const { email, password } = data;

  // Find user
  const user = await queryOne<User>(
    'SELECT * FROM public.users WHERE email = $1 AND is_active = true',
    [email]
  );

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const passwordMatch = await comparePassword(password, user.password_hash);
  if (!passwordMatch) {
    throw new Error('Invalid email or password');
  }

  // Update last sign in
  await execute(
    'UPDATE public.users SET last_sign_in_at = NOW() WHERE id = $1',
    [user.id]
  );

  // Get profile
  const profile = await queryOne<Profile>(
    'SELECT * FROM public.profiles WHERE user_id = $1',
    [user.id]
  );

  // Get roles
  const roles = await queryMany<UserRole>(
    'SELECT * FROM public.user_roles WHERE user_id = $1',
    [user.id]
  );

  // Generate token
  const token = generateToken(user.id, user.email);

  return {
    token,
    user: {
      ...user,
      profile: profile || undefined,
      roles: roles || undefined,
    },
  };
}

/**
 * Get current user
 */
export async function getCurrentUser(userId: string): Promise<User & { profile?: Profile; roles?: UserRole[] } | null> {
  const user = await queryOne<User>(
    'SELECT * FROM public.users WHERE id = $1 AND is_active = true',
    [userId]
  );

  if (!user) {
    return null;
  }

  const profile = await queryOne<Profile>(
    'SELECT * FROM public.profiles WHERE user_id = $1',
    [userId]
  );

  const roles = await queryMany<UserRole>(
    'SELECT * FROM public.user_roles WHERE user_id = $1',
    [userId]
  );

  return {
    ...user,
    profile: profile || undefined,
    roles: roles || undefined,
  };
}

/**
 * Change password
 */
export async function changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
  const user = await queryOne<User>(
    'SELECT * FROM public.users WHERE id = $1',
    [userId]
  );

  if (!user) {
    throw new Error('User not found');
  }

  const passwordMatch = await comparePassword(oldPassword, user.password_hash);
  if (!passwordMatch) {
    throw new Error('Current password is incorrect');
  }

  const newPasswordHash = await hashPassword(newPassword);
  await execute(
    'UPDATE public.users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, userId]
  );
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<string> {
  const user = await queryOne<User>(
    'SELECT id FROM public.users WHERE email = $1',
    [email]
  );

  if (!user) {
    // Don't reveal if email exists
    return 'If an account exists with this email, a password reset link has been sent';
  }

  // Generate reset token
  const resetToken = generateToken(user.id, 'password_reset');
  return resetToken;
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const decoded = verifyToken(token);
  
  if (!decoded) {
    throw new Error('Invalid or expired reset token');
  }

  const newPasswordHash = await hashPassword(newPassword);
  await execute(
    'UPDATE public.users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, decoded.userId]
  );
}

/**
 * Logout user (client-side only)
 */
export function logoutUser(): void {
  // Clear token from localStorage (handled by client)
}
