import { useState, useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { TwoFactorVerification } from '@/components/TwoFactorVerification';
import { loginUser } from '@/services/api/auth-postgresql';
import { 
  Loader2, CheckCircle2, ArrowRight, KeyRound, Mail,
  Shield, BarChart3, Users, Briefcase, Eye, EyeOff,
  Sparkles, TrendingUp, FolderKanban, Zap, Home,
  Building2
} from 'lucide-react';

const GridPattern = () => (
  <div 
    className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
    style={{
      backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
      backgroundSize: '64px 64px',
    }}
  />
);

const GlowOrb = ({ 
  color = 'blue', 
  size = 'lg', 
  position,
  blur = '3xl'
}: { 
  color?: 'blue' | 'emerald' | 'violet';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  position: { top?: string; bottom?: string; left?: string; right?: string };
  blur?: string;
}) => {
  const colors = {
    blue: 'bg-blue-500/20 dark:bg-blue-500/15',
    emerald: 'bg-emerald-500/20 dark:bg-emerald-500/15',
    violet: 'bg-violet-500/20 dark:bg-violet-500/15',
  };
  const sizes = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
    xl: 'w-96 h-96',
  };

  return (
    <div 
      className={`absolute rounded-full pointer-events-none blur-${blur} ${colors[color]} ${sizes[size]}`}
      style={position}
    />
  );
};

const FloatingCard = ({ 
  children, 
  delay = 0,
  className = ''
}: { 
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const BentoCard = ({ 
  icon: Icon, 
  title, 
  value, 
  trend, 
  color,
  delay = 0
}: {
  icon: any;
  title: string;
  value: string;
  trend?: string;
  color: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="group p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-white/[0.06] backdrop-blur-sm hover:border-zinc-300 dark:hover:border-white/[0.12] transition-all duration-300 hover:shadow-lg dark:hover:shadow-none"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2 rounded-xl ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      {trend && (
        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 px-2 py-0.5 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <div className="text-xl font-semibold text-zinc-900 dark:text-white font-display tracking-tight">{value}</div>
    <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">{title}</div>
  </motion.div>
);

const MiniChart = ({ delay = 0 }: { delay?: number }) => {
  const data = [35, 48, 42, 68, 55, 78, 82, 75, 92, 85, 95, 88];
  const maxVal = Math.max(...data);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-white/[0.06] backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Revenue Growth</span>
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="w-3 h-3" />
          <span className="text-[10px] font-medium">+23%</span>
        </div>
      </div>
      <div className="flex items-end gap-1 h-16">
        {data.map((val, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 dark:from-blue-500/80 dark:to-blue-400/40 rounded-sm"
            initial={{ height: 0 }}
            animate={{ height: `${(val / maxVal) * 100}%` }}
            transition={{ delay: delay + 0.3 + i * 0.03, duration: 0.4, ease: 'easeOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
};

const LiveIndicator = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="absolute -right-2 top-8 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] shadow-lg dark:shadow-xl z-10"
  >
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Live sync</span>
    </div>
  </motion.div>
);

const AIBadge = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="absolute -left-2 bottom-12 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] shadow-lg dark:shadow-xl z-10"
  >
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
        <Sparkles className="w-3 h-3 text-violet-600 dark:text-violet-400" />
      </div>
      <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">AI-powered</span>
    </div>
  </motion.div>
);

const SocialButton = ({ 
  provider, 
  icon, 
  onClick,
  disabled 
}: { 
  provider: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <Button
    type="button"
    variant="outline"
    onClick={onClick}
    disabled={disabled}
    className="flex-1 h-11 gap-2 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-white/[0.15] text-zinc-700 dark:text-zinc-300 transition-all duration-200"
  >
    {icon}
    <span className="text-sm font-medium">{provider}</span>
  </Button>
);

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);

const Auth = () => {
  const { signIn, user, loading } = useAuth();
  
  // Force dark mode on auth page
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorUserId, setTwoFactorUserId] = useState<string>('');
  const [twoFactorAgencyDatabase, setTwoFactorAgencyDatabase] = useState<string>('');

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowSuccessMessage(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail) {
      setSignInData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#000000]">
        <div className="text-center">
          <div className="relative">
            <img 
              src="/images/landing/logo.png" 
              alt="BuildFlow Logo" 
              className="h-16 w-auto object-contain mx-auto"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center border-2 border-zinc-100 dark:border-zinc-800">
              <Loader2 className="h-3 w-3 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="mt-6 text-zinc-600 dark:text-zinc-400 font-medium">Loading BuildFlow...</p>
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (rememberMe) {
      localStorage.setItem('remembered_email', signInData.email);
    } else {
      localStorage.removeItem('remembered_email');
    }
    
    try {
      const loginResult = await loginUser({
        email: signInData.email,
        password: signInData.password,
      });

      if ((loginResult as any).requiresTwoFactor) {
        setTwoFactorUserId((loginResult as any).userId);
        setTwoFactorAgencyDatabase((loginResult as any).agencyDatabase);
        setRequiresTwoFactor(true);
        setIsLoading(false);
        return;
      }

      const { error: signInError } = await signIn(signInData.email, signInData.password);
      
      if (signInError) {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    }
    
    setIsLoading(false);
  };

  const handleTwoFactorVerified = async (token?: string, recoveryCode?: string) => {
    try {
      setIsLoading(true);
      const loginResult = await loginUser({
        email: signInData.email,
        password: signInData.password,
        twoFactorToken: token,
        recoveryCode: recoveryCode,
      } as any);

      if (!(loginResult as any).requiresTwoFactor && loginResult.token) {
        localStorage.setItem('auth_token', loginResult.token);
        if ((loginResult.user as any).agency?.databaseName) {
          localStorage.setItem('agency_database', (loginResult.user as any).agency.databaseName);
          localStorage.setItem('agency_id', (loginResult.user as any).agency.id);
        }
        
        window.location.href = '/dashboard';
      } else {
        setError('Login failed after 2FA verification');
        setRequiresTwoFactor(false);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed after 2FA verification');
      setRequiresTwoFactor(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log('Google login clicked');
  };

  const handleGitHubLogin = () => {
    console.log('GitHub login clicked');
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-[#000000] dark:via-zinc-950 dark:to-[#000000] overflow-hidden">
      <GridPattern />
      
      <GlowOrb color="blue" size="xl" position={{ top: '-10%', left: '10%' }} />
      <GlowOrb color="emerald" size="lg" position={{ bottom: '10%', right: '20%' }} />
      <GlowOrb color="violet" size="md" position={{ top: '40%', right: '5%' }} />

      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-8 xl:p-16">
        <div className="relative z-10 w-full max-w-2xl">
          <FloatingCard delay={0.1}>
            <div className="mb-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.08] mb-6"
              >
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Trusted by 500+ agencies
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-4xl xl:text-5xl font-display font-semibold text-zinc-900 dark:text-white leading-[1.1] tracking-tight mb-4"
              >
                The operating system
                <br />
                <span className="text-zinc-400 dark:text-zinc-500">for modern agencies</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-lg text-zinc-600 dark:text-zinc-400 max-w-lg"
              >
                Manage projects, track finances, automate workflows, and scale your agency with one powerful platform.
              </motion.p>
            </div>
          </FloatingCard>

          <div className="relative">
            <LiveIndicator delay={1.4} />
            <AIBadge delay={1.6} />
            
            <div className="grid grid-cols-2 gap-4">
              <BentoCard
                icon={FolderKanban}
                title="Active Projects"
                value="147"
                trend="+12%"
                color="bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                delay={0.5}
              />
              <BentoCard
                icon={Users}
                title="Team Members"
                value="89"
                trend="+8"
                color="bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"
                delay={0.6}
              />
              <div className="col-span-2">
                <MiniChart delay={0.7} />
              </div>
              <BentoCard
                icon={BarChart3}
                title="Monthly Revenue"
                value="₹24.5L"
                trend="+23%"
                color="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                delay={0.8}
              />
              <BentoCard
                icon={Zap}
                title="Tasks Completed"
                value="1,247"
                color="bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                delay={0.9}
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-10 flex items-center gap-8"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-900 dark:text-white">10,000+</span> professionals trust BuildFlow
            </div>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-[45%] flex flex-col justify-center p-6 sm:p-8 lg:p-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="lg:hidden text-center mb-8">
            <img 
              src="/images/landing/logo.png" 
              alt="BuildFlow Logo" 
              className="h-12 w-auto object-contain mx-auto mb-4"
            />
            <h1 className="text-2xl font-display font-semibold text-zinc-900 dark:text-white">
              Build<span className="text-blue-600 dark:text-blue-400">Flow</span>
            </h1>
          </div>

          {showSuccessMessage && (
            <Alert className="mb-6 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                <strong>Account created!</strong> Check your email to verify, then sign in.
              </AlertDescription>
            </Alert>
          )}

          {requiresTwoFactor ? (
            <TwoFactorVerification
              userId={twoFactorUserId}
              agencyDatabase={twoFactorAgencyDatabase}
              onVerified={handleTwoFactorVerified}
              onCancel={() => {
                setRequiresTwoFactor(false);
                setTwoFactorUserId('');
                setTwoFactorAgencyDatabase('');
              }}
            />
          ) : (
              <div className="rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/[0.06] shadow-xl dark:shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 p-8">
                <div className="flex justify-between items-center mb-6">
                  <Link 
                    to="/" 
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
                  >
                    <Home className="w-4 h-4" />
                    <span>Home</span>
                  </Link>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                </div>
                
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-display font-semibold text-zinc-900 dark:text-white mb-2">Welcome back</h2>
                  <p className="text-zinc-500 dark:text-zinc-400">Sign in to continue to your dashboard</p>
                </div>

                {error && (
                  <Alert className="mb-6 border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10">
                    <AlertDescription className="text-red-600 dark:text-red-400 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
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
                        className="pl-10 h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Password
                      </Label>
                      <Link 
                        to="/forgot-password" 
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
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
                        className="pl-10 pr-10 h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="remember-me" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="border-zinc-300 dark:border-zinc-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label htmlFor="remember-me" className="text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                      Remember my email
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl font-medium text-base transition-all duration-200" 
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

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-zinc-900 px-4 text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      or continue with
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mb-6">
                  <SocialButton
                    provider="Google"
                    icon={<GoogleIcon />}
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  />
                  <SocialButton
                    provider="GitHub"
                    icon={<GitHubIcon />}
                    onClick={handleGitHubLogin}
                    disabled={isLoading}
                  />
                </div>

                <div className="text-center">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Don't have an account?{' '}
                    <Link 
                      to="/agency-signup" 
                      className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      Create agency account
                    </Link>
                  </p>
                </div>
              </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-zinc-400 dark:text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Secure login</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>99.9% uptime</span>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              By signing in, you agree to our{' '}
              <Link to="/terms" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
