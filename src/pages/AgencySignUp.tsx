import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, ArrowLeft } from 'lucide-react';

const AgencySignUp = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    agencyName: '',
    domain: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const generateDomain = (agencyName: string) => {
    return agencyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
  };

  const handleAgencyNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      agencyName: value,
      domain: generateDomain(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call the agency registration edge function
      const { data, error } = await db.functions.invoke('register-agency', {
        body: {
          agencyName: formData.agencyName,
          domain: formData.domain,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword
        }
      });

      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message || "Failed to register agency. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Agency Registered Successfully!",
        description: "You can now sign in with your admin credentials.",
      });

      // Clear form
      setFormData({
        agencyName: '',
        domain: '',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
      });

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Create Your Agency</CardTitle>
          <CardDescription>
            Start your construction management journey with BuildFlow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Agency Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Agency Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="agencyName">Agency Name</Label>
                <Input
                  id="agencyName"
                  type="text"
                  placeholder="Enter your agency name"
                  value={formData.agencyName}
                  onChange={(e) => handleAgencyNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  type="text"
                  placeholder="Auto-generated from agency name"
                  value={formData.domain}
                  onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be used for your agency's unique identifier
                </p>
              </div>
            </div>

            {/* Admin User Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Admin Account</h3>
              
              <div className="space-y-2">
                <Label htmlFor="adminName">Your Full Name</Label>
                <Input
                  id="adminName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.adminName}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email Address</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword">Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Agency...
                </>
              ) : (
                'Create Agency'
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link 
              to="/auth" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Sign In
            </Link>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            By creating an agency, you agree to our Terms of Service and Privacy Policy
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencySignUp;