import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Building, User, Shield, DollarSign, Users } from 'lucide-react';

const Auth = () => {
  const { signIn, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [signInData, setSignInData] = useState({ email: '', password: '' });

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(signInData.email, signInData.password);
    
    if (!error) {
      // Will redirect automatically via useAuth
    }
    
    setIsLoading(false);
  };

  // Mock credentials for different roles
  const mockCredentials = [
    {
      role: 'admin',
      email: 'admin@buildflow.com',
      password: 'admin123',
      description: 'Full system access',
      icon: Shield,
      variant: 'default' as const
    },
    {
      role: 'hr',
      email: 'hr@buildflow.com', 
      password: 'hr123',
      description: 'HR management access',
      icon: Users,
      variant: 'secondary' as const
    },
    {
      role: 'finance_manager',
      email: 'finance@buildflow.com',
      password: 'finance123', 
      description: 'Financial management',
      icon: DollarSign,
      variant: 'outline' as const
    },
    {
      role: 'employee',
      email: 'employee@buildflow.com',
      password: 'employee123',
      description: 'Employee portal access',
      icon: User,
      variant: 'destructive' as const
    }
  ];

  const fillMockCredentials = (email: string, password: string) => {
    setSignInData({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">BuildFlow</CardTitle>
          <CardDescription>
            Access your construction management portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mock Credentials Section */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Demo Accounts - Quick Access
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mockCredentials.map((cred) => {
                const IconComponent = cred.icon;
                return (
                  <Button
                    key={cred.role}
                    variant="outline"
                    size="sm"
                    className="h-auto p-3 flex flex-col items-center space-y-1 text-xs"
                    onClick={() => fillMockCredentials(cred.email, cred.password)}
                    type="button"
                  >
                    <IconComponent className="h-4 w-4" />
                    <Badge variant={cred.variant} className="text-xs px-1 py-0">
                      {cred.role.replace('_', ' ')}
                    </Badge>
                    <span className="text-muted-foreground text-center leading-tight">
                      {cred.description}
                    </span>
                  </Button>
                );
              })}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Click any card above to auto-fill credentials
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or sign in manually
              </span>
            </div>
          </div>

          {/* Manual Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="Enter your email"
                value={signInData.email}
                onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                placeholder="Enter your password"
                value={signInData.password}
                onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Role Information */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Role Permissions:</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                <span><strong>Admin:</strong> Full system access & user management</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                <span><strong>HR:</strong> Employee management & payroll</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-3 w-3" />
                <span><strong>Finance:</strong> Financial data & accounting</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span><strong>Employee:</strong> Personal data & attendance only</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;