import { useState, useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { CreateDemoUsers } from '@/components/CreateDemoUsers';
import { 
  Loader2, Building, User, Shield, DollarSign, Users, CheckCircle2, 
  Crown, Code, TrendingUp, FolderKanban, Target, Megaphone, Settings, 
  UserCheck, Wrench, Briefcase, GraduationCap, Sparkles, ArrowRight,
  KeyRound, ChevronRight
} from 'lucide-react';

const Auth = () => {
  const { signIn, user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  
  // Form states
  const [signInData, setSignInData] = useState({ email: '', password: '' });

  // Check for registration success
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowSuccessMessage(true);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-amber-400 mx-auto" />
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
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

  // Organized demo credentials by category
  const roleCategories = {
    executive: {
      label: 'Executive',
      icon: Crown,
      roles: [
        { role: 'super_admin', email: 'super@buildflow.com', password: 'super123', label: 'Super Admin', description: 'Full platform control', icon: Building, color: 'from-amber-500 to-orange-600' },
        { role: 'admin', email: 'admin@buildflow.com', password: 'admin123', label: 'Admin', description: 'System administration', icon: Shield, color: 'from-violet-500 to-purple-600' },
        { role: 'ceo', email: 'ceo@buildflow.com', password: 'ceo123', label: 'CEO', description: 'Chief Executive', icon: Crown, color: 'from-amber-400 to-amber-600' },
        { role: 'cto', email: 'cto@buildflow.com', password: 'cto123', label: 'CTO', description: 'Chief Technology', icon: Code, color: 'from-cyan-500 to-blue-600' },
        { role: 'cfo', email: 'cfo@buildflow.com', password: 'cfo123', label: 'CFO', description: 'Chief Financial', icon: TrendingUp, color: 'from-emerald-500 to-green-600' },
      ]
    },
    management: {
      label: 'Management',
      icon: Users,
      roles: [
        { role: 'project_manager', email: 'pm@buildflow.com', password: 'pm123', label: 'Project Manager', description: 'Project oversight', icon: FolderKanban, color: 'from-blue-500 to-indigo-600' },
        { role: 'hr', email: 'hr@buildflow.com', password: 'hr123', label: 'HR Manager', description: 'Human resources', icon: Users, color: 'from-pink-500 to-rose-600' },
        { role: 'finance_manager', email: 'finance@buildflow.com', password: 'finance123', label: 'Finance Manager', description: 'Financial operations', icon: DollarSign, color: 'from-emerald-500 to-teal-600' },
        { role: 'sales_manager', email: 'sales@buildflow.com', password: 'sales123', label: 'Sales Manager', description: 'Sales operations', icon: Target, color: 'from-orange-500 to-red-600' },
        { role: 'marketing_manager', email: 'marketing@buildflow.com', password: 'marketing123', label: 'Marketing Manager', description: 'Marketing strategy', icon: Megaphone, color: 'from-fuchsia-500 to-pink-600' },
        { role: 'operations_manager', email: 'ops@buildflow.com', password: 'ops123', label: 'Operations Manager', description: 'Daily operations', icon: Settings, color: 'from-slate-500 to-slate-700' },
        { role: 'team_lead', email: 'lead@buildflow.com', password: 'lead123', label: 'Team Lead', description: 'Team leadership', icon: UserCheck, color: 'from-indigo-500 to-violet-600' },
      ]
    },
    staff: {
      label: 'Staff',
      icon: User,
      roles: [
        { role: 'it_support', email: 'it@buildflow.com', password: 'it123', label: 'IT Support', description: 'Technical support', icon: Wrench, color: 'from-gray-500 to-gray-700' },
        { role: 'employee', email: 'employee@buildflow.com', password: 'employee123', label: 'Employee', description: 'Standard access', icon: User, color: 'from-slate-400 to-slate-600' },
        { role: 'contractor', email: 'contractor@buildflow.com', password: 'contractor123', label: 'Contractor', description: 'External contractor', icon: Briefcase, color: 'from-amber-600 to-yellow-700' },
        { role: 'intern', email: 'intern@buildflow.com', password: 'intern123', label: 'Intern', description: 'Intern access', icon: GraduationCap, color: 'from-teal-500 to-cyan-600' },
      ]
    }
  };

  const fillMockCredentials = (email: string, password: string, role: string) => {
    setSignInData({ email, password });
    setSelectedRole(role);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Left Panel - Branding & Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500 rounded-full filter blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600 rounded-full filter blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-2xl shadow-amber-500/30 mb-6">
              <Building className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
              Build<span className="text-amber-400">Flow</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-md">
              Construction management platform designed for modern teams
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4 text-left max-w-sm">
            {[
              { icon: FolderKanban, text: 'Streamlined project management' },
              { icon: Users, text: 'Team collaboration tools' },
              { icon: TrendingUp, text: 'Real-time analytics & insights' },
            ].map((feature, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-4 text-slate-300"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-amber-400" />
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <ScrollArea className="flex-1">
          <div className="min-h-screen flex flex-col justify-center p-6 lg:p-12">
            {/* Mobile branding */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg mb-4">
                <Building className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">
                Build<span className="text-amber-400">Flow</span>
              </h1>
            </div>

            <div className="max-w-md mx-auto w-full space-y-6">
              {/* Registration Success Message */}
              {showSuccessMessage && (
                <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <AlertDescription>
                    <strong>Registration successful!</strong> Please check your email to verify your account.
                  </AlertDescription>
                </Alert>
              )}

              {/* Sign In Card */}
              <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-2xl">
                <CardContent className="p-6 lg:p-8">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold text-white mb-2">Welcome back</h2>
                    <p className="text-slate-400">Sign in to continue to your dashboard</p>
                  </div>

                  {/* Demo Accounts - Tabbed Interface */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-medium text-slate-300">Quick Demo Access</span>
                    </div>
                    
                    <Tabs defaultValue="executive" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 bg-slate-700/50 p-1 rounded-lg">
                        {Object.entries(roleCategories).map(([key, category]) => (
                          <TabsTrigger 
                            key={key} 
                            value={key}
                            className="text-xs data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400 rounded-md transition-all"
                          >
                            <category.icon className="h-3.5 w-3.5 mr-1.5" />
                            {category.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      
                      {Object.entries(roleCategories).map(([key, category]) => (
                        <TabsContent key={key} value={key} className="mt-3 space-y-2">
                          {category.roles.map((cred) => {
                            const IconComponent = cred.icon;
                            const isSelected = selectedRole === cred.role;
                            return (
                              <button
                                key={cred.role}
                                type="button"
                                onClick={() => fillMockCredentials(cred.email, cred.password, cred.role)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left group ${
                                  isSelected 
                                    ? 'border-amber-500/50 bg-amber-500/10' 
                                    : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-700/30'
                                }`}
                              >
                                <div className={`flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br ${cred.color} flex items-center justify-center shadow-lg`}>
                                  <IconComponent className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-white text-sm">{cred.label}</span>
                                    {isSelected && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                                        Selected
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-slate-400">{cred.description}</span>
                                </div>
                                <ChevronRight className={`h-4 w-4 transition-transform ${
                                  isSelected ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-400 group-hover:translate-x-0.5'
                                }`} />
                              </button>
                            );
                          })}
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full bg-slate-700" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-slate-800 px-3 text-xs text-slate-500 uppercase tracking-wider">
                        or enter credentials
                      </span>
                    </div>
                  </div>

                  {/* Manual Sign In Form */}
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-slate-300">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@company.com"
                        value={signInData.email}
                        onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-slate-300">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={signInData.password}
                        onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium shadow-lg shadow-amber-500/25 transition-all duration-200" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Create Account Link */}
              <div className="text-center">
                <p className="text-slate-400 text-sm">
                  Don't have an account?{' '}
                  <Link 
                    to="/signup" 
                    className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    Create your agency
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </p>
              </div>

              {/* Demo User Creation - Collapsible */}
              <details className="group">
                <summary className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-400 cursor-pointer transition-colors py-2">
                  <Users className="h-4 w-4" />
                  <span>Need to create demo users?</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                </summary>
                <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                  <CreateDemoUsers />
                </div>
              </details>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Auth;
