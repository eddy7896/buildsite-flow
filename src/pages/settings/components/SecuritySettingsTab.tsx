/**
 * Security Settings Tab Component
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, KeyRound, Shield, CheckCircle, AlertCircle, Loader2, X, QrCode } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { useSecuritySettings } from '../hooks/useSecuritySettings';
import { useState } from 'react';

export const SecuritySettingsTab = () => {
  const {
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
  } = useSecuritySettings();

  const [show2FASetup, setShow2FASetup] = useState(false);

  return (
    <>
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password for security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={securitySettings.current_password}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, current_password: e.target.value }))}
                placeholder="Enter your current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={securitySettings.new_password}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, new_password: e.target.value }))}
                placeholder="Enter your new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={securitySettings.confirm_password}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, confirm_password: e.target.value }))}
                placeholder="Confirm your new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {securitySettings.new_password && securitySettings.confirm_password && (
              <div className="flex items-center gap-2 mt-2">
                {securitySettings.new_password === securitySettings.confirm_password ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">Passwords match</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Button onClick={saveSecuritySettings} disabled={loading} variant="default" className="w-full md:w-auto">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with 2FA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!show2FASetup ? (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Status</p>
                    {twoFactorEnabled ? (
                      <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        Enabled
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        Disabled
                      </span>
                    )}
                  </div>
                  {twoFactorEnabled && twoFactorVerifiedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last verified: {new Date(twoFactorVerifiedAt).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {twoFactorEnabled
                      ? 'Your account is protected with two-factor authentication'
                      : 'Enable 2FA to add an extra layer of security to your account'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {!twoFactorEnabled ? (
                  <Button
                    onClick={() => setShow2FASetup(true)}
                    className="flex items-center gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    Enable Two-Factor Authentication
                  </Button>
                ) : (
                  <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        Disable 2FA
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the extra security layer from your account. 
                          You'll need to enter your password to confirm.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="disable2FAPassword">Enter your password</Label>
                          <Input
                            id="disable2FAPassword"
                            type="password"
                            value={disable2FAPassword}
                            onChange={(e) => setDisable2FAPassword(e.target.value)}
                            placeholder="Enter your password to confirm"
                          />
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDisable2FAPassword('')}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDisable2FA}
                          disabled={!disable2FAPassword || loading2FA}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {loading2FA ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Disabling...
                            </>
                          ) : (
                            'Disable 2FA'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>How 2FA works:</strong> When enabled, you'll need to enter a 6-digit code 
                  from your authenticator app (like Google Authenticator or Authy) each time you sign in. 
                  You'll also receive recovery codes that you can use if you lose access to your device.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Set Up Two-Factor Authentication</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShow2FASetup(false);
                    fetch2FAStatus();
                  }}
                >
                  Cancel
                </Button>
              </div>
              <TwoFactorSetup 
                onComplete={() => {
                  setShow2FASetup(false);
                  fetch2FAStatus();
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

