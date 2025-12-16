/**
 * Utility functions for agency_id management
 * Helps ensure agency_id is always available even if not in profile
 */

import { selectOne } from '@/services/api/postgresql-service';

/**
 * Get agency_id from profile or fetch from database
 * @param profile - User profile from useAuth hook
 * @param userId - User ID
 * @returns agency_id or null if not found
 */
export async function getAgencyId(
  profile: { agency_id?: string | null } | null | undefined,
  userId: string | null | undefined
): Promise<string | null> {
  // First try from profile
  if (profile?.agency_id) {
    return profile.agency_id;
  }

  // If not in profile, try to fetch from database
  if (userId) {
    try {
      const userProfile = await selectOne('profiles', { user_id: userId });
      if (userProfile?.agency_id) {
        return userProfile.agency_id;
      }
    } catch (error) {
      console.warn('Could not fetch profile for agency_id:', error);
    }
  }

  return null;
}

/**
 * Get agency_id with retry logic
 * @param profile - User profile from useAuth hook
 * @param userId - User ID
 * @param retries - Number of retries (default: 1)
 * @returns agency_id or null if not found
 */
export async function getAgencyIdWithRetry(
  profile: { agency_id?: string | null } | null | undefined,
  userId: string | null | undefined,
  retries: number = 1
): Promise<string | null> {
  let agencyId = await getAgencyId(profile, userId);
  
  // Retry if not found and we have retries left
  if (!agencyId && retries > 0 && userId) {
    // Wait a bit before retry
    await new Promise(resolve => setTimeout(resolve, 500));
    agencyId = await getAgencyId(profile, userId);
  }

  return agencyId;
}
