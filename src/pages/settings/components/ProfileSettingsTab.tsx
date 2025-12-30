/**
 * Profile Settings Tab Component
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Save, User, X, Loader2 } from "lucide-react";
import { useProfileSettings } from '../hooks/useProfileSettings';
import { useAuth } from '@/hooks/useAuth';
import { validateFileSize } from '../utils/settingsValidation';
import { useToast } from '@/hooks/use-toast';

export const ProfileSettingsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    profileSettings,
    setProfileSettings,
    loading,
    avatarFile,
    setAvatarFile,
    avatarPreview,
    setAvatarPreview,
    saveProfileSettings,
  } = useProfileSettings();

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateFileSize(file, 2);
      if (!validation.valid) {
        toast({
          title: "Error",
          description: validation.error || "Avatar file size must be less than 2MB",
          variant: "destructive",
        });
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatarPreview = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setProfileSettings(prev => ({ ...prev, avatar_url: '' }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </CardTitle>
        <CardDescription>Update your personal information and avatar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="space-y-2">
          <Label>Profile Photo</Label>
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              {avatarPreview && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                  onClick={removeAvatarPreview}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: Square image, at least 200x200px (Max 2MB)
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={profileSettings.full_name}
              onChange={(e) => setProfileSettings(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={profileSettings.phone}
              onChange={(e) => setProfileSettings(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={profileSettings.department}
              onChange={(e) => setProfileSettings(prev => ({ ...prev, department: e.target.value }))}
              placeholder="e.g., Engineering"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position / Job Title</Label>
            <Input
              id="position"
              value={profileSettings.position}
              onChange={(e) => setProfileSettings(prev => ({ ...prev, position: e.target.value }))}
              placeholder="e.g., Senior Developer"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Email Address</Label>
          <Input
            value={user?.email || ''}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Contact your administrator to change your email address
          </p>
        </div>

        <Button onClick={saveProfileSettings} disabled={loading} className="w-full md:w-auto">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Profile
        </Button>
      </CardContent>
    </Card>
  );
};

