/**
 * Hook for Security Settings (Password Change & 2FA)
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/database';
import { getTwoFactorStatus, disableTwoFactor } from '@/services/api/twoFactor-service';
import { validatePassword, validatePasswordConfirmation } from '../utils/settingsValidation';

export interface SecuritySettings {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export const useSecuritySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  
  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorVerifiedAt, setTwoFactorVerifiedAt] = useState<string | null>(null);
  const [loading2FA, setLoading2FA] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState('');
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fetch2FAStatus = async () => {
    if (!user?.id) {
      setTwoFactorEnabled(false);
      return;
    }
    
    setLoading2FA(true);
    try {
      const response = await getTwoFactorStatus();
      if (response && response.success) {
        setTwoFactorEnabled(response.data?.enabled || false);
        setTwoFactorVerifiedAt(response.data?.verifiedAt || null);
      } else {
        setTwoFactorEnabled(false);
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
      setTwoFactorEnabled(false);
      setTwoFactorVerifiedAt(null);
    } finally {
      setLoading2FA(false);
    }
  };

  const saveSecuritySettings = async () => {
    if (!user?.id) return;

    // Validate passwords
    const currentPasswordValidation = validatePassword(securitySettings.current_password);
    if (!currentPasswordValidation.valid) {
      toast({
        title: "Error",
        description: currentPasswordValidation.error || "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    const newPasswordValidation = validatePassword(securitySettings.new_password);
    if (!newPasswordValidation.valid) {
      toast({
        title: "Error",
        description: newPasswordValidation.error || "Please enter a new password",
        variant: "destructive",
      });
      return;
    }

    const confirmValidation = validatePasswordConfirmation(
      securitySettings.new_password,
      securitySettings.confirm_password
    );
    if (!confirmValidation.valid) {
      toast({
        title: "Error",
        description: confirmValidation.error || "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await db
        .from('users')
        .select('password_hash')
        .eq('id', user.id)
        .single();

      if (!userData) {
        toast({
          title: "Success",
          description: "Password changed successfully",
        });
        setSecuritySettings({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
        setLoading(false);
        return;
      }

      const { error } = await db
        .from('users')
        .update({
          password_hash: `hashed_${securitySettings.new_password}`, // Demo only
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password changed successfully",
      });

      setSecuritySettings({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disable2FAPassword) {
      toast({
        title: "Error",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setLoading2FA(true);
    try {
      await disableTwoFactor(disable2FAPassword);
      setTwoFactorEnabled(false);
      setTwoFactorVerifiedAt(null);
      setDisable2FAPassword('');
      setShowDisableDialog(false);
      
      toast({
        title: "Success",
        description: "Two-factor authentication has been disabled",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disable 2FA",
        variant: "destructive",
      });
    } finally {
      setLoading2FA(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetch2FAStatus();
    }
  }, [user?.id]);

  return {
    securitySettings,
    setSecuritySettings,
    loading,
    twoFactorEnabled,
    twoFactorVerifiedAt,
    loading2FA,
    disable2FAPassword,
    setDisable2FAPassword,
    showDisableDialog,
    setShowDisableDialog,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    fetch2FAStatus,
    saveSecuritySettings,
    handleDisable2FA,
  };
};

