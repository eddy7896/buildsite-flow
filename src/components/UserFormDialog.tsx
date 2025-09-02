import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  position?: string;
  department?: string;
  phone?: string;
  hire_date?: string;
}

interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onUserSaved: () => void;
}

interface CreatedUserCredentials {
  email: string;
  temporaryPassword: string;
  userRole: string;
}

const UserFormDialog = ({ isOpen, onClose, user, onUserSaved }: UserFormDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<CreatedUserCredentials | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    position: '',
    department: '',
    phone: '',
    hire_date: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        position: user.position || '',
        department: user.department || '',
        phone: user.phone || '',
        hire_date: user.hire_date || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: '',
        position: '',
        department: '',
        phone: '',
        hire_date: ''
      });
    }
    setCreatedUser(null);
    setShowCredentials(false);
  }, [user, isOpen]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Copied!",
        description: `${field} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        // Update existing user
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.name,
            phone: formData.phone || null,
            department: formData.department || null,
            position: formData.position || null,
            hire_date: formData.hire_date || null
          })
          .eq('user_id', user.id);

        if (profileError) {
          throw profileError;
        }

        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: formData.role as any })
          .eq('user_id', user.id);

        if (roleError) {
          throw roleError;
        }

        toast({
          title: "Success",
          description: "User updated successfully",
        });

        onUserSaved();
        onClose();
      } else {
        // Create new user using the edge function
        const { data, error } = await supabase.functions.invoke('create-agency-user', {
          body: {
            fullName: formData.name,
            email: formData.email,
            role: formData.role,
            position: formData.position || null,
            department: formData.department || null,
            phone: formData.phone || null
          }
        });

        if (error) {
          throw error;
        }

        // Store the created user credentials to display
        setCreatedUser({
          email: data.email,
          temporaryPassword: data.temporaryPassword,
          userRole: data.userRole
        });

        setShowCredentials(true);

        toast({
          title: "Success",
          description: "User created successfully! Credentials are displayed below.",
        });

        onUserSaved();
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCreatedUser(null);
    setShowCredentials(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Create New User'}</DialogTitle>
          <DialogDescription>
            {user 
              ? 'Update user information and role assignment.'
              : 'Create a new user account. Login credentials will be auto-generated and emailed to the user.'
            }
          </DialogDescription>
        </DialogHeader>

        {showCredentials && createdUser && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-semibold text-green-800">
                  User created successfully! Here are the login credentials:
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <p className="text-sm font-medium">Email:</p>
                      <p className="text-sm">{createdUser.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(createdUser.email, 'Email')}
                    >
                      {copiedField === 'Email' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Temporary Password:</p>
                      <p className="text-sm font-mono">
                        {showPassword ? createdUser.temporaryPassword : '••••••••••••'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(createdUser.temporaryPassword, 'Password')}
                      >
                        {copiedField === 'Password' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <p className="text-sm font-medium">Role:</p>
                      <p className="text-sm capitalize">{createdUser.userRole.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-green-700">
                  ⚠️ <strong>Important:</strong> Save these credentials now - they won't be shown again! 
                  A welcome email has been sent to the user with these login details.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required={!user}
                disabled={loading || !!user}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <optgroup label="Executive Level">
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="ceo">Chief Executive Officer</SelectItem>
                    <SelectItem value="cto">Chief Technology Officer</SelectItem>
                    <SelectItem value="cfo">Chief Financial Officer</SelectItem>
                    <SelectItem value="coo">Chief Operations Officer</SelectItem>
                  </optgroup>
                  <optgroup label="Management Level">
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="operations_manager">Operations Manager</SelectItem>
                    <SelectItem value="department_head">Department Head</SelectItem>
                    <SelectItem value="team_lead">Team Lead</SelectItem>
                    <SelectItem value="project_manager">Project Manager</SelectItem>
                  </optgroup>
                  <optgroup label="Specialized Roles">
                    <SelectItem value="hr">Human Resources</SelectItem>
                    <SelectItem value="finance_manager">Finance Manager</SelectItem>
                    <SelectItem value="sales_manager">Sales Manager</SelectItem>
                    <SelectItem value="marketing_manager">Marketing Manager</SelectItem>
                    <SelectItem value="quality_assurance">Quality Assurance</SelectItem>
                    <SelectItem value="it_support">IT Support</SelectItem>
                    <SelectItem value="legal_counsel">Legal Counsel</SelectItem>
                    <SelectItem value="business_analyst">Business Analyst</SelectItem>
                    <SelectItem value="customer_success">Customer Success</SelectItem>
                  </optgroup>
                  <optgroup label="General Staff">
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </optgroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hire_date">Hire Date</Label>
            <Input
              id="hire_date"
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {showCredentials ? 'Close' : 'Cancel'}
            </Button>
            {!showCredentials && (
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {user ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  user ? 'Update User' : 'Create User'
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;