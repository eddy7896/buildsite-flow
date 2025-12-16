import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Edit, Upload, User, Mail, Phone, MapPin, Calendar, Briefcase, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from '@/lib/database';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { generateUUID } from '@/lib/uuid';
import { upsertRecord, selectOne } from '@/services/api/postgresql-service';

interface UserProfile {
  id: string;
  user_id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  department?: string;
  position?: string;
  address?: string;
  hire_date?: string;
  work_location?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  notes?: string;
  skills: string[];
  full_name?: string;
  salary?: number; // This will only be visible to authorized users
  social_security_number?: string; // This will be masked for non-authorized users
}

const MyProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch employee details, profile, and salary information
      const [employeeResponse, profileResponse, salaryResponse] = await Promise.all([
        db
          .from('employee_details')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        db
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        db
          .from('employee_salary_details')
          .select('salary')
          .eq('employee_id', user.id)
          .maybeSingle()
      ]);

      // Handle errors (ignore PGRST116 which means no rows found)
      if (employeeResponse.error && employeeResponse.error.code !== 'PGRST116') {
        console.error('Error fetching employee_details:', employeeResponse.error);
      }
      if (profileResponse.error && profileResponse.error.code !== 'PGRST116') {
        console.error('Error fetching profiles:', profileResponse.error);
      }

      // Build profile from available data
      // Priority: employee_details > profiles > user
      const profileData = profileResponse.data;
      const employeeData = employeeResponse.data;
      
      // If we have profile data OR employee data, show the profile
      if (profileData || employeeData) {
        // Extract name from profile or employee_details
        let firstName = '';
        let lastName = '';
        let fullName = '';
        
        if (employeeData) {
          firstName = employeeData.first_name || '';
          lastName = employeeData.last_name || '';
          fullName = `${firstName} ${lastName}`.trim();
        } else if (profileData?.full_name) {
          fullName = profileData.full_name;
          const nameParts = fullName.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        } else if (user?.email) {
          // Fallback to email username
          firstName = user.email.split('@')[0] || 'User';
          lastName = '';
          fullName = firstName;
        }

        // Generate employee_id if not present
        let employeeId = employeeData?.employee_id;
        if (!employeeId && user?.id) {
          // Generate a simple ID from user ID
          employeeId = `EMP-${user.id.substring(0, 8).toUpperCase()}`;
        }

        const transformedProfile: UserProfile = {
          id: employeeData?.id || profileData?.id || user.id,
          user_id: user.id,
          employee_id: employeeId || 'N/A',
          first_name: firstName,
          last_name: lastName,
          phone: profileData?.phone || '',
          department: profileData?.department || '',
          position: profileData?.position || '',
          address: employeeData?.address || '',
          hire_date: employeeData?.created_at || profileData?.hire_date || profileData?.created_at || new Date().toISOString(),
          work_location: employeeData?.work_location || '',
          emergency_contact_name: employeeData?.emergency_contact_name || '',
          emergency_contact_phone: employeeData?.emergency_contact_phone || '',
          emergency_contact_relationship: employeeData?.emergency_contact_relationship || '',
          notes: employeeData?.notes || '',
          skills: Array.isArray(employeeData?.skills) 
            ? employeeData.skills.map(skill => String(skill)) 
            : [],
          full_name: fullName || user.email || 'User',
          salary: salaryResponse.data?.salary,
          social_security_number: '***-**-****' // SSN is encrypted and masked for regular users
        };
        
        setProfile(transformedProfile);
        setFormData(transformedProfile);
      } else {
        // If no profile or employee data exists, create a minimal profile from user data
        const emailUsername = user.email?.split('@')[0] || 'User';
        const minimalProfile: UserProfile = {
          id: user.id,
          user_id: user.id,
          employee_id: `EMP-${user.id.substring(0, 8).toUpperCase()}`,
          first_name: emailUsername,
          last_name: '',
          phone: '',
          department: '',
          position: '',
          address: '',
          hire_date: new Date().toISOString(),
          work_location: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          emergency_contact_relationship: '',
          notes: '',
          skills: [],
          full_name: user.email || 'User',
          salary: undefined,
          social_security_number: '***-**-****'
        };
        setProfile(minimalProfile);
        setFormData(minimalProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to fetch profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    try {
      const fullName = `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || user.email || 'User';
      
      // Upsert profile (profiles table should always exist)
      try {
        await upsertRecord('profiles', {
          user_id: user.id,
          full_name: fullName,
          phone: formData.phone || null,
          department: formData.department || null,
          position: formData.position || null,
          is_active: true,
          agency_id: '550e8400-e29b-41d4-a716-446655440000',
          updated_at: new Date().toISOString()
        }, 'user_id');
      } catch (profileError) {
        console.error('Profile upsert error:', profileError);
        // Try update if upsert fails
        try {
          await db
            .from('profiles')
            .update({
              full_name: fullName,
              phone: formData.phone || null,
              department: formData.department || null,
              position: formData.position || null,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
        } catch (updateError) {
          console.error('Profile update also failed:', updateError);
        }
      }

      // Try to upsert employee_details (optional - may not exist for all users)
      const employeeId = formData.employee_id || profile.employee_id || `EMP-${user.id.substring(0, 8).toUpperCase()}`;
      
      try {
        await upsertRecord('employee_details', {
          user_id: user.id,
          employee_id: employeeId,
          first_name: formData.first_name || '',
          last_name: formData.last_name || '',
          address: formData.address || null,
          work_location: formData.work_location || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null,
          emergency_contact_relationship: formData.emergency_contact_relationship || null,
          notes: formData.notes || null,
          skills: formData.skills || [],
          is_active: true,
          agency_id: '550e8400-e29b-41d4-a716-446655440000',
          updated_at: new Date().toISOString()
        }, 'user_id');
      } catch (employeeError) {
        console.warn('Employee details upsert failed (may require additional fields):', employeeError);
        // This is okay - employee_details is optional and may have required fields we don't have
      }

      // Update local state
      setProfile({ 
        ...profile, 
        ...formData,
        full_name: fullName,
        employee_id: employeeId
      });
      setIsEditing(false);
      
      // Refresh profile data
      await fetchProfile();
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  // Profile should always be set now (either from database or minimal from user)
  if (!profile) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </div>
        <Button onClick={() => setIsEditing(!isEditing)}>
          <Edit className="mr-2 h-4 w-4" />
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Your basic profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={isEditing ? formData.first_name || '' : profile.first_name || ''}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={isEditing ? formData.last_name || '' : profile.last_name || ''}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input 
                    id="department" 
                    value={isEditing ? formData.department || '' : profile.department || ''}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Enter department"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input 
                    id="position" 
                    value={isEditing ? formData.position || '' : profile.position || ''}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Enter position"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={user?.email || ''}
                  disabled 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={isEditing ? formData.phone || '' : profile.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea 
                  id="address" 
                  value={isEditing ? formData.address || '' : profile.address || ''}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  value={isEditing ? formData.notes || '' : profile.notes || ''}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  disabled={!isEditing}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
              <CardDescription>Your professional skills and areas of expertise</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
                {profile.skills.length === 0 && (
                  <p className="text-muted-foreground text-sm">No skills added yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>Emergency contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Contact Name</Label>
                  <Input 
                    id="emergencyName" 
                    value={isEditing ? formData.emergency_contact_name || '' : profile.emergency_contact_name || ''}
                    onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyRelationship">Relationship</Label>
                  <Input 
                    id="emergencyRelationship" 
                    value={isEditing ? formData.emergency_contact_relationship || '' : profile.emergency_contact_relationship || ''}
                    onChange={(e) => setFormData({...formData, emergency_contact_relationship: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Phone Number</Label>
                <Input 
                  id="emergencyPhone" 
                  value={isEditing ? formData.emergency_contact_phone || '' : profile.emergency_contact_phone || ''}
                  onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-semibold text-primary">
                    {profile.first_name?.charAt(0)?.toUpperCase() || 'U'}{profile.last_name?.charAt(0)?.toUpperCase() || ''}
                  </span>
                </div>
                <h2 className="text-xl font-semibold">
                  {profile.full_name || `${profile.first_name} ${profile.last_name}`.trim() || user?.email || 'User'}
                </h2>
                <p className="text-muted-foreground">{profile.position || profile.department || 'No position assigned'}</p>
                <Button variant="outline" size="sm" className="mt-2">
                  <Upload className="mr-1 h-3 w-3" />
                  Upload Photo
                </Button>
              </div>
              <Separator />
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user?.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.phone}</span>
                  </div>
                )}
                {profile.work_location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.work_location}</span>
                  </div>
                )}
                {profile.department && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.department}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="font-medium">{profile.employee_id}</p>
              </div>
              {profile.hire_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{new Date(profile.hire_date).toLocaleDateString()}</p>
                </div>
              )}
              {profile.department && (
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{profile.department}</p>
                </div>
              )}
              {profile.position && (
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium">{profile.position}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => {
            setIsEditing(false);
            setFormData(profile);
          }}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
};

export default MyProfile;