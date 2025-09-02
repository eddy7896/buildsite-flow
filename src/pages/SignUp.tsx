import { useState, useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  Building, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  Zap,
  Building2,
  Crown,
  Users,
  Globe,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SignUp = () => {
  const { user, loading } = useAuth();
  const { currency, formatPrice, changeCurrency, availableCurrencies } = useCurrency();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // Form states
  const [accountData, setAccountData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    agencyName: '',
    agencyDomain: '',
    fullName: '',
    phone: '',
    countryCode: '+1 US'
  });
  
  const [selectedTld, setSelectedTld] = useState('.com');
  const [customTld, setCustomTld] = useState('');
  const [isCustomTld, setIsCustomTld] = useState(false);
  
  const [selectedPlan, setSelectedPlan] = useState('');

  // Common TLD options
  const commonTlds = [
    '.com', '.org', '.net', '.io', '.co', '.app', '.dev', '.tech', '.agency', '.business'
  ];

  const plans = [
    {
      id: 'starter',
      name: "Starter",
      price: 29,
      period: "month",
      description: "Perfect for small agencies getting started",
      icon: Zap,
      popular: false,
      teamSize: "Up to 5 team members",
      projects: "10 active projects",
      features: [
        "Basic project management",
        "Email support",
        "5GB storage",
        "Mobile app access"
      ]
    },
    {
      id: 'professional',
      name: "Professional",
      price: 79,
      period: "month", 
      description: "Ideal for growing agencies with advanced needs",
      icon: Building2,
      popular: true,
      teamSize: "Up to 25 team members",
      projects: "Unlimited projects",
      features: [
        "Advanced project management",
        "Priority support",
        "100GB storage",
        "API access",
        "Client portal"
      ]
    },
    {
      id: 'enterprise',
      name: "Enterprise",
      price: 199,
      period: "month",
      description: "For large agencies requiring maximum control",
      icon: Crown,
      popular: false,
      teamSize: "Unlimited team members", 
      projects: "Unlimited projects",
      features: [
        "Enterprise features",
        "24/7 dedicated support",
        "Unlimited storage",
        "White-label solution",
        "SSO integration"
      ]
    }
  ];

  // Pre-select plan from URL parameter
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam) {
      const planId = plans.find(p => 
        p.name.toLowerCase() === planParam.toLowerCase() ||
        p.id === planParam.toLowerCase()
      )?.id;
      
      if (planId) {
        setSelectedPlan(planId);
        // If user came from pricing with a plan, show plan selection step
        if (currentStep === 1 && accountData.agencyName && accountData.email) {
          // If they have some account data already, go to plan step
          setCurrentStep(2);
        }
      } else {
        // Invalid plan parameter, show a warning
        toast({
          title: "Invalid plan selection",
          description: "The plan you selected is not available. Please choose from our available plans.",
          variant: "destructive",
        });
      }
    }
  }, [searchParams, accountData.agencyName, accountData.email, currentStep, toast]);

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

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return 'Very Weak';
      case 2: return 'Weak';
      case 3: return 'Fair';
      case 4: return 'Good';
      case 5: return 'Strong';
      default: return '';
    }
  };

  const getPasswordStrengthColor = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-blue-500';
      case 5: return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const generateDomainFromAgencyName = (agencyName: string) => {
    return agencyName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const validateDomain = (domain: string) => {
    // Basic domain validation
    const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    return domainRegex.test(domain) && domain.length >= 3 && domain.length <= 63;
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!accountData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!accountData.agencyName.trim()) {
      newErrors.agencyName = 'Agency name is required';
    }

    if (!accountData.agencyDomain.trim()) {
      newErrors.agencyDomain = 'Agency domain is required';
    } else if (!validateDomain(accountData.agencyDomain)) {
      newErrors.agencyDomain = 'Domain must be 3-63 characters, contain only letters, numbers, and hyphens, and not start/end with hyphens';
    }
    
    if (!accountData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!accountData.password) {
      newErrors.password = 'Password is required';
    } else if (accountData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (passwordStrength < 3) {
      newErrors.password = 'Password is too weak. Include uppercase, lowercase, numbers, and symbols.';
    }
    
    if (!accountData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (accountData.password !== accountData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePlanSelection = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSignUp = async () => {
    if (!selectedPlan) {
      toast({
        title: "Please select a plan",
        description: "You need to choose a plan to continue with registration.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the register-agency edge function with proper headers
      const { data, error } = await supabase.functions.invoke('register-agency', {
        body: {
          // Agency details
          agencyName: accountData.agencyName,
          domain: accountData.agencyDomain,
          
          // Admin user details
          email: accountData.email,
          password: accountData.password,
          fullName: accountData.fullName,
          phone: accountData.phone,
          
          // Plan selection
          selectedPlan,
          planDetails: plans.find(p => p.id === selectedPlan)
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Agency registered successfully!",
        description: "Please check your email to verify your account before signing in.",
      });

      // Redirect to success page with agency info
      const successUrl = `/signup-success?agencyName=${encodeURIComponent(accountData.agencyName)}&agencyDomain=${encodeURIComponent(accountData.agencyDomain)}&email=${encodeURIComponent(accountData.email)}&plan=${encodeURIComponent(selectedPlan)}`;
      window.location.href = successUrl;
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || 'Please try again or contact support.',
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const selectedPlanDetails = plans.find(p => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Building className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">BuildFlow</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    {currency.code}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {Object.entries(availableCurrencies).map(([countryCode, currencyInfo]) => (
                    <DropdownMenuItem 
                      key={countryCode}
                      onClick={() => changeCurrency(countryCode)}
                      className="cursor-pointer"
                    >
                      {currencyInfo.symbol} {currencyInfo.code} - {currencyInfo.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link to="/auth">
                <Button variant="ghost">Already have an account?</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <span className="ml-2 hidden sm:inline">Agency Setup</span>
            </div>
            <div className={`w-12 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <span className="ml-2 hidden sm:inline">Choose Plan</span>
            </div>
          </div>
        </div>

        {/* Step 1: Agency Account Setup */}
        {currentStep === 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Create Your Agency Account</CardTitle>
              <CardDescription>
                Set up your agency with a custom domain and admin account
              </CardDescription>
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This creates an admin account with full system access. Employee accounts can be created later from the dashboard.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAccountSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={accountData.fullName}
                    onChange={(e) => {
                      setAccountData(prev => ({ ...prev, fullName: e.target.value }));
                      if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                    }}
                    className={errors.fullName ? 'border-destructive' : ''}
                    required
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.fullName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agencyName">Agency Name</Label>
                  <Input
                    id="agencyName"
                    type="text"
                    placeholder="ABC Construction"
                    value={accountData.agencyName}
                    onChange={(e) => {
                      const newAgencyName = e.target.value;
                      setAccountData(prev => ({ 
                        ...prev, 
                        agencyName: newAgencyName,
                        // Auto-generate domain if it's empty or matches the previous auto-generated one
                        agencyDomain: !prev.agencyDomain || prev.agencyDomain === generateDomainFromAgencyName(prev.agencyName) 
                          ? generateDomainFromAgencyName(newAgencyName)
                          : prev.agencyDomain
                      }));
                      if (errors.agencyName) setErrors(prev => ({ ...prev, agencyName: '' }));
                      if (errors.agencyDomain) setErrors(prev => ({ ...prev, agencyDomain: '' }));
                    }}
                    className={errors.agencyName ? 'border-destructive' : ''}
                    required
                  />
                  {errors.agencyName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.agencyName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agencyDomain">Agency Domain</Label>
                <div className="flex items-center gap-0">
                  <Input
                    id="agencyDomain"
                    type="text"
                    placeholder="abc-construction"
                    value={accountData.agencyDomain}
                    onChange={(e) => {
                      const domain = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setAccountData(prev => ({ ...prev, agencyDomain: domain }));
                      if (errors.agencyDomain) setErrors(prev => ({ ...prev, agencyDomain: '' }));
                    }}
                    className={`rounded-r-none border-r-0 ${errors.agencyDomain ? 'border-destructive' : ''}`}
                    required
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="rounded-l-none px-3 bg-muted hover:bg-muted/80"
                      >
                        {isCustomTld ? customTld : selectedTld}
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      {commonTlds.map((tld) => (
                        <DropdownMenuItem
                          key={tld}
                          onClick={() => {
                            setSelectedTld(tld);
                            setIsCustomTld(false);
                            setCustomTld('');
                          }}
                        >
                          {tld}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem
                        onClick={() => {
                          setIsCustomTld(true);
                          setCustomTld('.custom');
                        }}
                      >
                        + Custom TLD
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {isCustomTld && (
                  <div className="space-y-2">
                    <Label htmlFor="customTld" className="text-sm">Custom TLD</Label>
                    <Input
                      id="customTld"
                      type="text"
                      placeholder=".agency"
                      value={customTld}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (!value.startsWith('.')) {
                          value = '.' + value;
                        }
                        value = value.toLowerCase().replace(/[^a-z0-9.-]/g, '');
                        setCustomTld(value);
                      }}
                      className="max-w-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your custom top-level domain (e.g., .agency, .construction)
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Your agency domain: <strong>{accountData.agencyDomain || 'your-domain'}{isCustomTld ? customTld : selectedTld}</strong>
                </p>
                {errors.agencyDomain && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.agencyDomain}
                  </p>
                )}
              </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Business Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@abcconstruction.com"
                    value={accountData.email}
                    onChange={(e) => {
                      setAccountData(prev => ({ ...prev, email: e.target.value }));
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    className={errors.email ? 'border-destructive' : ''}
                    required
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-[120px] justify-between">
                          {accountData.countryCode || '+1 US'}
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[200px]">
                        <DropdownMenuItem onClick={() => setAccountData(prev => ({ ...prev, countryCode: '+1 US' }))}>
                          🇺🇸 +1 United States
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAccountData(prev => ({ ...prev, countryCode: '+91 IN' }))}>
                          🇮🇳 +91 India
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAccountData(prev => ({ ...prev, countryCode: '+44 UK' }))}>
                          🇬🇧 +44 United Kingdom
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAccountData(prev => ({ ...prev, countryCode: '+61 AU' }))}>
                          🇦🇺 +61 Australia
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAccountData(prev => ({ ...prev, countryCode: '+49 DE' }))}>
                          🇩🇪 +49 Germany
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAccountData(prev => ({ ...prev, countryCode: '+33 FR' }))}>
                          🇫🇷 +33 France
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAccountData(prev => ({ ...prev, countryCode: '+81 JP' }))}>
                          🇯🇵 +81 Japan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="555 123-4567"
                      value={accountData.phone}
                      onChange={(e) => setAccountData(prev => ({ ...prev, phone: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={accountData.password}
                        onChange={(e) => {
                          setAccountData(prev => ({ ...prev, password: e.target.value }));
                          setPasswordStrength(calculatePasswordStrength(e.target.value));
                          if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                        }}
                        className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {/* Password Strength Indicator */}
                    {accountData.password && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Password Strength:</span>
                          <span className={`font-medium ${passwordStrength >= 4 ? 'text-green-600' : passwordStrength >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {getPasswordStrengthText(passwordStrength)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {errors.password && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.password}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={accountData.confirmPassword}
                        onChange={(e) => {
                          setAccountData(prev => ({ ...prev, confirmPassword: e.target.value }));
                          if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }}
                        className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Continue to Plan Selection
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/auth" className="text-primary hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Plan Selection */}
        {currentStep === 2 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
              <p className="text-muted-foreground mb-4">
                Select the perfect plan for {accountData.agencyName}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary">
                  14-day free trial • No credit card required
                </Badge>
                {selectedPlan && (
                  <Badge variant="default">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Plan Selected
                  </Badge>
                )}
                {searchParams.get('plan') && (
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                    Recommended from pricing
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {plans.map((plan) => {
                const isPreSelected = searchParams.get('plan')?.toLowerCase() === plan.name.toLowerCase();
                const isSelected = selectedPlan === plan.id;
                
                return (
                <Card 
                  key={plan.id} 
                  className={`relative cursor-pointer transition-all hover:shadow-lg ${
                    isSelected ? 'border-primary shadow-lg scale-105' : 'border-border'
                  } ${plan.popular || isPreSelected ? 'border-primary' : ''} ${
                    isPreSelected ? 'ring-2 ring-primary ring-opacity-20' : ''
                  }`}
                  onClick={() => handlePlanSelection(plan.id)}
                >
                  {(plan.popular || isPreSelected) && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className={`${isPreSelected ? 'bg-blue-500 text-white' : 'bg-primary text-primary-foreground'}`}>
                        {isPreSelected ? 'Recommended' : 'Most Popular'}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="mb-4">
                      <plan.icon className="h-12 w-12 text-primary mx-auto" />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-primary" />
                        <span>{plan.teamSize}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span>{plan.projects}</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <ul className="space-y-2">
                        {plan.features.slice(0, 4).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <Check className="h-3 w-3 text-primary flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {selectedPlan === plan.id && (
                      <div className="pt-2">
                        <Badge variant="default" className="w-full justify-center">
                          Selected Plan
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
                )
              })}
            </div>

            {/* Plan Selection Summary */}
            {selectedPlan && (
              <div className="mb-8">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900">
                            {plans.find(p => p.id === selectedPlan)?.name} Plan Selected
                          </p>
                          <p className="text-sm text-blue-700">
                            {formatPrice(plans.find(p => p.id === selectedPlan)?.price || 0)}/month • 14-day free trial
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedPlan('')}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Change Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Account Setup
              </Button>
              
              <Button 
                onClick={handleSignUp}
                disabled={!selectedPlan || isLoading}
                className="flex items-center gap-2 min-w-[200px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Agency Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {/* Selected Plan Summary */}
            {selectedPlan && selectedPlanDetails && (
              <Card className="mt-8 max-w-md mx-auto bg-muted/30">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Your Selection:</h3>
                  <div className="flex items-center justify-between">
                    <span>{selectedPlanDetails.name} Plan</span>
                    <span className="font-bold">{formatPrice(selectedPlanDetails.price)}/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    14-day free trial, then {formatPrice(selectedPlanDetails.price)} per month. Cancel anytime.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUp;