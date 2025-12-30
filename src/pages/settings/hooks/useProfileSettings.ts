/**
 * Hook for Profile Settings
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { selectOne, updateRecord, insertRecord } from '@/services/api/postgresql-service';
import { getAgencyId } from '@/utils/agencyUtils';
import { db } from '@/lib/database';

export interface ProfileSettings {
  id?: string;
  user_id?: string;
  full_name: string;
  phone: string;
  department: string;
  position: string;
  avatar_url: string;
}

export const useProfileSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    full_name: '',
    phone: '',
    department: '',
    position: '',
    avatar_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const fetchProfileSettings = async () => {
    if (!user?.id) return;
    
    try {
      const profileData = await selectOne('profiles', { user_id: user.id });

      if (profileData) {
        setProfileSettings({
          id: profileData.id,
          user_id: profileData.user_id,
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          department: profileData.department || '',
          position: profileData.position || '',
          avatar_url: profileData.avatar_url || '',
        });
        setAvatarPreview(profileData.avatar_url || '');
      } else if (profile) {
        setProfileSettings({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          department: profile.department || '',
          position: profile.position || '',
          avatar_url: profile.avatar_url || '',
        });
        setAvatarPreview(profile.avatar_url || '');
      }
    } catch (error) {
      console.error('Error fetching profile settings:', error);
    }
  };

  const saveProfileSettings = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to update profile settings",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = profileSettings.avatar_url;

      // If a new avatar file is selected, upload it to file storage
      if (avatarFile) {
        try {
          const fileExt = avatarFile.name.split('.').pop() || 'jpg';
          const fileName = `avatars/${user.id}_${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await db.storage
            .from('avatars')
            .upload(fileName, avatarFile);

          if (uploadError) throw uploadError;

          const { data: urlData } = db.storage
            .from('avatars')
            .getPublicUrl(fileName);

          avatarUrl = urlData?.publicUrl || avatarPreview;
        } catch (uploadError: any) {
          console.error('Error uploading avatar:', uploadError);
          avatarUrl = avatarPreview;
        }
      }

      const profileToSave = {
        full_name: profileSettings.full_name,
        phone: profileSettings.phone,
        department: profileSettings.department,
        position: profileSettings.position,
        avatar_url: avatarUrl,
      };

      const existingProfile = await selectOne('profiles', { user_id: user.id });

      if (existingProfile) {
        await updateRecord('profiles', profileToSave, { user_id: user.id }, user.id);
      } else {
        await insertRecord('profiles', {
          ...profileToSave,
          user_id: user.id,
          agency_id: await getAgencyId(profile, user?.id) || undefined,
          is_active: true,
        }, user.id);
      }

      setProfileSettings(prev => ({ ...prev, avatar_url: avatarUrl }));
      setAvatarFile(null);

      await refreshProfile();

      toast({
        title: "Success",
        description: "Profile settings updated successfully",
      });
    } catch (error: any) {
      console.error('Error saving profile settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchProfileSettings();
    }
  }, [user?.id]);

  return {
    profileSettings,
    setProfileSettings,
    loading,
    avatarFile,
    setAvatarFile,
    avatarPreview,
    setAvatarPreview,
    fetchProfileSettings,
    saveProfileSettings,
  };
};

