import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getApiBaseUrl } from '@/config/api';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Database,
  Server,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Key,
  Sparkles,
  Building2,
  Users,
  Settings,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';

interface SetupStatus {
  tablesExist: boolean;
  superAdminExists: boolean;
  setupRequired: boolean;
  superAdmin?: {
    email: string;
    fullName: string;
    isActive: boolean;
  };
  missingTables?: {
    users: boolean;
    profiles: boolean;
    user_roles: boolean;
    agencies: boolean;
  };
  stats?: {
    totalUsers: number;
    totalAgencies: number;
  };
  message: string;
}

const GridPattern = () => (
  <div
    className="absolute inset-0 opacity-[0.02]"
    style={{
      backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
      backgroundSize: '64px 64px',
    }}
  />
);

const GlowOrb = ({
  color,
  size,
  position,
}: {
  color: 'amber' | 'emerald' | 'red' | 'blue';
  size: 'sm' | 'md' | 'lg';
  position: { top?: string; bottom?: string; left?: string; right?: string };
}) => {
  const colors = {
    amber: 'bg-amber-500/20',
    emerald: 'bg-emerald-500/15',
    red: 'bg-red-500/15',
    blue: 'bg-blue-500/15',
  };
  const sizes = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-72 h-72',
  };

  return (
    <div
      className={`absolute rounded-full pointer-events-none blur-3xl ${colors[color]} ${sizes[size]}`}
      style={position}
    />
  );
};

const StatusItem = ({
  label,
  status,
  detail,
}: {
  label: string;
  status: 'success' | 'warning' | 'error' | 'loading';
  detail?: string;
}) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    loading: <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />,
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {icons[status]}
        <span className="text-sm font-medium text-zinc-300">{label}</span>
      </div>
      {detail && (
        <span className="text-xs text-zinc-500">{detail}</span>
      )}
    </div>
  );
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-zinc-700 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-500" />
      ) : (
        <Copy className="w-4 h-4 text-zinc-500" />
      )}
    </button>
  );
};

export default function SuperAdminSetup() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [initializingTables, setInitializingTables] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSetupKey, setShowSetupKey] = useState(false);
  
  const [formData, setFormData] = useState({
    email: 'super@buildflow.local',
    password: '',
    fullName: 'Super Administrator',
    setupKey: '',
  });

  const apiBaseUrl = getApiBaseUrl();

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/setup/status`);
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.data);
        // Pre-fill email if super admin exists
        if (data.data.superAdmin?.email) {
          setFormData(prev => ({
            ...prev,
            email: data.data.superAdmin.email,
            fullName: data.data.superAdmin.fullName || 'Super Administrator',
          }));
        }
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err: any) {
      setError(`Connection failed: ${err.message}. Make sure the backend is running.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleInitializeTables = async () => {
    setInitializingTables(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/setup/init-tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Database tables initialized successfully!');
        await fetchStatus();
      } else {
        setError(data.error || 'Failed to initialize tables');
      }
    } catch (err: any) {
      setError(`Failed to initialize tables: ${err.message}`);
    } finally {
      setInitializingTables(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/setup/create-super-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        await fetchStatus();
        
        // Clear password after successful creation
        setFormData(prev => ({ ...prev, password: '', setupKey: '' }));
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      } else {
        if (data.requiresSetupKey) {
          setShowSetupKey(true);
        }
        setError(data.message || data.error);
      }
    } catch (err: any) {
      setError(`Failed to create super admin: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyLogin = async () => {
    if (!formData.email || !formData.password) {
      setError('Please enter email and password to verify');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/setup/verify-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.valid) {
        setSuccess('Credentials are valid! You can login now.');
      } else {
        setError('Credentials verification failed: ' + (data.reason || JSON.stringify(data.details)));
      }
    } catch (err: any) {
      setError(`Verification failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden relative">
      {/* Background effects */}
      <GridPattern />
      <GlowOrb color="amber" size="lg" position={{ top: '-10%', right: '-5%' }} />
      <GlowOrb color="emerald" size="md" position={{ bottom: '10%', left: '-5%' }} />
      <GlowOrb color="blue" size="sm" position={{ top: '50%', right: '20%' }} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-zinc-800/50 backdrop-blur-xl bg-zinc-950/80">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                <Shield className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  BuildFlow Setup
                </h1>
                <p className="text-xs text-zinc-500">Super Admin Configuration</p>
              </div>
            </div>
            <Badge variant="outline" className="border-amber-500/30 text-amber-500">
              <Terminal className="w-3 h-3 mr-1" />
              Setup Mode
            </Badge>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left column - Status & Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* System Status Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-zinc-100">
                      <Server className="w-5 h-5 text-amber-500" />
                      System Status
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Database and authentication status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                      </div>
                    ) : status ? (
                      <>
                        <StatusItem
                          label="Database Connection"
                          status="success"
                          detail="Connected"
                        />
                        <StatusItem
                          label="Users Table"
                          status={status.tablesExist ? 'success' : 'error'}
                          detail={status.tablesExist ? 'Ready' : 'Missing'}
                        />
                        <StatusItem
                          label="User Roles Table"
                          status={status.tablesExist ? 'success' : 'error'}
                          detail={status.tablesExist ? 'Ready' : 'Missing'}
                        />
                        <StatusItem
                          label="Profiles Table"
                          status={status.tablesExist ? 'success' : 'error'}
                          detail={status.tablesExist ? 'Ready' : 'Missing'}
                        />
                        <Separator className="my-4 bg-zinc-800" />
                        <StatusItem
                          label="Super Admin"
                          status={status.superAdminExists ? 'success' : 'warning'}
                          detail={status.superAdminExists ? 'Configured' : 'Not Set'}
                        />
                        {status.superAdmin && (
                          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-2">
                              <CheckCircle2 className="w-4 h-4" />
                              Active Super Admin
                            </div>
                            <div className="text-xs text-zinc-400 space-y-1">
                              <div><span className="text-zinc-500">Email:</span> {status.superAdmin.email}</div>
                              <div><span className="text-zinc-500">Name:</span> {status.superAdmin.fullName}</div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-zinc-500">
                        Unable to fetch status
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchStatus}
                      disabled={loading}
                      className="w-full mt-4 border-zinc-700 hover:border-zinc-600 text-zinc-300"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh Status
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Stats Card */}
              {status?.stats && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-zinc-100 text-base">
                        <Database className="w-5 h-5 text-blue-500" />
                        Database Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                          <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-blue-400">{status.stats.totalUsers}</div>
                          <div className="text-xs text-zinc-500">Total Users</div>
                        </div>
                        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                          <Building2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-emerald-400">{status.stats.totalAgencies}</div>
                          <div className="text-xs text-zinc-500">Agencies</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Quick Commands Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-zinc-100 text-base">
                      <Terminal className="w-5 h-5 text-violet-500" />
                      Quick Reference
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-500">Database URL</span>
                        <CopyButton text="postgresql://postgres:admin@localhost:5432/buildflow_db" />
                      </div>
                      <code className="text-xs text-violet-400 break-all">
                        postgresql://postgres:admin@localhost:5432/buildflow_db
                      </code>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-500">API Base URL</span>
                        <CopyButton text={apiBaseUrl} />
                      </div>
                      <code className="text-xs text-emerald-400 break-all">
                        {apiBaseUrl}
                      </code>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-500">Login URL</span>
                        <CopyButton text="/auth" />
                      </div>
                      <code className="text-xs text-blue-400">
                        /auth
                      </code>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right column - Setup Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-3"
            >
              <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-zinc-100">
                    <div className="p-2 rounded-lg bg-amber-500/20">
                      <Key className="w-5 h-5 text-amber-500" />
                    </div>
                    {status?.superAdminExists ? 'Update Super Admin' : 'Create Super Admin'}
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    {status?.superAdminExists 
                      ? 'Update the super admin credentials. A setup key is required to modify existing credentials.'
                      : 'Create the initial super admin account to manage the system.'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Alerts */}
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-6"
                      >
                        <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                          <XCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription className="text-sm">{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-6"
                      >
                        <Alert className="bg-emerald-500/10 border-emerald-500/30">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <AlertTitle className="text-emerald-400">Success</AlertTitle>
                          <AlertDescription className="text-emerald-300/80">{success}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Initialize Tables Button (if needed) */}
                  {status && !status.tablesExist && (
                    <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-amber-400 mb-1">Database Tables Missing</h4>
                          <p className="text-sm text-zinc-400 mb-3">
                            Required database tables are not initialized. Click below to create them.
                          </p>
                          <Button
                            onClick={handleInitializeTables}
                            disabled={initializingTables}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            {initializingTables ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Initializing...
                              </>
                            ) : (
                              <>
                                <Database className="w-4 h-4 mr-2" />
                                Initialize Database Tables
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-zinc-300 flex items-center gap-2">
                          <User className="w-4 h-4 text-zinc-500" />
                          Full Name
                        </Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Super Administrator"
                          className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-300 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-zinc-500" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="super@buildflow.local"
                          required
                          className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20"
                        />
                      </div>

                      {/* Password */}
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-zinc-300 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-zinc-500" />
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Minimum 8 characters"
                            required
                            minLength={8}
                            className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-zinc-500">
                          Use a strong password. Minimum 8 characters.
                        </p>
                      </div>

                      {/* Setup Key (only shown when required) */}
                      {(showSetupKey || status?.superAdminExists) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-2"
                        >
                          <Label htmlFor="setupKey" className="text-zinc-300 flex items-center gap-2">
                            <Key className="w-4 h-4 text-amber-500" />
                            Setup Key
                            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-500">
                              Required for updates
                            </Badge>
                          </Label>
                          <Input
                            id="setupKey"
                            type="password"
                            value={formData.setupKey}
                            onChange={(e) => setFormData({ ...formData, setupKey: e.target.value })}
                            placeholder="SUPER_ADMIN_SETUP_KEY or JWT secret"
                            className="bg-zinc-800/50 border-amber-500/30 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                          <p className="text-xs text-zinc-500">
                            Use <code className="text-amber-400">SUPER_ADMIN_SETUP_KEY</code> or <code className="text-amber-400">VITE_JWT_SECRET</code> from your environment.
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={submitting || !status?.tablesExist || !formData.password}
                        className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/20"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            {status?.superAdminExists ? 'Update Credentials' : 'Create Super Admin'}
                          </>
                        )}
                      </Button>
                      {status?.superAdminExists && formData.password && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleVerifyLogin}
                          className="border-zinc-700 hover:border-zinc-600 text-zinc-300"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Verify Credentials
                        </Button>
                      )}
                    </div>

                    {/* Login Link */}
                    {status?.superAdminExists && (
                      <div className="pt-4 border-t border-zinc-800">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => navigate('/auth')}
                          className="w-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Go to Login Page
                        </Button>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-6"
              >
                <Card className="bg-zinc-900/30 border-zinc-800/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-violet-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-zinc-200 mb-1">Next Steps</h4>
                        <ul className="text-sm text-zinc-400 space-y-1">
                          <li>• Login at <code className="text-emerald-400">/auth</code> with your credentials</li>
                          <li>• Access the system dashboard at <code className="text-emerald-400">/system</code></li>
                          <li>• Create and manage agencies from the super admin panel</li>
                          <li>• Configure system-wide settings and permissions</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-800/50 backdrop-blur-xl bg-zinc-950/80 py-4">
          <div className="max-w-7xl mx-auto px-6 text-center text-xs text-zinc-500">
            BuildFlow ERP • Super Admin Setup • Secure Configuration
          </div>
        </footer>
      </div>
    </div>
  );
}



