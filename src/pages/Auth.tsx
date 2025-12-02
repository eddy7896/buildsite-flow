import { useState, useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { 
  Loader2, Building, CheckCircle2, ArrowRight, KeyRound, Mail,
  Shield, BarChart3, Users, Briefcase, Eye, EyeOff
} from 'lucide-react';

const Auth = () => {
  const { signIn, user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [signInData, setSignInData] = useState({ email: '', password: '' });

  // Check for registration success
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowSuccessMessage(true);
    }
  }, [searchParams]);

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail) {
      setSignInData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
              <Building className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-900">
              <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
            </div>
          </div>
          <p className="mt-6 text-slate-400 font-medium">Loading BuildFlow...</p>
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Remember email if checkbox is checked
    if (rememberMe) {
      localStorage.setItem('remembered_email', signInData.email);
    } else {
      localStorage.removeItem('remembered_email');
    }
    
    const { error: signInError } = await signIn(signInData.email, signInData.password);
    
    if (signInError) {
      setError('Invalid email or password. Please try again.');
    }
    
    setIsLoading(false);
  };

  const features = [
    { icon: Briefcase, title: 'Project Management', desc: 'Track projects, tasks & deadlines' },
    { icon: Users, title: 'Team Collaboration', desc: 'Manage your entire workforce' },
    { icon: BarChart3, title: 'Financial Analytics', desc: 'Invoicing, payroll & reports' },
    { icon: Shield, title: 'Secure & Reliable', desc: 'Enterprise-grade security' },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full filter blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/15 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-emerald-600/10 rounded-full filter blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 py-12">
          {/* Logo & Tagline */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <Building className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Build<span className="text-emerald-400">Flow</span>
                </h1>
                <p className="text-slate-500 text-sm">Agency Management Platform</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Run your agency with
              <span className="block text-emerald-400">confidence & clarity</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-lg">
              The all-in-one platform for construction and service agencies. 
              Manage projects, teams, finances, and clients from a single dashboard.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="group p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-emerald-500/20 transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm mb-0.5">{feature.title}</h3>
                    <p className="text-xs text-slate-500">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-16 pt-8 border-t border-white/[0.06]">
            <p className="text-xs text-slate-600 uppercase tracking-wider mb-4">Trusted by agencies worldwide</p>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10,000+</div>
                <div className="text-xs text-slate-500">Active Users</div>
              </div>
              <div className="w-px h-8 bg-white/[0.06]" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-xs text-slate-500">Agencies</div>
              </div>
              <div className="w-px h-8 bg-white/[0.06]" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-xs text-slate-500">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center p-6 lg:p-12">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl shadow-emerald-500/30 mb-4">
              <Building className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Build<span className="text-emerald-400">Flow</span>
            </h1>
          </div>

          {/* Registration Success Message */}
          {showSuccessMessage && (
            <Alert className="mb-6 border-emerald-500/30 bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <AlertDescription className="text-emerald-200">
                <strong>Account created successfully!</strong> Please check your email to verify your account, then sign in below.
              </AlertDescription>
            </Alert>
          )}

          {/* Sign In Card */}
          <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
                <p className="text-slate-400">Sign in to your account to continue</p>
              </div>

              {/* Error Message */}
              {error && (
                <Alert className="mb-6 border-red-500/30 bg-red-500/10">
                  <AlertDescription className="text-red-300 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-slate-300 text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="name@company.com"
                      value={signInData.email}
                      onChange={(e) => {
                        setSignInData(prev => ({ ...prev, email: e.target.value }));
                        setError('');
                      }}
                      required
                      className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password" className="text-slate-300 text-sm font-medium">
                      Password
                    </Label>
                    <Link 
                      to="/forgot-password" 
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={signInData.password}
                      onChange={(e) => {
                        setSignInData(prev => ({ ...prev, password: e.target.value }));
                        setError('');
                      }}
                      required
                      className="pl-10 pr-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="remember-me" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-slate-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <Label htmlFor="remember-me" className="text-sm text-slate-400 cursor-pointer">
                    Remember my email
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/20 transition-all duration-200" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/50" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-900/50 px-4 text-xs text-slate-500 uppercase tracking-wider">
                    New to BuildFlow?
                  </span>
                </div>
              </div>

              {/* Create Account Link */}
              <Link to="/signup">
                <Button 
                  variant="outline" 
                  className="w-full h-11 border-slate-700/50 bg-transparent text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border-slate-600 transition-all"
                >
                  Create Your Agency Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-600">
              By signing in, you agree to our{' '}
              <Link to="/terms" className="text-slate-400 hover:text-emerald-400 transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-slate-400 hover:text-emerald-400 transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
