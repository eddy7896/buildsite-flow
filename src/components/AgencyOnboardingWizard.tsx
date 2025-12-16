import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Globe, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Zap,
  Crown,
  Shield,
  Check,
  Phone,
  MapPin,
  Briefcase,
  Sparkles,
  Rocket,
  Target,
  TrendingUp,
  Star,
  Heart,
  FileText,
  Users,
  BarChart3,
  Settings,
  Award,
  Building,
  Network,
  Layers,
  Clock,
  TrendingDown,
  Gift,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';

interface AgencyFormData {
  // Step 1-3: Agency Information
  agencyName: string;
  domain: string;
  industry: string;
  companySize: string;
  address: string;
  phone: string;
  positioning: string;
  primaryFocus: string;
  enableGST: boolean;
  modules: {
    projects: boolean;
    finance: boolean;
    people: boolean;
    reports: boolean;
  };
  
  // Step 4: Admin Account
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
  
  // Step 6: Subscription Plan
  subscriptionPlan: string;
}

const STEPS = [
  { 
    id: 1, 
    title: 'Agency Essentials', 
    icon: Building2,
    description: 'Name your agency and reserve your workspace address',
    businessContext: 'Start with the basics. You can fine-tune details later inside your workspace.',
    color: 'slate'
  },
  { 
    id: 2, 
    title: 'Profile & Focus', 
    icon: Target,
    description: 'Tell us what kind of work your agency does',
    businessContext: 'We use this to preconfigure defaults, reports, and recommended workflows for your agency type.',
    color: 'blue'
  },
  { 
    id: 3, 
    title: 'Contact Details', 
    icon: MapPin,
    description: 'Add where you operate and how clients can reach you',
    businessContext: 'These details appear on documents, invoices, and internal records. You can refine them any time.',
    color: 'cyan'
  },
  { 
    id: 4, 
    title: 'Administrative Access', 
    icon: Shield,
    description: 'Create your primary administrator account',
    businessContext: 'This account will have full system access to manage users, permissions, and company settings.',
    color: 'blue'
  },
  { 
    id: 5, 
    title: 'Workflows & Modules', 
    icon: SlidersHorizontal,
    description: 'Choose what you want to manage in BuildFlow first',
    businessContext: 'We prioritize the modules you care about most so you see quick wins in your first week.',
    color: 'teal'
  },
  { 
    id: 6, 
    title: 'Service Tier Selection', 
    icon: Layers,
    description: 'Choose the service level that matches your operational scale',
    businessContext: 'Your selection determines system capacity, features, and support level for your organization.',
    color: 'indigo'
  },
  { 
    id: 7, 
    title: 'Final Review & Activation', 
    icon: CheckCircle2,
    description: 'Review all information before system activation',
    businessContext: 'Once activated, your company database will be created and you\'ll have immediate access.',
    color: 'emerald'
  },
];

const COMPANY_BENEFITS = {
  step1: [
    { icon: FileText, text: 'Legal entity identification' },
    { icon: Network, text: 'Professional domain setup' },
    { icon: Building, text: 'Industry classification' }
  ],
  step2: [
    { icon: Shield, text: 'Full administrative control' },
    { icon: Users, text: 'User management capabilities' },
    { icon: Settings, text: 'System configuration access' }
  ],
  step3: [
    { icon: BarChart3, text: 'Scalable infrastructure' },
    { icon: TrendingUp, text: 'Growth-ready platform' },
    { icon: Award, text: 'Priority support included' }
  ]
};

const INDUSTRIES = [
  { value: 'construction', label: 'Construction', icon: Building2 },
  { value: 'architecture', label: 'Architecture', icon: Building },
  { value: 'engineering', label: 'Engineering', icon: Settings },
  { value: 'real-estate', label: 'Real Estate', icon: Building2 },
  { value: 'consulting', label: 'Consulting', icon: Briefcase },
  { value: 'manufacturing', label: 'Manufacturing', icon: Building2 },
  { value: 'technology', label: 'Technology', icon: Network },
  { value: 'other', label: 'Other', icon: Building2 }
];

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees', icon: Users },
  { value: '11-50', label: '11-50 employees', icon: Users },
  { value: '51-200', label: '51-200 employees', icon: Users },
  { value: '201-500', label: '201-500 employees', icon: Users },
  { value: '500+', label: '500+ employees', icon: Users }
];

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    period: 'month',
    icon: Zap,
    description: 'Perfect for small teams',
    features: [
      'Up to 5 users',
      '10 projects',
      '5GB storage',
      'Email support',
      'Basic features'
    ],
    maxUsers: 5,
    color: 'from-blue-500 to-cyan-500',
    savings: null
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    period: 'month',
    icon: Building2,
    description: 'For growing agencies',
    features: [
      'Up to 25 users',
      'Unlimited projects',
      '100GB storage',
      'Priority support',
      'Advanced features',
      'API access'
    ],
    maxUsers: 25,
    color: 'from-emerald-500 to-teal-500',
    popular: true,
    savings: 'Most Popular'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    period: 'month',
    icon: Crown,
    description: 'For large organizations',
    features: [
      'Unlimited users',
      'Unlimited projects',
      'Unlimited storage',
      '24/7 dedicated support',
      'All features',
      'White-label option',
      'SSO & advanced security'
    ],
    maxUsers: 1000,
    color: 'from-amber-500 to-orange-500',
    savings: 'Best Value'
  }
];

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Domain availability check component
const DomainChecker = memo(({ domain, onAvailable }: { domain: string; onAvailable: (available: boolean) => void }) => {
  const [checking, setChecking] = useState(false);
  const debouncedDomain = useDebounce(domain, 500);

  useEffect(() => {
    if (!debouncedDomain || debouncedDomain.length < 3) {
      onAvailable(false);
      return;
    }

    const checkDomain = async () => {
      setChecking(true);
      try {
        let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        API_URL = API_URL.replace(/\/api\/?$/, '');
        
        const response = await fetch(`${API_URL}/api/agencies/check-domain?domain=${encodeURIComponent(debouncedDomain)}`);
        const result = await response.json();
        onAvailable(result.available !== false);
      } catch (error) {
        console.error('Domain check error:', error);
        onAvailable(true); // Assume available on error
      } finally {
        setChecking(false);
      }
    };

    checkDomain();
  }, [debouncedDomain, onAvailable]);

  return null;
});

DomainChecker.displayName = 'DomainChecker';

export default function AgencyOnboardingWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [userCount, setUserCount] = useState(1247); // Social proof
  const [timeRemaining, setTimeRemaining] = useState(3600); // Urgency timer
  
  const [formData, setFormData] = useState<AgencyFormData>({
    agencyName: '',
    domain: '',
    industry: '',
    companySize: '',
    address: '',
    phone: '',
    positioning: '',
    primaryFocus: '',
    enableGST: false,
    modules: {
      projects: true,
      finance: true,
      people: false,
      reports: true,
    },
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    subscriptionPlan: 'professional',
  });

  // Social proof - increment user count
  useEffect(() => {
    const interval = setInterval(() => {
      setUserCount(prev => prev + Math.floor(Math.random() * 3));
    }, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Urgency timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update company preview as user types
  useEffect(() => {
    if (formData.agencyName || formData.industry || formData.companySize) {
      // Preview update handled by state
    }
  }, [formData.agencyName, formData.industry, formData.companySize]);

  // Derived progress value with CSS transitions for smoothness
  const progress = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep]);

  const generateDomain = useCallback((agencyName: string) => {
    return agencyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 30);
  }, []);

  const suggestedDomain = useMemo(() => {
    if (!formData.agencyName) return '';
    return generateDomain(formData.agencyName);
  }, [formData.agencyName, generateDomain]);

  const suggestedAdminEmail = useMemo(() => {
    if (!formData.domain || !formData.agencyName) return '';
    const firstWord = formData.agencyName.split(' ')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'owner';
    const cleanDomain = formData.domain.toLowerCase().trim();
    return `${firstWord}@${cleanDomain}.buildflow.app`;
  }, [formData.domain, formData.agencyName]);

  const POPULAR_DIAL_CODES = ['+1', '+44', '+91'];

  const handleAgencyNameChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      agencyName: value,
      domain: generateDomain(value)
    }));
    setDomainAvailable(null);
  }, [generateDomain]);

  const handleDomainAvailable = useCallback((available: boolean) => {
    setDomainAvailable(available);
  }, []);

  // Optimized validation with debouncing
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.agencyName.trim()) {
        newErrors.agencyName = 'Company name is required';
      } else if (formData.agencyName.trim().length < 2) {
        newErrors.agencyName = 'Company name must be at least 2 characters';
      }
      
      if (!formData.domain.trim()) {
        newErrors.domain = 'Domain identifier is required';
      } else {
        const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i;
        if (!domainRegex.test(formData.domain.trim())) {
          newErrors.domain = 'Domain can only contain letters, numbers, and hyphens';
        } else if (formData.domain.trim().length < 3) {
          newErrors.domain = 'Domain must be at least 3 characters';
        } else if (domainAvailable === false) {
          newErrors.domain = 'This domain is already taken';
        }
      }
    } else if (step === 2) {
      if (!formData.industry) {
        newErrors.industry = 'Industry classification is required';
      }
      
      if (!formData.companySize) {
        newErrors.companySize = 'Organization size is required';
      }
    } else if (step === 3) {
      if (formData.phone && formData.phone.trim()) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(formData.phone.trim())) {
          newErrors.phone = 'Please enter a valid phone number';
        }
      }
    } else if (step === 4) {
      if (!formData.adminName.trim()) {
        newErrors.adminName = 'Administrator name is required';
      } else if (formData.adminName.trim().length < 2) {
        newErrors.adminName = 'Name must be at least 2 characters';
      }
      
      if (!formData.adminEmail.trim()) {
        newErrors.adminEmail = 'Email address is required';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.adminEmail.trim())) {
          newErrors.adminEmail = 'Please enter a valid email address';
        }
      }
      
      if (!formData.adminPassword) {
        newErrors.adminPassword = 'Password is required';
      } else if (formData.adminPassword.length < 8) {
        newErrors.adminPassword = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])/.test(formData.adminPassword)) {
        newErrors.adminPassword = 'Password must contain at least one lowercase letter';
      } else if (!/(?=.*[A-Z])/.test(formData.adminPassword)) {
        newErrors.adminPassword = 'Password must contain at least one uppercase letter';
      } else if (!/(?=.*\d)/.test(formData.adminPassword)) {
        newErrors.adminPassword = 'Password must contain at least one number';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.adminPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (step === 5) {
      // Workflows & Modules step currently has no required fields
      // Keep placeholder for future required preferences if needed
    } else if (step === 6) {
      if (!formData.subscriptionPlan) {
        newErrors.subscriptionPlan = 'Please select a service tier';
      }
    } else if (step === 7) {
      if (!formData.agencyName.trim() || !formData.domain.trim() || 
          !formData.industry || !formData.companySize ||
          !formData.adminName.trim() || !formData.adminEmail.trim() || 
          !formData.adminPassword || !formData.subscriptionPlan) {
        newErrors.general = 'Please complete all required fields';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, domainAvailable]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }

      if (currentStep < STEPS.length) {
        // Move to the next step immediately for snappier UX
        setCurrentStep(prev => prev + 1);
      }
    }
  }, [currentStep, validateStep, completedSteps]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(7)) {
      return;
    }

    setIsLoading(true);
    try {
      let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      API_URL = API_URL.replace(/\/api\/?$/, '');
      
      const response = await fetch(`${API_URL}/api/agencies/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agencyName: formData.agencyName,
          domain: formData.domain,
          industry: formData.industry,
          companySize: formData.companySize,
          address: formData.address,
          phone: formData.phone,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          subscriptionPlan: formData.subscriptionPlan,
          // New preference fields are kept for future use and are not yet wired into backend schema
          primaryFocus: formData.primaryFocus || undefined,
          enableGST: formData.enableGST || undefined,
          modules: formData.modules,
        }),
      });

      let result;
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (isJson) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = text ? { error: text } : { error: `Server error: ${response.status}` };
      }

      if (!response.ok) {
        const errorMessage = result.error || result.message || `Server error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to create agency');
      }

      // Automatically sign in the new SUPER_ADMIN and redirect to Super Admin Dashboard
      try {
        const { error } = await signIn(formData.adminEmail, formData.adminPassword);

        if (error) {
          throw error;
        }

        toast({
          title: '🎉 Workspace Ready!',
          description: 'Your agency workspace is live. You now have full Super Admin access to configure your agency.',
        });

        const agencyId = result.agency?.id;
        if (agencyId) {
          navigate(`/agency/${agencyId}/super-admin-dashboard`);
        } else {
          // Fallback if agency id is missing for any reason
          navigate('/dashboard');
        }
      } catch (authError: any) {
        console.error('Auto sign-in after agency creation failed:', authError);
        // Do NOT redirect away; keep them here and ask them to log in manually
        toast({
          title: 'Agency Created, Sign-in Needed',
          description: authError?.message || 'Your agency was created, but we could not sign you in automatically. Please log in with your admin credentials to continue.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Agency creation error:', error);
      toast({
        title: 'Creation Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateStep, navigate, toast, signIn]);

  const currentStepData = useMemo(() => STEPS[currentStep - 1], [currentStep]);
  const CurrentStepIcon = currentStepData?.icon || Building2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 relative overflow-hidden">
      {/* Enhanced animated gradient background (sizes tuned for better performance) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[520px] h-[520px] bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-cyan-500/20 rounded-full filter blur-[160px] animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-gradient-to-br from-blue-600/25 via-indigo-600/20 to-purple-600/15 rounded-full filter blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-[420px] h-[420px] bg-gradient-to-br from-emerald-600/15 via-teal-600/10 to-cyan-600/10 rounded-full filter blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Enhanced grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col p-2 sm:p-3 lg:p-4 overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto flex flex-col">
          {/* Enhanced Header Section */}
          <div className="mb-2 sm:mb-3 flex-shrink-0">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 shadow-2xl shadow-emerald-500/40 mb-1 transition-transform hover:scale-110">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white mb-0.5">
                Build<span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Flow</span>
              </h1>
              <p className="text-xs text-slate-400">Agency Setup</p>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 flex items-center justify-center shadow-2xl shadow-emerald-500/40 transition-transform hover:scale-110 cursor-pointer">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white leading-tight">
                    Build<span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Flow</span>
                  </h1>
                  <p className="text-xs text-slate-400">Company Setup</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent transition-all duration-300 hover:scale-110 inline-block">
                  {Math.round(progress)}%
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">
                  Complete
                </div>
              </div>
            </div>
            
            {/* Social Proof Banner */}
            <div className="mb-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5 flex items-center justify-center gap-2 text-xs">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-300">
                <span className="font-semibold text-emerald-400">{userCount.toLocaleString()}+</span> companies onboarded in the last 30 days
              </span>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="relative mb-2">
              <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-700 ease-out shadow-lg shadow-emerald-500/40 relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
            
            {/* Enhanced Step Indicators */}
            <div className="flex justify-between relative">
              <div className="absolute top-5 left-0 right-0 h-px bg-slate-800/50 -z-10 hidden sm:block" />
              <div 
                className="absolute top-5 left-0 h-px bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-700 -z-10 hidden sm:block"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />
              
              {STEPS.map((step) => {
                const StepIcon = step.icon;
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = step.id === currentStep;
                const isPast = step.id < currentStep;
                
                return (
                  <div 
                    key={step.id} 
                    className="flex flex-col items-center relative z-10 bg-transparent px-0.5 sm:px-1 flex-1 max-w-[100px] sm:max-w-none cursor-pointer group"
                    onClick={() => {
                      if (isPast || isCompleted) {
                        setCurrentStep(step.id);
                      }
                    }}
                  >
                    <div className={`relative mb-1.5 transition-all duration-300 ${
                      isCurrent ? 'scale-110' : 'group-hover:scale-105'
                    }`}>
                      <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-lg ${
                        isCompleted
                          ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 border-emerald-400 shadow-emerald-500/40'
                          : isCurrent
                          ? 'bg-slate-800/90 border-emerald-400 border-2 backdrop-blur-sm shadow-emerald-500/30'
                          : isPast
                          ? 'bg-gradient-to-br from-emerald-500/80 via-teal-500/80 to-cyan-500/80 border-emerald-400/50'
                          : 'bg-slate-800/50 border-slate-700/50 backdrop-blur-sm'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        ) : (
                          <StepIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${
                            isCurrent ? 'text-emerald-400' : isPast ? 'text-white' : 'text-slate-500'
                          }`} />
                        )}
                      </div>
                      {isCurrent && (
                        <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-30" />
                      )}
                    </div>
                    
                    <div className="text-center w-full">
                      <div className={`text-xs sm:text-sm font-semibold transition-all leading-tight ${
                        isCurrent ? 'text-white' : isPast ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        {step.title.split(' ')[0]}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mt-2">
            {/* Left Column - Form */}
            <div className="lg:col-span-2">
              <Card className="border-slate-800/50 bg-slate-900/60 backdrop-blur-xl shadow-2xl flex flex-col transition-all duration-300 hover:shadow-emerald-500/20">
                <CardHeader className="border-b border-slate-800/50 bg-gradient-to-r from-slate-800/40 to-slate-800/20 flex-shrink-0 py-3 sm:py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform hover:scale-110 hover:rotate-3">
                      <CurrentStepIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl font-semibold text-white leading-tight">
                        {currentStepData?.title}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-slate-400 mt-1 leading-tight">
                        {currentStepData?.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {/* Step 1: Agency Essentials */}
                  {currentStep === 1 && (
                    <div className="animate-fade-in h-full flex flex-col space-y-4">
                      <div className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-2 flex-shrink-0">
                        {currentStepData?.businessContext}
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-min">
                        <div className="space-y-2 group sm:col-span-2">
                          <Label htmlFor="agencyName" className="text-xs sm:text-sm font-medium text-slate-300 transition-colors group-focus-within:text-emerald-400">
                            Legal Company Name <span className="text-emerald-400">*</span>
                          </Label>
                          <Input
                            id="agencyName"
                            placeholder="Enter company name"
                            value={formData.agencyName}
                            onChange={(e) => handleAgencyNameChange(e.target.value)}
                            className={`h-11 sm:h-12 text-sm bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500 transition-all duration-200 ${
                              errors.agencyName 
                                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20 shake' 
                                : 'focus:border-emerald-500/50 focus:ring-emerald-500/20 hover:border-slate-600'
                            } ${formData.agencyName && !errors.agencyName ? 'border-emerald-500/40' : ''}`}
                          />
                          {errors.agencyName && (
                            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                              <span>⚠</span>
                              <span>{errors.agencyName}</span>
                            </p>
                          )}
                          {formData.agencyName && !errors.agencyName && (
                            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 animate-fade-in">
                              <CheckCircle2 className="h-3 w-3 animate-scale-in" />
                              Valid company name
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 group sm:col-span-2">
                          <Label htmlFor="domain" className="text-xs sm:text-sm font-medium text-slate-300 transition-colors group-focus-within:text-emerald-400">
                            Domain Identifier <span className="text-emerald-400">*</span>
                          </Label>
                          <DomainChecker domain={formData.domain} onAvailable={handleDomainAvailable} />
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Input
                                id="domain"
                                placeholder="company-id"
                                value={formData.domain}
                                onChange={(e) => {
                                  setFormData(prev => ({ ...prev, domain: e.target.value }));
                                  setDomainAvailable(null);
                                }}
                                className={`h-11 sm:h-12 text-sm bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500 font-mono transition-all duration-200 ${
                                  errors.domain 
                                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20 shake' 
                                    : domainAvailable === true
                                    ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20'
                                    : 'focus:border-emerald-500/50 focus:ring-emerald-500/20 hover:border-slate-600'
                                }`}
                              />
                              {formData.domain && domainAvailable === true && !errors.domain && (
                                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400 animate-scale-in" />
                              )}
                              {formData.domain && domainAvailable === false && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-400">✕</span>
                              )}
                            </div>
                            <span className="text-xs sm:text-sm text-slate-400 whitespace-nowrap font-mono px-3 py-3 bg-slate-800/40 border border-slate-700/50 rounded-md">.buildflow.app</span>
                          </div>
                          {errors.domain && (
                            <p className="text-xs text-red-400 mt-1">{errors.domain}</p>
                          )}
                          {!errors.domain && suggestedDomain && suggestedDomain !== formData.domain && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, domain: suggestedDomain }));
                                setDomainAvailable(null);
                              }}
                              className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline"
                            >
                              <Sparkles className="h-3 w-3" />
                              <span>
                                Use suggested ID:{' '}
                                <span className="font-mono">{suggestedDomain}</span>
                              </span>
                            </button>
                          )}
                          {formData.domain && domainAvailable === true && !errors.domain && (
                            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Domain available
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            Used for system routing and database identification. Cannot be changed after setup.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Profile & Focus */}
                  {currentStep === 2 && (
                    <div className="animate-fade-in h-full flex flex-col space-y-4">
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-2 flex-shrink-0">
                        {currentStepData?.businessContext}
                      </p>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-min">
                        {/* Industry Selection - Clickable Cards */}
                        <div className="space-y-2 group sm:col-span-2">
                          <Label className="text-xs sm:text-sm font-medium text-slate-300 transition-colors">
                            Industry <span className="text-emerald-400">*</span>
                          </Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {INDUSTRIES.map((industry) => {
                              const IndustryIcon = industry.icon;
                              const isSelected = formData.industry === industry.value;
                              return (
                                <button
                                  key={industry.value}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, industry: industry.value }))}
                                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 group/btn ${
                                    isSelected
                                      ? 'border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/20 scale-105'
                                      : 'border-slate-700/50 bg-slate-800/40 hover:border-emerald-500/50 hover:bg-slate-800/60 hover:scale-102'
                                  }`}
                                >
                                  <IndustryIcon className={`h-5 w-5 ${
                                    isSelected ? 'text-emerald-400' : 'text-slate-400 group-hover/btn:text-emerald-400'
                                  }`} />
                                  <span className={`text-xs font-medium ${
                                    isSelected ? 'text-emerald-400' : 'text-slate-300'
                                  }`}>
                                    {industry.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          {errors.industry && (
                            <p className="text-xs text-red-400 mt-1">{errors.industry}</p>
                          )}
                        </div>

                        {/* Company Size Selection - Clickable Cards */}
                        <div className="space-y-2 group sm:col-span-2">
                          <Label className="text-xs sm:text-sm font-medium text-slate-300 transition-colors">
                            Organization Size <span className="text-emerald-400">*</span>
                          </Label>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {COMPANY_SIZES.map((size) => {
                              const SizeIcon = size.icon;
                              const isSelected = formData.companySize === size.value;
                              return (
                                <button
                                  key={size.value}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, companySize: size.value }))}
                                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 group/btn ${
                                    isSelected
                                      ? 'border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/20 scale-105'
                                      : 'border-slate-700/50 bg-slate-800/40 hover:border-emerald-500/50 hover:bg-slate-800/60 hover:scale-102'
                                  }`}
                                >
                                  <SizeIcon className={`h-5 w-5 ${
                                    isSelected ? 'text-emerald-400' : 'text-slate-400 group-hover/btn:text-emerald-400'
                                  }`} />
                                  <span className={`text-xs font-medium text-center ${
                                    isSelected ? 'text-emerald-400' : 'text-slate-300'
                                  }`}>
                                    {size.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          {errors.companySize && (
                            <p className="text-xs text-red-400 mt-1">{errors.companySize}</p>
                          )}
                        </div>

                        {/* Positioning */}
                        <div className="space-y-2 group sm:col-span-2">
                          <Label htmlFor="positioning" className="text-xs sm:text-sm font-medium text-slate-300 transition-colors group-focus-within:text-emerald-400">
                            How would you describe your agency? <span className="text-slate-500">(optional)</span>
                          </Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                            <Input
                              id="positioning"
                              placeholder="e.g. Design-first construction consultancy focused on residential projects"
                              value={formData.positioning}
                              onChange={(e) => setFormData(prev => ({ ...prev, positioning: e.target.value }))}
                              className="pl-10 h-11 sm:h-12 text-sm bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-200 hover:border-slate-600"
                            />
                          </div>
                          <p className="text-[11px] text-slate-500">
                            This helps us tailor dashboards and recommendations. You can refine it later.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Contact & Location */}
                  {currentStep === 3 && (
                    <div className="animate-fade-in h-full flex flex-col space-y-4">
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-2 flex-shrink-0">
                        {currentStepData?.businessContext}
                      </p>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-min">
                        <div className="space-y-2 group sm:col-span-2">
                          <Label htmlFor="address" className="text-xs sm:text-sm font-medium text-slate-300 transition-colors group-focus-within:text-emerald-400">
                            Business Address <span className="text-slate-500">(optional)</span>
                          </Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                            <Input
                              id="address"
                              placeholder="Street, city, country"
                              value={formData.address}
                              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                              className="pl-10 h-11 sm:h-12 text-sm bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-200 hover:border-slate-600"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 group sm:col-span-2">
                          <Label htmlFor="phone" className="text-xs sm:text-sm font-medium text-slate-300 transition-colors group-focus-within:text-emerald-400">
                            Contact Number <span className="text-slate-500">(optional)</span>
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              value={formData.phone}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, phone: e.target.value }));
                                if (errors.phone) {
                                  setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.phone;
                                    return newErrors;
                                  });
                                }
                              }}
                              className={`pl-10 h-11 sm:h-12 text-sm bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-200 hover:border-slate-600 ${
                                errors.phone 
                                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20 shake' 
                                  : ''
                              }`}
                            />
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className="text-[11px] text-slate-500 mr-1">Quick country codes:</span>
                            {POPULAR_DIAL_CODES.map((code) => (
                              <button
                                key={code}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => {
                                    const existing = prev.phone || '';
                                    const withoutOldCode = existing.replace(/^\+\d+\s*/, '');
                                    return {
                                      ...prev,
                                      phone: existing.startsWith(code)
                                        ? existing
                                        : `${code} ${withoutOldCode}`.trim(),
                                    };
                                  });
                                }}
                                className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors ${
                                  (formData.phone || '').startsWith(code)
                                    ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                                    : 'border-slate-700/70 text-slate-300 hover:border-emerald-500/60 hover:bg-slate-800/70'
                                }`}
                              >
                                {code}
                              </button>
                            ))}
                          </div>
                          {errors.phone && (
                            <p className="text-xs text-red-400 mt-1 flex items-center gap-1 animate-fade-in">
                              <span>⚠</span>
                              <span>{errors.phone}</span>
                            </p>
                          )}
                          <p className="text-[11px] text-slate-500 mt-1">
                            We recommend adding a number so clients and your team can reach you quickly.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Administrative Access */}
                  {currentStep === 4 && (
                    <div className="animate-fade-in h-full flex flex-col space-y-4">
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-2 flex-shrink-0">
                        {currentStepData?.businessContext}
                      </p>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-min">
                        <div className="space-y-2 group sm:col-span-2">
                          <Label htmlFor="adminName" className="text-xs sm:text-sm font-medium text-slate-300 transition-colors group-focus-within:text-emerald-400">
                            Administrator Name <span className="text-emerald-400">*</span>
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                            <Input
                              id="adminName"
                              placeholder="Full legal name"
                              value={formData.adminName}
                              onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
                              className={`pl-10 h-11 sm:h-12 text-sm bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-200 hover:border-slate-600 ${
                                errors.adminName 
                                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20 shake' 
                                  : ''
                              }`}
                            />
                          </div>
                          {errors.adminName && (
                            <p className="text-xs text-red-400 mt-1 animate-fade-in">{errors.adminName}</p>
                          )}
                        </div>

                        <div className="space-y-2 group sm:col-span-2">
                          <Label htmlFor="adminEmail" className="text-xs sm:text-sm font-medium text-slate-300 transition-colors group-focus-within:text-emerald-400">
                            Email Address <span className="text-emerald-400">*</span>
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                            <Input
                              id="adminEmail"
                              type="email"
                              placeholder="admin@company.com"
                              value={formData.adminEmail}
                              onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                              className={`pl-10 h-11 sm:h-12 text-sm bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-200 hover:border-slate-600 ${
                                errors.adminEmail 
                                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20 shake' 
                                  : ''
                              }`}
                            />
                          </div>
                          {errors.adminEmail && (
                            <p className="text-xs text-red-400 mt-1 animate-fade-in">{errors.adminEmail}</p>
                          )}
                          {!errors.adminEmail && suggestedAdminEmail && (
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                              <span>Suggested:</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    adminEmail: suggestedAdminEmail,
                                  }))
                                }
                                className="px-2 py-0.5 rounded-full border border-emerald-500/70 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors font-mono"
                              >
                                {suggestedAdminEmail}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2 group">
                            <Label htmlFor="adminPassword" className="text-xs sm:text-sm font-medium text-slate-300 transition-colors group-focus-within:text-emerald-400">
                              Password <span className="text-emerald-400">*</span>
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                              <Input
                                id="adminPassword"
                                type="password"
                                placeholder="Min 8 characters"
                                value={formData.adminPassword}
                                onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                                className={`pl-10 h-11 sm:h-12 text-sm bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-200 hover:border-slate-600 ${
                                  errors.adminPassword 
                                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20 shake' 
                                    : ''
                                } ${formData.adminPassword && formData.adminPassword.length >= 8 && !errors.adminPassword ? 'border-emerald-500/40' : ''}`}
                              />
                              {formData.adminPassword && formData.adminPassword.length >= 8 && !errors.adminPassword && (
                                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400 animate-scale-in" />
                              )}
                            </div>
                            {errors.adminPassword && (
                              <p className="text-xs text-red-400 mt-1 animate-fade-in">{errors.adminPassword}</p>
                            )}
                            {formData.adminPassword && (
                              <div className="flex gap-1.5 mt-2">
                                {[1, 2, 3, 4].map((level) => (
                                  <div
                                    key={level}
                                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                      formData.adminPassword.length >= level * 2
                                        ? formData.adminPassword.length >= 8
                                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                          : 'bg-amber-500'
                                        : 'bg-slate-700/50'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          <p className="mt-1 text-[11px] text-slate-500">
                            Your password is securely hashed and can be changed later from your account settings.
                          </p>
                          </div>

                          <div className="space-y-2 group">
                            <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium text-slate-300 transition-colors group-focus-within:text-emerald-400">
                              Confirm Password <span className="text-emerald-400">*</span>
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
                              <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Re-enter password"
                                value={formData.confirmPassword}
                                onChange={(e) => {
                                  setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                                  if (errors.confirmPassword) {
                                    setErrors(prev => {
                                      const newErrors = { ...prev };
                                      delete newErrors.confirmPassword;
                                      return newErrors;
                                    });
                                  }
                                }}
                                className={`pl-10 h-11 sm:h-12 text-sm bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-200 hover:border-slate-600 ${
                                  errors.confirmPassword 
                                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20 shake' 
                                    : ''
                                } ${formData.confirmPassword && formData.adminPassword === formData.confirmPassword && !errors.confirmPassword ? 'border-emerald-500/40' : ''}`}
                              />
                              {formData.confirmPassword && formData.adminPassword === formData.confirmPassword && !errors.confirmPassword && (
                                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400 animate-scale-in" />
                              )}
                            </div>
                            {errors.confirmPassword && (
                              <p className="text-xs text-red-400 mt-1 flex items-center gap-1 animate-fade-in">
                                <span>⚠</span>
                                <span>{errors.confirmPassword}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Workflows & Modules */}
                  {currentStep === 5 && (
                    <div className="animate-fade-in h-full flex flex-col space-y-4">
                      <div className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-2 flex-shrink-0">
                        {currentStepData?.businessContext}
                      </div>

                      <div className="flex-1 space-y-4">
                        {/* Primary focus */}
                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm font-medium text-slate-300 transition-colors">
                            What do you want to get under control first?
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'projects', label: 'Projects & Jobs', description: 'Track jobs, timelines, and delivery.', icon: Briefcase },
                              { id: 'finance', label: 'Finance & Billing', description: 'Invoices, cash flow, and margins.', icon: BarChart3 },
                              { id: 'people', label: 'People & Teams', description: 'Roles, teams, and responsibilities.', icon: Users },
                              { id: 'reports', label: 'Reports & Insights', description: 'KPIs and executive dashboards.', icon: TrendingUp },
                            ].map((item) => {
                              const ItemIcon = item.icon;
                              const isSelected = formData.primaryFocus === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, primaryFocus: item.id }))}
                                  className={`p-3 rounded-lg border-2 text-left transition-all duration-200 flex flex-col gap-1 group/btn ${
                                    isSelected
                                      ? 'border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                                      : 'border-slate-700/60 bg-slate-800/40 hover:border-emerald-500/50 hover:bg-slate-800/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-md bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                                      <ItemIcon className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <span className={`text-xs font-semibold ${
                                      isSelected ? 'text-emerald-300' : 'text-slate-100'
                                    }`}>
                                      {item.label}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-400">
                                    {item.description}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            We’ll highlight features and shortcuts that match where you want the quickest wins.
                          </p>
                        </div>

                        {/* GST preference */}
                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm font-medium text-slate-300 transition-colors">
                            Do you need GST compliance in this workspace?
                          </Label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            {[
                              { value: true, label: 'Yes, enable GST', description: 'Set up GST-led invoicing, reports, and checks.', icon: CheckCircle2 },
                              { value: false, label: 'Not right now', description: 'You can turn GST on later in settings.', icon: ToggleLeft },
                            ].map((option) => {
                              const Icon = option.icon;
                              const isSelected = formData.enableGST === option.value;
                              return (
                                <button
                                  key={String(option.value)}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, enableGST: option.value }))}
                                  className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 flex items-start gap-2 text-left group/btn ${
                                    isSelected
                                      ? 'border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                                      : 'border-slate-700/60 bg-slate-800/40 hover:border-emerald-500/50 hover:bg-slate-800/60'
                                  }`}
                                >
                                  <div className="h-7 w-7 rounded-md bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 mt-0.5">
                                    <Icon className="h-4 w-4 text-emerald-400" />
                                  </div>
                                  <div>
                                    <div className={`text-xs font-semibold ${
                                      isSelected ? 'text-emerald-300' : 'text-slate-100'
                                    }`}>
                                      {option.label}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      {option.description}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Modules toggles */}
                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm font-medium text-slate-300 transition-colors">
                            Modules to start with <span className="text-slate-500">(you can change this any time)</span>
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { key: 'projects' as const, label: 'Projects', description: 'Jobs, tasks, and delivery.', icon: Briefcase },
                              { key: 'finance' as const, label: 'Finance', description: 'Invoices & payments.', icon: BarChart3 },
                              { key: 'people' as const, label: 'People', description: 'Teams & roles.', icon: Users },
                              { key: 'reports' as const, label: 'Reports', description: 'Dashboards & KPIs.', icon: Layers },
                            ].map((mod) => {
                              const Icon = mod.icon;
                              const enabled = formData.modules[mod.key];
                              return (
                                <button
                                  key={mod.key}
                                  type="button"
                                  onClick={() =>
                                    setFormData(prev => ({
                                      ...prev,
                                      modules: {
                                        ...prev.modules,
                                        [mod.key]: !prev.modules[mod.key],
                                      },
                                    }))
                                  }
                                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-between gap-2 group/btn ${
                                    enabled
                                      ? 'border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/20'
                                      : 'border-slate-700/60 bg-slate-800/40 hover:border-emerald-500/50 hover:bg-slate-800/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-md bg-emerald-500/15 flex items-center justify-center border border-emerald-500/40">
                                      <Icon className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <div>
                                      <div className={`text-xs font-semibold ${
                                        enabled ? 'text-emerald-300' : 'text-slate-100'
                                      }`}>
                                        {mod.label}
                                      </div>
                                      <div className="text-[11px] text-slate-400">
                                        {mod.description}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {enabled ? (
                                      <>
                                        <ToggleRight className="h-4 w-4 text-emerald-400" />
                                        <span className="text-[11px] text-emerald-300">On</span>
                                      </>
                                    ) : (
                                      <>
                                        <ToggleLeft className="h-4 w-4 text-slate-500" />
                                        <span className="text-[11px] text-slate-400">Off</span>
                                      </>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 6: Service Tier Selection */}
                  {currentStep === 6 && (
                    <div className="animate-fade-in h-full flex flex-col space-y-4">
                      <div className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-2 flex-shrink-0">
                        {currentStepData?.businessContext}
                      </div>

                      {/* Urgency Banner */}
                      <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-400" />
                          <span className="text-xs text-slate-300">
                            Onboarding bonus pricing ends in{' '}
                            <span className="font-bold text-amber-400">{formatTime(timeRemaining)}</span>
                          </span>
                        </div>
                        <Gift className="h-4 w-4 text-emerald-400" />
                      </div>

                      <RadioGroup
                        value={formData.subscriptionPlan}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, subscriptionPlan: value }))}
                        className="grid sm:grid-cols-3 gap-4 flex-1"
                      >
                        {PLANS.map((plan) => {
                          const PlanIcon = plan.icon;
                          const isSelected = formData.subscriptionPlan === plan.id;
                          
                          return (
                            <label key={plan.id} className="cursor-pointer group">
                              <RadioGroupItem value={plan.id} className="sr-only" />
                              <Card className={`h-full transition-all duration-300 border-2 flex flex-col relative overflow-hidden ${
                                isSelected 
                                  ? `border-emerald-500 bg-gradient-to-br from-slate-800/60 to-slate-800/40 shadow-2xl shadow-emerald-500/30 scale-[1.03] ring-2 ring-emerald-500/30` 
                                  : 'border-slate-700/50 bg-slate-800/40 hover:border-emerald-500/50 hover:bg-slate-800/50 hover:shadow-xl hover:scale-[1.01]'
                              } ${plan.popular ? 'border-emerald-500/40' : ''}`}>
                                {plan.popular && (
                                  <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                                    ⭐ MOST POPULAR
                                  </div>
                                )}
                                {plan.savings && !plan.popular && (
                                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                                    {plan.savings}
                                  </div>
                                )}
                                <CardContent className="p-4 flex flex-col flex-1">
                                  <div className="mb-4">
                                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-3 shadow-lg transition-all duration-300 ${
                                      isSelected ? 'scale-110 rotate-3' : 'group-hover:scale-105'
                                    }`}>
                                      <PlanIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <h4 className="font-bold text-lg text-white mb-1 transition-colors group-hover:text-emerald-400">{plan.name}</h4>
                                    <p className="text-xs text-slate-400 leading-tight">{plan.description}</p>
                                  </div>
                                  <div className="mb-4 pb-4 border-b border-slate-700/50">
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-3xl font-bold text-white">${plan.price}</span>
                                      <span className="text-sm text-slate-500">/{plan.period}</span>
                                    </div>
                                  </div>
                                  <ul className="space-y-2 mb-4 flex-1">
                                    {plan.features.map((feature, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-tight">
                                        <Check className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  {isSelected && (
                                    <div className="mt-auto pt-3 border-t border-slate-700/50 animate-fade-in">
                                      <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                                        <CheckCircle2 className="h-4 w-4 animate-scale-in" />
                                        <span>Selected</span>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </label>
                          );
                        })}
                      </RadioGroup>
                      {errors.subscriptionPlan && (
                        <p className="text-sm text-red-400 text-center mt-2">{errors.subscriptionPlan}</p>
                      )}
                    </div>
                  )}

                  {/* Step 7: Final Review & Activation */}
                  {currentStep === 7 && (
                    <div className="animate-fade-in h-full flex flex-col space-y-4">
                      <div className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-2 flex-shrink-0">
                        {currentStepData?.businessContext}
                      </div>

                      {/* Review Summary */}
                      <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/40 rounded-lg p-4 mb-4 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/20 flex-shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/40">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">Ready for Activation</p>
                            <p className="text-xs text-slate-300">Review your information below</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 flex-1 overflow-y-auto">
                        <Card className="border border-slate-800/50 bg-slate-800/40 backdrop-blur-sm transition-all duration-300 hover:border-slate-700/50">
                          <CardHeader className="bg-slate-800/50 border-b border-slate-800/50 py-2 px-4">
                            <CardTitle className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-emerald-400" />
                              Company Foundation
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div>
                                <div className="text-xs text-slate-500 mb-1.5">Company Name</div>
                                <p className="text-sm font-medium text-white">{formData.agencyName}</p>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 mb-1.5">Domain</div>
                                <p className="text-sm font-medium text-white font-mono">
                                  {formData.domain}.buildflow.app
                                </p>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 mb-1.5">Industry</div>
                                <p className="text-sm font-medium text-white capitalize">{formData.industry}</p>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 mb-1.5">Organization Size</div>
                                <p className="text-sm font-medium text-white">{formData.companySize}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border border-slate-800/50 bg-slate-800/40 backdrop-blur-sm transition-all duration-300 hover:border-slate-700/50">
                          <CardHeader className="bg-slate-800/50 border-b border-slate-800/50 py-2 px-4">
                            <CardTitle className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                              <Shield className="h-4 w-4 text-emerald-400" />
                              Administrative Access
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div>
                                <div className="text-xs text-slate-500 mb-1.5">Administrator Name</div>
                                <p className="text-sm font-medium text-white">{formData.adminName}</p>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 mb-1.5">Email Address</div>
                                <p className="text-sm font-medium text-white">{formData.adminEmail}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Workflows & Modules Summary */}
                        <Card className="border border-slate-800/50 bg-slate-800/40 backdrop-blur-sm transition-all duration-300 hover:border-slate-700/50">
                          <CardHeader className="bg-slate-800/50 border-b border-slate-800/50 py-2 px-4">
                            <CardTitle className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                              <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
                              Workflows & Modules
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3">
                            <div>
                              <div className="text-xs text-slate-500 mb-1.5">Primary Focus</div>
                              <p className="text-sm font-medium text-white">
                                {formData.primaryFocus
                                  ? formData.primaryFocus === 'projects'
                                    ? 'Projects & Jobs'
                                    : formData.primaryFocus === 'finance'
                                    ? 'Finance & Billing'
                                    : formData.primaryFocus === 'people'
                                    ? 'People & Teams'
                                    : 'Reports & Insights'
                                  : 'Not specified yet'}
                              </p>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 mb-1.5">GST</div>
                              <p className="text-sm font-medium text-white">
                                {formData.enableGST ? 'Enabled for this workspace' : 'Not enabled (can be turned on later)'}
                              </p>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 mb-1.5">Modules on Day 1</div>
                              <div className="flex flex-wrap gap-1.5">
                                {(['projects', 'finance', 'people', 'reports'] as const)
                                  .filter((key) => formData.modules[key])
                                  .map((key) => (
                                    <span
                                      key={key}
                                      className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                                    >
                                      {key === 'projects'
                                        ? 'Projects'
                                        : key === 'finance'
                                        ? 'Finance'
                                        : key === 'people'
                                        ? 'People'
                                        : 'Reports'}
                                    </span>
                                  ))}
                                {Object.values(formData.modules).every((v) => !v) && (
                                  <span className="text-[11px] text-slate-400">
                                    No modules selected yet (defaults will be applied).
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border border-slate-800/50 bg-slate-800/40 backdrop-blur-sm transition-all duration-300 hover:border-slate-700/50">
                          <CardHeader className="bg-slate-800/50 border-b border-slate-800/50 py-2 px-4">
                            <CardTitle className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                              <Layers className="h-4 w-4 text-emerald-400" />
                              Service Tier
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            {(() => {
                              const plan = PLANS.find(p => p.id === formData.subscriptionPlan);
                              if (!plan) return null;
                              const PlanIcon = plan.icon;
                              return (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                                      <PlanIcon className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-white">{plan.name}</p>
                                      <p className="text-xs text-slate-400">{plan.description}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-3xl font-bold text-white">${plan.price}</p>
                                    <p className="text-xs text-slate-500">/{plan.period}</p>
                                  </div>
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>

                        <p className="text-[11px] text-slate-500 mt-1">
                          You can update most of these details later from your workspace settings. Activating now creates your secure agency database and admin account.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced Navigation Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6 pt-4 border-t border-slate-800/50 flex-shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 1 || isLoading}
                      className="border-slate-700/50 bg-slate-800/40 text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-slate-600 transition-all duration-200 w-full sm:w-auto h-11 sm:h-12 text-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                      Previous
                    </Button>

                    {currentStep < STEPS.length ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-medium shadow-lg shadow-emerald-500/30 transition-all duration-200 min-w-[140px] w-full sm:w-auto h-11 sm:h-12 text-sm group hover:scale-105 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-medium shadow-lg shadow-emerald-500/30 transition-all duration-200 min-w-[160px] w-full sm:w-auto h-11 sm:h-12 text-sm group hover:scale-105 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                            Activate Agency
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Right Sidebar */}
            <div className="lg:col-span-1 flex flex-col min-h-0">
              <div className="sticky top-0 space-y-3 flex flex-col min-h-0">
                {/* Company Preview Card */}
                {currentStep <= 3 && (formData.agencyName || formData.industry || formData.companySize) && (
                  <Card className="border border-slate-800/50 bg-slate-800/40 backdrop-blur-sm shadow-xl transition-all duration-300 hover:border-slate-700/50 animate-fade-in flex-shrink-0">
                    <CardHeader className="bg-slate-800/50 border-b border-slate-800/50 py-2 px-3">
                      <CardTitle className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-emerald-400" />
                        Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-3">
                      {formData.agencyName && (
                        <div>
                          <div className="text-xs text-slate-500 mb-1.5">Company Name</div>
                          <div className="text-sm font-medium text-white">{formData.agencyName}</div>
                        </div>
                      )}
                      {formData.industry && (
                        <div>
                          <div className="text-xs text-slate-500 mb-1.5">Industry</div>
                          <div className="text-sm font-medium text-white capitalize">{formData.industry}</div>
                        </div>
                      )}
                      {formData.companySize && (
                        <div>
                          <div className="text-xs text-slate-500 mb-1.5">Organization Size</div>
                          <div className="text-sm font-medium text-white">{formData.companySize} employees</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Step Benefits */}
                {COMPANY_BENEFITS[`step${currentStep}` as keyof typeof COMPANY_BENEFITS] && (
                  <Card className="border border-slate-800/50 bg-slate-800/40 backdrop-blur-sm shadow-xl transition-all duration-300 hover:border-slate-700/50 flex-1 flex flex-col min-h-0">
                    <CardHeader className="bg-slate-800/50 border-b border-slate-800/50 py-2 px-3 flex-shrink-0">
                      <CardTitle className="text-xs sm:text-sm font-semibold text-white">
                        Benefits
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 flex-1 overflow-hidden">
                      <ul className="space-y-3">
                        {COMPANY_BENEFITS[`step${currentStep}` as keyof typeof COMPANY_BENEFITS]?.map((benefit, idx) => {
                          const BenefitIcon = benefit.icon;
                          return (
                            <li key={idx} className="flex items-start gap-2 group/item">
                              <div className="h-5 w-5 rounded bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/30">
                                <BenefitIcon className="h-3 w-3 text-emerald-400" />
                              </div>
                              <span className="text-xs text-slate-300 leading-relaxed">{benefit.text}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced System Information */}
                <Card className="border border-slate-800/50 bg-slate-800/30 backdrop-blur-sm shadow-xl transition-all duration-300 hover:border-slate-700/50 flex-shrink-0">
                  <CardContent className="p-3">
                    <div className="text-xs text-slate-400 space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Setup Progress</span>
                        <span className="font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-500 shadow-lg shadow-emerald-500/30"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="pt-2 border-t border-slate-800/50 text-xs leading-relaxed text-slate-500 flex items-center justify-between">
                        <span>
                          Step {currentStep} of {STEPS.length}
                        </span>
                        <span className="text-slate-500">
                          {currentStep === 1
                            ? 'Quick start – 2 fields only'
                            : currentStep === 2
                            ? 'Define who you are'
                            : currentStep === 3
                            ? 'Add contact details'
                            : currentStep === 4
                            ? 'Secure admin access'
                            : currentStep === 5
                            ? 'Tune workflows'
                            : currentStep === 6
                            ? 'Pick your plan'
                            : 'Review & activate'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white">
                  Creating your agency workspace
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Please wait a few moments while we set up your dedicated database, roles, and defaults.
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full w-2/3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 animate-pulse" />
              </div>
              <ul className="mt-3 space-y-1 text-[11px] text-slate-400">
                <li>• Creating a secure, isolated database for your agency</li>
                <li>• Seeding core tables for users, roles, and settings</li>
                <li>• Applying audit and compliance defaults</li>
              </ul>
              <p className="mt-3 text-[11px] text-slate-500">
                This step usually takes less than 10 seconds. You will be redirected automatically when everything is ready.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
