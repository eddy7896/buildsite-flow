import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getApiBaseUrl } from '@/config/api';
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
  SlidersHorizontal,
  Database
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { Info, HelpCircle } from 'lucide-react';

// Available domain suffixes for selection (without buildflow)
const DOMAIN_SUFFIXES = [
  { value: '.app', label: '.app' },
  { value: '.com', label: '.com' },
  { value: '.io', label: '.io' },
  { value: '.net', label: '.net' },
  { value: '.org', label: '.org' },
  { value: '.co', label: '.co' },
  { value: '.dev', label: '.dev' },
  { value: '.tech', label: '.tech' },
];

interface AgencyFormData {
  // Step 1-3: Agency Information
  agencyName: string;
  domain: string;
  domainSuffix: string;
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
    color: 'slate',
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
    color: 'slate',
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
    color: 'slate',
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
const DomainChecker = memo(({ domain, onAvailable, onChecking }: { domain: string; onAvailable: (available: boolean | null) => void; onChecking: (checking: boolean) => void }) => {
  const debouncedDomain = useDebounce(domain, 500);

  useEffect(() => {
    if (!debouncedDomain || debouncedDomain.length < 3) {
      onAvailable(null);
      onChecking(false);
      return;
    }

    // Validate domain format before checking
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i;
    if (!domainRegex.test(debouncedDomain.trim())) {
      onAvailable(null);
      onChecking(false);
      return;
    }

    const checkDomain = async () => {
      onChecking(true);
      try {
        const API_URL = getApiBaseUrl();
        
        const response = await fetch(`${API_URL}/api/agencies/check-domain?domain=${encodeURIComponent(debouncedDomain.trim())}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        onAvailable(result.available === true);
      } catch (error) {
        console.error('Domain check error:', error);
        onAvailable(null); // Set to null on error to show neutral state
      } finally {
        onChecking(false);
      }
    };

    checkDomain();
  }, [debouncedDomain, onAvailable, onChecking]);

  return null;
});

DomainChecker.displayName = 'DomainChecker';

export default function AgencyOnboardingWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Scroll to top on mount and step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentStep]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [domainChecking, setDomainChecking] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentLoadingStep, setCurrentLoadingStep] = useState(0);
  
  const [formData, setFormData] = useState<AgencyFormData>({
    agencyName: '',
    domain: '',
    domainSuffix: '.app',
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

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('agency_onboarding_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed.formData || formData);
        setCurrentStep(parsed.currentStep || 1);
        setCompletedSteps(parsed.completedSteps || []);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  // Save draft to localStorage whenever form data changes
  useEffect(() => {
    const draftData = {
      formData,
      currentStep,
      completedSteps,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('agency_onboarding_draft', JSON.stringify(draftData));
  }, [formData, currentStep, completedSteps]);

  // Animate loading progress
  useEffect(() => {
    if (!isLoading) {
      setLoadingProgress(0);
      setCurrentLoadingStep(0);
      return;
    }

    const loadingSteps = [
      { label: 'Initializing database connection', icon: Database, progress: 10 },
      { label: 'Creating shared functions and extensions', icon: Layers, progress: 20 },
      { label: 'Setting up authentication schema', icon: Shield, progress: 30 },
      { label: 'Creating agency tables', icon: Building2, progress: 40 },
      { label: 'Setting up departments structure', icon: Network, progress: 50 },
      { label: 'Configuring HR modules', icon: Users, progress: 60 },
      { label: 'Creating clients and financial tables', icon: Briefcase, progress: 70 },
      { label: 'Setting up projects and tasks', icon: Target, progress: 80 },
      { label: 'Configuring CRM and GST modules', icon: BarChart3, progress: 90 },
      { label: 'Applying indexes and finalizing', icon: CheckCircle2, progress: 95 },
    ];

    let progressInterval: NodeJS.Timeout;
    let stepInterval: NodeJS.Timeout;

    // Animate progress bar
    const startProgress = 0;
    const endProgress = 95;
    const duration = 15000; // 15 seconds total
    const steps = 100;
    const increment = (endProgress - startProgress) / steps;
    const stepDuration = duration / steps;

    let currentProgress = startProgress;
    progressInterval = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= endProgress) {
        currentProgress = endProgress;
        clearInterval(progressInterval);
      }
      setLoadingProgress(currentProgress);
    }, stepDuration);

    // Cycle through loading steps
    let stepIndex = 0;
    setCurrentLoadingStep(0);
    stepInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % loadingSteps.length;
      setCurrentLoadingStep(stepIndex);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isLoading]);

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
    const suffix = formData.domainSuffix || '.app';
    return `${firstWord}@${cleanDomain}${suffix}`;
  }, [formData.domain, formData.domainSuffix, formData.agencyName]);

  const POPULAR_DIAL_CODES = ['+1', '+44', '+91'];

  const handleAgencyNameChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      agencyName: value,
      domain: generateDomain(value)
    }));
    setDomainAvailable(null);
  }, [generateDomain]);

  const handleDomainAvailable = useCallback((available: boolean | null) => {
    setDomainAvailable(available);
  }, []);

  const handleDomainChecking = useCallback((checking: boolean) => {
    setDomainChecking(checking);
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
        } else if (domainChecking) {
          newErrors.domain = 'Checking domain availability...';
        } else if (domainAvailable === false) {
          newErrors.domain = 'This domain is already taken. Please choose another.';
        } else if (domainAvailable === null && formData.domain.trim().length >= 3) {
          newErrors.domain = 'Please wait while we check domain availability...';
        } else if (domainAvailable === true) {
          // Domain is available - no error
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
      
      // Final check: domain must be available
      if (domainAvailable === false) {
        newErrors.domain = 'Domain is not available. Please choose a different domain.';
      } else if (domainChecking) {
        newErrors.domain = 'Please wait for domain availability check to complete.';
      } else if (domainAvailable === null && formData.domain.trim().length >= 3) {
        newErrors.domain = 'Domain availability check is required.';
      }
    }

    setErrors(newErrors);
    
    // Additional check: prevent submission if domain is not available or still checking
    if (step === 1) {
      if (domainChecking || domainAvailable === false || (domainAvailable === null && formData.domain.trim().length >= 3)) {
        return false;
      }
    }
    
    return Object.keys(newErrors).length === 0;
  }, [formData, domainAvailable, domainChecking]);

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
      const API_URL = getApiBaseUrl();
      
      const response = await fetch(`${API_URL}/api/agencies/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agencyName: formData.agencyName,
          domain: `${formData.domain}${formData.domainSuffix || '.app'}`,
          industry: formData.industry,
          companySize: formData.companySize,
          address: formData.address,
          phone: formData.phone,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          subscriptionPlan: formData.subscriptionPlan,
          // Wire onboarding preferences into backend so AgencySetup can prefill settings
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

      // Clear draft from localStorage on successful submission
      localStorage.removeItem('agency_onboarding_draft');

      // Automatically sign in the new SUPER_ADMIN and redirect to Super Admin Dashboard
      try {
        const { error } = await signIn(formData.adminEmail, formData.adminPassword);

        if (error) {
          throw error;
        }

        toast({
          title: '🎉 Workspace Ready!',
          description: 'Your agency workspace is live. Complete the setup to get started.',
        });

        // Redirect to setup progress page to track and complete agency setup
        navigate('/agency-setup-progress');
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
    <div 
      className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden"
      role="main"
      aria-label="Agency Onboarding Wizard"
    >
      {/* Sophisticated subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle mesh overlay */}
        <div className="absolute inset-0 bg-slate-50/30 dark:bg-slate-950/30" />
        
        {/* Subtle grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        
        {/* Subtle accent - very minimal */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-slate-200/20 dark:bg-slate-800/20 rounded-full" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-200/20 dark:bg-slate-800/20 rounded-full" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Professional Header */}
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  // Scroll to top when clicking header
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1 -ml-1"
                aria-label="BuildFlow Workspace Setup"
              >
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                    BuildFlow
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Workspace Setup</p>
                </div>
              </button>
              <div className="hidden sm:flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {Math.round(progress)}% Complete
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Step {currentStep} of {STEPS.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
          {/* Modern Step Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = step.id === currentStep;
                const isPast = step.id < currentStep;
                const stepNumber = step.id;
                
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          // Allow clicking on past, completed, or current step
                          if (isPast || isCompleted || isCurrent) {
                            setCurrentStep(step.id);
                            // Scroll to top when changing steps
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        disabled={!isPast && !isCompleted && !isCurrent}
                        className={`relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 transition-all duration-200 ${
                          isCompleted
                            ? 'bg-primary border-primary text-white shadow-md hover:bg-primary/90 hover:scale-105'
                            : isCurrent
                            ? 'bg-primary/10 dark:bg-primary/20 border-primary text-primary dark:text-primary-foreground shadow-md ring-2 ring-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30'
                            : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                        } ${(isPast || isCompleted || isCurrent) ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                        aria-label={`Step ${stepNumber}: ${step.title}${isCurrent ? ' (Current)' : isCompleted ? ' (Completed)' : ''}`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" />
                        ) : isCurrent ? (
                          <StepIcon className="h-5 w-5 md:h-6 md:w-6" />
                        ) : (
                          <StepIcon className="h-4 w-4 md:h-5 md:w-5 opacity-60" />
                        )}
                        {isCurrent && (
                          <div className="absolute -inset-1 rounded-lg bg-primary/10 dark:bg-primary/20 animate-pulse" />
                        )}
                      </button>
                      <div className="mt-2 text-center max-w-[80px] sm:max-w-none">
                        <div className={`text-xs font-medium transition-colors ${
                          isCurrent 
                            ? 'text-slate-900 dark:text-white' 
                            : isCompleted 
                            ? 'text-slate-700 dark:text-slate-300' 
                            : 'text-slate-400 dark:text-slate-600'
                        }`}>
                          {step.title}
                        </div>
                      </div>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                        isPast || isCompleted
                          ? 'bg-primary dark:bg-primary'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Subtle progress bar */}
            <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-900 dark:bg-white transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2">
              <Card 
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                role="region"
                aria-labelledby="step-title"
                aria-describedby="step-description"
              >
                <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 py-6">
                  <div className="flex items-start gap-4">
                    <div 
                      className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 flex-shrink-0"
                      aria-hidden="true"
                    >
                      <CurrentStepIcon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle 
                        id="step-title"
                        className="text-xl font-semibold text-slate-900 dark:text-white mb-1.5"
                      >
                        {currentStepData?.title}
                      </CardTitle>
                      <CardDescription 
                        id="step-description"
                        className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
                      >
                        {currentStepData?.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8">
                  {/* Step 1: Agency Essentials */}
                  {currentStep === 1 && (
                    <div className="animate-fade-in h-full flex flex-col space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-5 mb-6">
                        <div className="flex items-start gap-4">
                          <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Agency Essentials</h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
                              {currentStepData?.businessContext}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                              This information establishes your agency's identity in the system. The company name will appear on invoices, reports, and throughout your workspace. The domain identifier creates a unique workspace address that cannot be changed after setup.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-min">
                        <div className="space-y-2 group sm:col-span-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="agencyName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Legal Company Name <span className="text-red-500">*</span>
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                    <HelpCircle className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <p className="text-sm">
                                    Enter your company's legal registered name as it appears on official documents. This name will be used on invoices, contracts, and legal documents generated by the system.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input
                            id="agencyName"
                            placeholder="Enter company name"
                            value={formData.agencyName}
                            onChange={(e) => handleAgencyNameChange(e.target.value)}
                            className={`h-11 text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 ${
                              errors.agencyName 
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                                : 'focus:border-slate-900 dark:focus:border-slate-200 focus:ring-slate-900/10 dark:focus:ring-slate-200/10 hover:border-slate-400 dark:hover:border-slate-600'
                            } ${formData.agencyName && !errors.agencyName ? 'border-green-500/50' : ''}`}
                          />
                          {errors.agencyName && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1.5">
                              <span className="text-red-500">•</span>
                              <span>{errors.agencyName}</span>
                            </p>
                          )}
                          {formData.agencyName && !errors.agencyName && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Valid company name</span>
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 group sm:col-span-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="domain" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Domain Identifier <span className="text-red-500">*</span>
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                    <HelpCircle className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <div className="space-y-2 text-sm">
                                    <p className="font-semibold">What is a domain identifier?</p>
                                    <p>The domain identifier creates a unique workspace address for your agency. You can choose from multiple domain suffixes (.app, .com, .io, etc.). It's used for:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                      <li>System routing and database identification</li>
                                      <li>Secure data isolation between agencies</li>
                                      <li>Workspace access URLs</li>
                                      <li>Email address generation for your team</li>
                                    </ul>
                                    <p className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                      <strong>Important:</strong> This cannot be changed after setup. Choose carefully and ensure it's unique.
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <DomainChecker 
                            domain={formData.domain} 
                            onAvailable={handleDomainAvailable}
                            onChecking={handleDomainChecking}
                          />
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                            <div className="relative flex-1 min-w-0">
                              <Input
                                id="domain"
                                placeholder="company-id"
                                value={formData.domain}
                                onChange={(e) => {
                                  setFormData(prev => ({ ...prev, domain: e.target.value }));
                                  setDomainAvailable(null);
                                  setDomainChecking(false);
                                }}
                                className={`h-11 w-full text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono transition-all duration-200 ${
                                  errors.domain && domainAvailable === false
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 bg-red-50/50 dark:bg-red-950/20' 
                                    : domainAvailable === true && !errors.domain
                                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20 bg-green-50/50 dark:bg-green-950/20'
                                    : domainChecking
                                    ? 'border-blue-500/50 focus:border-blue-500 focus:ring-blue-500/20'
                                    : errors.domain
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                    : 'focus:border-slate-900 dark:focus:border-slate-200 focus:ring-slate-900/10 dark:focus:ring-slate-200/10 hover:border-slate-400 dark:hover:border-slate-600'
                                }`}
                              />
                              {domainChecking && formData.domain && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 animate-spin pointer-events-none" />
                              )}
                              {!domainChecking && formData.domain && domainAvailable === true && !errors.domain && (
                                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600 dark:text-green-400 pointer-events-none" />
                              )}
                              {!domainChecking && formData.domain && domainAvailable === false && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-red-500 font-bold pointer-events-none">✕</span>
                              )}
                            </div>
                            <Select
                              value={formData.domainSuffix}
                              onValueChange={(value) => {
                                setFormData(prev => ({ ...prev, domainSuffix: value }));
                              }}
                            >
                              <SelectTrigger className="h-11 w-full sm:w-auto sm:min-w-[140px] text-sm font-mono bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                <SelectValue placeholder="Select domain" />
                              </SelectTrigger>
                              <SelectContent>
                                {DOMAIN_SUFFIXES.map((suffix) => (
                                  <SelectItem key={suffix.value} value={suffix.value} className="font-mono">
                                    {suffix.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {/* Domain preview */}
                          {formData.domain && (
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                              domainChecking
                                ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
                                : domainAvailable === true
                                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50'
                                : domainAvailable === false
                                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                                : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'
                            }`}>
                              <span className="text-xs text-slate-500 dark:text-slate-400">Preview:</span>
                              <span className="text-sm font-mono text-slate-900 dark:text-white">
                                {formData.domain}{formData.domainSuffix || '.app'}
                              </span>
                              {domainChecking && (
                                <Loader2 className="h-4 w-4 text-blue-500 animate-spin ml-auto" />
                              )}
                              {!domainChecking && domainAvailable === true && (
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 ml-auto" />
                              )}
                              {!domainChecking && domainAvailable === false && (
                                <span className="text-red-500 font-bold ml-auto">✕</span>
                              )}
                            </div>
                          )}
                          {errors.domain && (
                            <p className={`text-sm mt-2 flex items-center gap-1.5 ${
                              domainAvailable === false 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              <span className="text-red-500">•</span>
                              <span>{errors.domain}</span>
                            </p>
                          )}
                          {!errors.domain && suggestedDomain && suggestedDomain !== formData.domain && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, domain: suggestedDomain }));
                                setDomainAvailable(null);
                                setDomainChecking(false);
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline-offset-2 hover:underline transition-colors"
                            >
                              <Sparkles className="h-4 w-4" />
                              <span>
                                Use suggested: <span className="font-mono font-medium">{suggestedDomain}</span>
                              </span>
                            </button>
                          )}
                          {!domainChecking && formData.domain && domainAvailable === true && !errors.domain && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Domain is available and ready to use</span>
                            </p>
                          )}
                          {!domainChecking && formData.domain && domainAvailable === false && !errors.domain && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1.5">
                              <span className="text-red-500 font-bold">✕</span>
                              <span>This domain is already taken. Please choose a different domain identifier.</span>
                            </p>
                          )}
                          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mt-4">
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              <strong className="text-slate-900 dark:text-white">Security & Data Isolation:</strong> Each agency has a completely isolated database. Your data is encrypted and separated from other agencies, ensuring maximum security and compliance with data protection regulations.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Profile & Focus */}
                  {currentStep === 2 && (
                    <div className="animate-fade-in h-full flex flex-col space-y-6">
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-5 mb-2">
                        <div className="flex items-start gap-4">
                          <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Profile & Focus</h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
                              {currentStepData?.businessContext}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                              Your industry selection helps us customize default workflows, reporting templates, and feature recommendations. The positioning statement helps tailor dashboards and insights to your specific business model.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-min">
                        {/* Industry Selection - Clickable Cards */}
                        <div className="space-y-3 group sm:col-span-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Industry <span className="text-red-500">*</span>
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                    <HelpCircle className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <div className="space-y-2 text-xs">
                                    <p className="font-semibold">How industry selection affects your workspace:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                      <li>Pre-configured default workflows and templates</li>
                                      <li>Industry-specific reporting and KPIs</li>
                                      <li>Recommended features and modules</li>
                                      <li>Compliance and regulatory defaults</li>
                                    </ul>
                                    <p className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                      You can customize all settings later, but this gives you a head start with best practices for your industry.
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {INDUSTRIES.map((industry) => {
                              const IndustryIcon = industry.icon;
                              const isSelected = formData.industry === industry.value;
                              return (
                                <button
                                  key={industry.value}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, industry: industry.value }))}
                                  className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2.5 group/btn ${
                                    isSelected
                                      ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <IndustryIcon className={`h-6 w-6 ${
                                    isSelected 
                                      ? 'text-white dark:text-slate-900' 
                                      : 'text-slate-500 dark:text-slate-400 group-hover/btn:text-slate-700 dark:group-hover/btn:text-slate-300'
                                  }`} />
                                  <span className={`text-xs font-medium text-center ${
                                    isSelected 
                                      ? 'text-white dark:text-slate-900' 
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}>
                                    {industry.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          {errors.industry && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{errors.industry}</p>
                          )}
                        </div>

                        {/* Company Size Selection - Clickable Cards */}
                        <div className="space-y-3 group sm:col-span-2">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Organization Size <span className="text-red-500">*</span>
                          </Label>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {COMPANY_SIZES.map((size) => {
                              const SizeIcon = size.icon;
                              const isSelected = formData.companySize === size.value;
                              return (
                                <button
                                  key={size.value}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, companySize: size.value }))}
                                  className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2.5 group/btn ${
                                    isSelected
                                      ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <SizeIcon className={`h-6 w-6 ${
                                    isSelected 
                                      ? 'text-white dark:text-slate-900' 
                                      : 'text-slate-500 dark:text-slate-400 group-hover/btn:text-slate-700 dark:group-hover/btn:text-slate-300'
                                  }`} />
                                  <span className={`text-xs font-medium text-center ${
                                    isSelected 
                                      ? 'text-white dark:text-slate-900' 
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}>
                                    {size.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          {errors.companySize && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{errors.companySize}</p>
                          )}
                        </div>

                        {/* Positioning */}
                        <div className="space-y-2 group sm:col-span-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="positioning" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              How would you describe your agency? <span className="text-slate-500 dark:text-slate-400 font-normal">(optional)</span>
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                    <HelpCircle className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <div className="space-y-2 text-xs">
                                    <p className="font-semibold">Positioning Statement Examples:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                      <li>"Design-first construction consultancy focused on residential projects"</li>
                                      <li>"Full-service engineering firm specializing in sustainable infrastructure"</li>
                                      <li>"Boutique architecture studio with expertise in commercial spaces"</li>
                                    </ul>
                                    <p className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                      This helps us customize dashboards, recommendations, and feature highlights to match your business focus.
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="relative">
                            <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                            <Input
                              id="positioning"
                              placeholder="e.g. Design-first construction consultancy focused on residential projects"
                              value={formData.positioning}
                              onChange={(e) => setFormData(prev => ({ ...prev, positioning: e.target.value }))}
                              className="pl-10 h-11 text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-900 dark:focus:border-slate-200 focus:ring-slate-900/10 dark:focus:ring-slate-200/10 transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-600"
                            />
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            This helps us tailor dashboards and recommendations. You can refine it later.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Contact & Location */}
                  {currentStep === 3 && (
                    <div className="animate-fade-in h-full flex flex-col space-y-6">
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-5 mb-2">
                        <div className="flex items-start gap-4">
                          <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Contact Details</h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
                              {currentStepData?.businessContext}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                              This information appears on invoices, quotes, and official documents. You can update these details at any time from your workspace settings. All information is encrypted and stored securely in compliance with data protection regulations.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-min">
                        <div className="space-y-2 group sm:col-span-2">
                          <Label htmlFor="address" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Business Address <span className="text-slate-500 dark:text-slate-400 font-normal">(optional)</span>
                          </Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                            <Input
                              id="address"
                              placeholder="Street, city, country"
                              value={formData.address}
                              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                              className="pl-10 h-11 text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-900 dark:focus:border-slate-200 focus:ring-slate-900/10 dark:focus:ring-slate-200/10 transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-600"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 group sm:col-span-2">
                          <Label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Contact Number <span className="text-slate-500 dark:text-slate-400 font-normal">(optional)</span>
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
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
                              className={`pl-10 h-11 text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-900 dark:focus:border-slate-200 focus:ring-slate-900/10 dark:focus:ring-slate-200/10 transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-600 ${
                                errors.phone 
                                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
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
                                className={`px-3 py-1 rounded-lg text-xs border transition-colors ${
                                  (formData.phone || '').startsWith(code)
                                    ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                              >
                                {code}
                              </button>
                            ))}
                          </div>
                          {errors.phone && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1.5">
                              <span>•</span>
                              <span>{errors.phone}</span>
                            </p>
                          )}
                          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mt-4">
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              <strong className="text-slate-900 dark:text-white">Privacy & Data Usage:</strong> Your contact information is used solely for business communications and document generation. We never share your data with third parties. You can update or remove this information at any time from your workspace settings.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Administrative Access */}
                  {currentStep === 4 && (
                    <div className="animate-fade-in h-full flex flex-col space-y-6">
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-5 mb-2">
                        <div className="flex items-start gap-4">
                          <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Administrative Access</h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
                              {currentStepData?.businessContext}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                              This account will have full system access to manage users, permissions, billing, and all workspace settings. Choose a strong password and keep your credentials secure. You can enable multi-factor authentication after setup.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-min">
                        <div className="space-y-2 group sm:col-span-2">
                          <Label htmlFor="adminName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Administrator Name <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                            <Input
                              id="adminName"
                              placeholder="Full legal name"
                              value={formData.adminName}
                              onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
                              className={`pl-10 h-11 text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-900 dark:focus:border-slate-200 focus:ring-slate-900/10 dark:focus:ring-slate-200/10 transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-600 ${
                                errors.adminName 
                                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                                  : ''
                              }`}
                            />
                          </div>
                          {errors.adminName && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{errors.adminName}</p>
                          )}
                        </div>

                        <div className="space-y-2 group sm:col-span-2">
                          <Label htmlFor="adminEmail" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Email Address <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                            <Input
                              id="adminEmail"
                              type="email"
                              placeholder="admin@company.com"
                              value={formData.adminEmail}
                              onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                              className={`pl-10 h-11 text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-900 dark:focus:border-slate-200 focus:ring-slate-900/10 dark:focus:ring-slate-200/10 transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-600 ${
                                errors.adminEmail 
                                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                                  : ''
                              }`}
                            />
                          </div>
                          {errors.adminEmail && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{errors.adminEmail}</p>
                          )}
                          {!errors.adminEmail && suggestedAdminEmail && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                              <span className="text-slate-600 dark:text-slate-400">Suggested:</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    adminEmail: suggestedAdminEmail,
                                  }))
                                }
                                className="px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors font-mono text-xs"
                              >
                                {suggestedAdminEmail}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                          <div className="space-y-2 group">
                            <Label htmlFor="adminPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Password <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                              <Input
                                id="adminPassword"
                                type="password"
                                placeholder="Min 8 characters"
                                value={formData.adminPassword}
                                onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                                className={`pl-10 h-11 text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-900 dark:focus:border-slate-200 focus:ring-slate-900/10 dark:focus:ring-slate-200/10 transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-600 ${
                                  errors.adminPassword 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                                    : ''
                                } ${formData.adminPassword && formData.adminPassword.length >= 8 && !errors.adminPassword ? 'border-green-500/50' : ''}`}
                              />
                              {formData.adminPassword && formData.adminPassword.length >= 8 && !errors.adminPassword && (
                                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600 dark:text-green-400" />
                              )}
                            </div>
                            {errors.adminPassword && (
                              <p className="text-sm text-red-600 dark:text-red-400 mt-2">{errors.adminPassword}</p>
                            )}
                            {formData.adminPassword && (
                              <div className="flex gap-1.5 mt-3">
                                {[1, 2, 3, 4].map((level) => (
                                  <div
                                    key={level}
                                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                      formData.adminPassword.length >= level * 2
                                        ? formData.adminPassword.length >= 8
                                          ? 'bg-green-600 dark:bg-green-500'
                                          : 'bg-amber-500'
                                        : 'bg-slate-200 dark:bg-slate-700'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 group">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Confirm Password <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
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
                                className={`pl-10 h-11 text-sm bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-900 dark:focus:border-slate-200 focus:ring-slate-900/10 dark:focus:ring-slate-200/10 transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-600 ${
                                  errors.confirmPassword 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                                    : ''
                                } ${formData.confirmPassword && formData.adminPassword === formData.confirmPassword && !errors.confirmPassword ? 'border-green-500/50' : ''}`}
                              />
                              {formData.confirmPassword && formData.adminPassword === formData.confirmPassword && !errors.confirmPassword && (
                                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600 dark:text-green-400" />
                              )}
                            </div>
                            {errors.confirmPassword && (
                              <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1.5">
                                <span>•</span>
                                <span>{errors.confirmPassword}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mt-4">
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            <strong className="text-slate-900 dark:text-white">Security Best Practices:</strong>
                          </p>
                          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside ml-1">
                            <li>Use a unique password not used elsewhere</li>
                            <li>Include uppercase, lowercase, numbers, and special characters</li>
                            <li>Minimum 8 characters (12+ recommended for better security)</li>
                            <li>Consider using a password manager</li>
                          </ul>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            Your password is encrypted using industry-standard hashing. You can change it anytime from account settings, and we recommend enabling multi-factor authentication for additional security.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Workflows & Modules */}
                  {currentStep === 5 && (
                    <div className="animate-fade-in h-full flex flex-col space-y-6">
                      <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-xl p-4 md:p-5 mb-4">
                        <div className="flex items-start gap-3 md:gap-4">
                          <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Info className="h-4 w-4 md:h-5 md:w-5 text-primary dark:text-primary-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white mb-2">Workflows & Modules</h4>
                            <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
                              {currentStepData?.businessContext}
                            </p>
                            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                              Select which modules you want to start with. All modules can be enabled or disabled at any time from your workspace settings. Your primary focus selection helps us prioritize features and shortcuts in your dashboard.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        {/* Primary focus */}
                        <div className="space-y-3">
                          <Label className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
                            What do you want to get under control first?
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
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
                                  className={`relative p-4 md:p-5 rounded-xl border-2 text-left transition-all duration-200 flex flex-col gap-3 group/btn ${
                                    isSelected
                                      ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-lg ring-2 ring-primary/20'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md'
                                  } focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900`}
                                >
                                  {isSelected && (
                                    <div className="absolute top-2 right-2 z-10">
                                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-md">
                                        <Check className="h-3 w-3 text-white" />
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex items-start gap-3">
                                    <div className={`h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                                      isSelected
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 group-hover/btn:bg-slate-200 dark:group-hover/btn:bg-slate-600'
                                    }`}>
                                      <ItemIcon className={`h-5 w-5 md:h-6 md:w-6`} />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                      <span className={`block text-sm md:text-base font-semibold mb-1 ${
                                        isSelected
                                          ? 'text-primary dark:text-primary-foreground'
                                          : 'text-slate-900 dark:text-slate-100'
                                      }`}>
                                        {item.label}
                                      </span>
                                      <span className={`block text-xs md:text-sm leading-relaxed ${
                                        isSelected
                                          ? 'text-slate-700 dark:text-slate-300'
                                          : 'text-slate-600 dark:text-slate-400'
                                      }`}>
                                        {item.description}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            We’ll highlight features and shortcuts that match where you want the quickest wins.
                          </p>
                        </div>

                        {/* GST preference */}
                        <div className="space-y-4">
                          <Label className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Do you need GST compliance in this workspace?
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
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
                                  className={`relative p-4 md:p-5 rounded-xl border-2 transition-all duration-200 flex items-start gap-3 text-left group/btn ${
                                    isSelected
                                      ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-lg ring-2 ring-primary/20'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md'
                                  } focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900`}
                                >
                                  {isSelected && (
                                    <div className="absolute top-2 right-2">
                                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="h-3 w-3 text-white" />
                                      </div>
                                    </div>
                                  )}
                                  <div className={`h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                                    isSelected
                                      ? 'bg-primary text-white shadow-md'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 group-hover/btn:bg-slate-200 dark:group-hover/btn:bg-slate-600'
                                  }`}>
                                    <Icon className={`h-5 w-5 md:h-6 md:w-6`} />
                                  </div>
                                  <div className="flex-1 min-w-0 pt-0.5">
                                    <div className={`text-sm md:text-base font-semibold mb-1 ${
                                      isSelected 
                                        ? 'text-primary dark:text-primary-foreground' 
                                        : 'text-slate-900 dark:text-slate-100'
                                    }`}>
                                      {option.label}
                                    </div>
                                    <div className={`text-xs md:text-sm leading-relaxed ${
                                      isSelected 
                                        ? 'text-slate-700 dark:text-slate-300' 
                                        : 'text-slate-600 dark:text-slate-400'
                                    }`}>
                                      {option.description}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Modules toggles */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Label className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
                              Modules to start with
                            </Label>
                            <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-normal">(you can change this any time)</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors ml-auto">
                                    <HelpCircle className="h-4 w-4 md:h-5 md:w-5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <div className="space-y-2 text-xs">
                                    <p className="font-semibold">Module Capabilities:</p>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                      <li><strong>Projects:</strong> Job tracking, task management, timelines, deliverables</li>
                                      <li><strong>Finance:</strong> Invoicing, payments, cash flow, financial reporting</li>
                                      <li><strong>People:</strong> Team management, roles, responsibilities, HR functions</li>
                                      <li><strong>Reports:</strong> KPIs, dashboards, analytics, executive insights</li>
                                    </ul>
                                    <p className="pt-1 border-t border-slate-700/50">
                                      Enable modules based on your immediate needs. You can activate additional modules later without any data loss.
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
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
                                  className={`relative p-4 md:p-5 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 group/btn ${
                                    enabled
                                      ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-lg ring-2 ring-primary/20'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md'
                                  } focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900`}
                                >
                                  {enabled && (
                                    <div className="absolute top-2 right-2 z-10">
                                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-md">
                                        <Check className="h-3 w-3 text-white" />
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`h-10 w-10 md:h-12 md:w-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                                      enabled
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 group-hover/btn:bg-slate-200 dark:group-hover/btn:bg-slate-600'
                                    }`}>
                                      <Icon className={`h-5 w-5 md:h-6 md:w-6`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className={`text-sm md:text-base font-semibold mb-1 ${
                                        enabled 
                                          ? 'text-primary dark:text-primary-foreground' 
                                          : 'text-slate-900 dark:text-slate-100'
                                      }`}>
                                        {mod.label}
                                      </div>
                                      <div className={`text-xs md:text-sm ${
                                        enabled 
                                          ? 'text-slate-700 dark:text-slate-300' 
                                          : 'text-slate-600 dark:text-slate-400'
                                      }`}>
                                        {mod.description}
                                      </div>
                                    </div>
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
                    <div className="animate-fade-in h-full flex flex-col space-y-6">
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-5 mb-2">
                        <div className="flex items-start gap-4">
                          <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Choose Your Service Tier</h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
                              {currentStepData?.businessContext}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                              Select the tier that best matches your organization's scale and needs. You can upgrade or downgrade at any time from your workspace settings. All tiers include secure data storage, regular backups, and access to our support team.
                            </p>
                          </div>
                        </div>
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
                              <Card className={`h-full transition-all duration-200 border-2 flex flex-col relative overflow-hidden ${
                                isSelected 
                                  ? `border-slate-900 dark:border-white bg-slate-900 dark:bg-white shadow-lg` 
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md'
                              } ${plan.popular ? 'ring-2 ring-blue-500/20 dark:ring-blue-400/20' : ''}`}>
                                {plan.popular && (
                                  <div className="absolute top-0 right-0 bg-blue-600 dark:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-bl-xl">
                                    Most Popular
                                  </div>
                                )}
                                {plan.savings && !plan.popular && (
                                  <div className="absolute top-0 right-0 bg-amber-600 dark:bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-bl-xl">
                                    {plan.savings}
                                  </div>
                                )}
                                <CardContent className="p-6 flex flex-col flex-1">
                                  <div className="mb-5">
                                    <div className={`h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700 transition-all duration-200 ${
                                      isSelected ? 'scale-105' : 'group-hover:scale-105'
                                    }`}>
                                      <PlanIcon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                                    </div>
                                    <h4 className={`font-semibold text-lg mb-1.5 ${
                                      isSelected 
                                        ? 'text-slate-900 dark:text-white' 
                                        : 'text-slate-900 dark:text-white'
                                    }`}>{plan.name}</h4>
                                    <p className={`text-sm ${
                                      isSelected 
                                        ? 'text-slate-600 dark:text-slate-400' 
                                        : 'text-slate-600 dark:text-slate-400'
                                    } leading-relaxed`}>{plan.description}</p>
                                  </div>
                                  <div className="mb-5 pb-5 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex items-baseline gap-1">
                                      <span className={`text-3xl font-bold ${
                                        isSelected 
                                          ? 'text-slate-900 dark:text-white' 
                                          : 'text-slate-900 dark:text-white'
                                      }`}>${plan.price}</span>
                                      <span className={`text-sm ${
                                        isSelected 
                                          ? 'text-slate-600 dark:text-slate-400' 
                                          : 'text-slate-500 dark:text-slate-500'
                                      }`}>/{plan.period}</span>
                                    </div>
                                  </div>
                                  <ul className="space-y-2.5 mb-5 flex-1">
                                    {plan.features.map((feature, idx) => (
                                      <li key={idx} className={`flex items-start gap-2.5 text-sm leading-relaxed ${
                                        isSelected 
                                          ? 'text-slate-700 dark:text-slate-300' 
                                          : 'text-slate-600 dark:text-slate-400'
                                      }`}>
                                        <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                                          isSelected 
                                            ? 'text-slate-900 dark:text-white' 
                                            : 'text-slate-500 dark:text-slate-500'
                                        }`} />
                                        <span>{feature}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  {isSelected && (
                                    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium text-sm">
                                        <CheckCircle2 className="h-4 w-4" />
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
                        <p className="text-sm text-red-600 dark:text-red-400 text-center mt-2">{errors.subscriptionPlan}</p>
                      )}
                    </div>
                  )}

                  {/* Step 7: Final Review & Activation */}
                  {currentStep === 7 && (
                    <div className="animate-fade-in h-full flex flex-col space-y-6">
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-5 mb-2">
                        <div className="flex items-start gap-4">
                          <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Final Review & Activation</h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                              {currentStepData?.businessContext}
                            </p>
                            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                              <p><strong className="text-slate-900 dark:text-white">What happens during activation:</strong></p>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Creation of a secure, isolated database for your agency</li>
                                <li>Seeding of core tables for users, roles, and settings</li>
                                <li>Application of audit and compliance defaults</li>
                                <li>Setup of your administrative account</li>
                              </ul>
                              <p className="pt-2 border-t border-blue-200 dark:border-blue-800">
                                <strong className="text-slate-900 dark:text-white">Expected setup time:</strong> Usually less than 10 seconds. You'll be redirected automatically when everything is ready.
                              </p>
                              <p>
                                <strong className="text-slate-900 dark:text-white">Next steps:</strong> After activation, you'll be taken to your workspace setup page where you can complete additional configuration, add team members, and customize your workspace.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Review Summary */}
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl p-5 mb-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0 border border-green-200 dark:border-green-800">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Ready for Activation</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Review your information below</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 flex-1 overflow-y-auto">
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                          <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 py-4 px-6">
                            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                              <Building2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                              Company Foundation
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Company Name</div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{formData.agencyName}</p>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Domain</div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white font-mono break-all">
                                  {formData.domain}{formData.domainSuffix || '.app'}
                                </p>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Industry</div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{formData.industry}</p>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Organization Size</div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{formData.companySize}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                          <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 py-4 px-6">
                            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                              <Shield className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                              Administrative Access
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Administrator Name</div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{formData.adminName}</p>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email Address</div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{formData.adminEmail}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Workflows & Modules Summary */}
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                          <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 py-4 px-6">
                            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                              <SlidersHorizontal className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                              Workflows & Modules
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4">
                            <div>
                              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Primary Focus</div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
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
                              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">GST</div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {formData.enableGST ? 'Enabled for this workspace' : 'Not enabled (can be turned on later)'}
                              </p>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Modules on Day 1</div>
                              <div className="flex flex-wrap gap-2">
                                {(['projects', 'finance', 'people', 'reports'] as const)
                                  .filter((key) => formData.modules[key])
                                  .map((key) => (
                                    <span
                                      key={key}
                                      className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
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
                                  <span className="text-sm text-slate-500 dark:text-slate-400">
                                    No modules selected yet (defaults will be applied).
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                          <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 py-4 px-6">
                            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                              <Layers className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                              Service Tier
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            {(() => {
                              const plan = PLANS.find(p => p.id === formData.subscriptionPlan);
                              if (!plan) return null;
                              const PlanIcon = plan.icon;
                              return (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                      <PlanIcon className="h-7 w-7 text-slate-700 dark:text-slate-300" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-900 dark:text-white">{plan.name}</p>
                                      <p className="text-sm text-slate-600 dark:text-slate-400">{plan.description}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">${plan.price}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">/{plan.period}</p>
                                  </div>
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>

                        <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mt-4">
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            <strong className="text-slate-900 dark:text-white">Support Resources:</strong> After activation, you'll have access to our support team, documentation, and onboarding guides. You can update most of these details later from your workspace settings. Activating now creates your secure agency database and admin account.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Professional Navigation Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 1 || isLoading}
                      className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-200 w-full sm:w-auto h-11 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Go back to step ${currentStep - 1}`}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                      Previous
                    </Button>

                    <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <span>Step {currentStep} of {STEPS.length}</span>
                    </div>

                    {currentStep < STEPS.length ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={isLoading}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-medium shadow-sm transition-all duration-200 min-w-[140px] w-full sm:w-auto h-11 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Continue to step ${currentStep + 1}`}
                      >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-medium shadow-sm transition-all duration-200 min-w-[160px] w-full sm:w-auto h-11 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Activate agency and create workspace"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            <span>Activating...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                            <span>Activate Agency</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Professional Right Sidebar */}
            <div className="lg:col-span-1 flex flex-col">
              <div className="sticky top-24 space-y-4 flex flex-col">
                {/* Company Preview Card */}
                {currentStep <= 3 && (formData.agencyName || formData.industry || formData.companySize) && (
                  <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex-shrink-0">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 py-3 px-4">
                      <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <Building2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {formData.agencyName && (
                        <div>
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Company Name</div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{formData.agencyName}</div>
                        </div>
                      )}
                      {formData.industry && (
                        <div>
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Industry</div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white capitalize">{formData.industry}</div>
                        </div>
                      )}
                      {formData.companySize && (
                        <div>
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Organization Size</div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{formData.companySize} employees</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Step Benefits */}
                {COMPANY_BENEFITS[`step${currentStep}` as keyof typeof COMPANY_BENEFITS] && (
                  <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex-1 flex flex-col min-h-0">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 py-3 px-4 flex-shrink-0">
                      <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">
                        What You'll Get
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 overflow-hidden">
                      <ul className="space-y-3">
                        {COMPANY_BENEFITS[`step${currentStep}` as keyof typeof COMPANY_BENEFITS]?.map((benefit, idx) => {
                          const BenefitIcon = benefit.icon;
                          return (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700 mt-0.5">
                                <BenefitIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                              </div>
                              <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{benefit.text}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* System Information */}
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex-shrink-0">
                  <CardContent className="p-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Progress</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-slate-900 dark:bg-white transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs leading-relaxed">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-500 dark:text-slate-400">
                            Step {currentStep} of {STEPS.length}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">
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
                        </p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 sm:mx-6 md:mx-8 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 mb-6">
              <div className="relative">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center shadow-lg">
                  <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 text-white animate-spin" />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
                  Creating your agency workspace
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  Setting up your dedicated database with 53+ tables and all necessary modules
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Progress
                </span>
                <span className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {Math.round(loadingProgress)}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-600 dark:via-indigo-600 dark:to-purple-600 transition-all duration-500 ease-out shadow-lg relative"
                  style={{ width: `${loadingProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Current Step Display */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/50 dark:to-slate-700/50 border border-blue-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                {(() => {
                  const loadingSteps = [
                    { label: 'Initializing database connection', icon: Database },
                    { label: 'Creating shared functions and extensions', icon: Layers },
                    { label: 'Setting up authentication schema', icon: Shield },
                    { label: 'Creating agency tables', icon: Building2 },
                    { label: 'Setting up departments structure', icon: Network },
                    { label: 'Configuring HR modules', icon: Users },
                    { label: 'Creating clients and financial tables', icon: Briefcase },
                    { label: 'Setting up projects and tasks', icon: Target },
                    { label: 'Configuring CRM and GST modules', icon: BarChart3 },
                    { label: 'Applying indexes and finalizing', icon: CheckCircle2 },
                  ];
                  const step = loadingSteps[currentLoadingStep];
                  const Icon = step?.icon || Database;
                  return (
                    <>
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border border-blue-200 dark:border-slate-700 shadow-sm">
                        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-white">
                          {step?.label || 'Processing...'}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                          Step {currentLoadingStep + 1} of {loadingSteps.length}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Status List */}
            <div className="space-y-2.5 mb-6">
              <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span>Creating secure, isolated database schema</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span>Seeding 53+ core tables (users, roles, settings, HR, finance, CRM)</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Loader2 className="h-3 w-3 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
                <span>Applying indexes, triggers, and audit compliance</span>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  This process typically takes 10-15 seconds. Your workspace will be ready shortly, and you'll be redirected automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
