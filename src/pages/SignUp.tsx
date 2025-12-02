import { useState, useEffect } from 'react';
import { Navigate, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Building, Check, ArrowLeft, ArrowRight, Zap, Building2, Crown,
  Users, Globe, ChevronDown, AlertCircle, Eye, EyeOff, Mail, User, Phone,
  Shield, CheckCircle2
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SignUp = () => {
  const { user, loading, signUp } = useAuth();
  const navigate = useNavigate();
  const { currency, formatPrice, changeCurrency, availableCurrencies } = useCurrency();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Form states
  const [accountData, setAccountData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    agencyName: '',
    fullName: '',
    phone: '',
  });
  
  const [selectedPlan, setSelectedPlan] = useState('professional');

  const plans = [
    {
      id: 'starter',
      name: "Starter",
      price: 29,
      period: "month",
      description: "For small teams getting started",
      icon: Zap,
      popular: false,
      teamSize: "Up to 5 users",
      projects: "10 projects",
      features: [
        "Basic project management",
        "Team collaboration",
        "Email support",
        "5GB storage",
      ]
    },
    {
      id: 'professional',
      name: "Professional",
      price: 79,
      period: "month", 
      description: "For growing agencies",
      icon: Building2,
      popular: true,
      teamSize: "Up to 25 users",
      projects: "Unlimited projects",
      features: [
        "Advanced project management",
        "Priority support",
        "100GB storage",
        "API access",
        "Client portal",
      ]
    },
    {
      id: 'enterprise',
      name: "Enterprise",
      price: 199,
      period: "month",
      description: "For large organizations",
      icon: Crown,
      popular: false,
      teamSize: "Unlimited users", 
      projects: "Unlimited projects",
      features: [
        "Everything in Professional",
        "24/7 dedicated support",
        "Unlimited storage",
        "White-label option",
        "SSO & advanced security",
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
      }
    }
  }, [searchParams]);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4:
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
      case 4:
      case 5: return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!accountData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (accountData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name';
    }
    
    if (!accountData.agencyName.trim()) {
      newErrors.agencyName = 'Agency name is required';
    } else if (accountData.agencyName.trim().length < 2) {
      newErrors.agencyName = 'Agency name must be at least 2 characters';
    }
    
    if (!accountData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!accountData.password) {
      newErrors.password = 'Password is required';
    } else if (accountData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 3) {
      newErrors.password = 'Please choose a stronger password';
    }
    
    if (!accountData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (accountData.password !== accountData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
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

  const handleSignUp = async () => {
    if (!selectedPlan) {
      toast({
        title: "Please select a plan",
        description: "Choose a plan to complete your registration.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Register the user
      const { error } = await signUp(accountData.email, accountData.password, accountData.fullName);
      
      if (error) {
        throw error;
      }

      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account.",
      });

      // Redirect to success page
      navigate(`/signup-success?agencyName=${encodeURIComponent(accountData.agencyName)}&email=${encodeURIComponent(accountData.email)}&plan=${encodeURIComponent(selectedPlan)}`);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || 'An error occurred. Please try again.',
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const selectedPlanDetails = plans.find(p => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">BuildFlow</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
                    <Globe className="h-4 w-4" />
                    {currency.code}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {Object.entries(availableCurrencies)
                    .filter(([key]) => key !== 'default')
                    .map(([countryCode, currencyInfo]) => (
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
                <Button variant="ghost" className="text-slate-600">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-center">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                currentStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {currentStep > 1 ? <Check className="h-5 w-5" /> : '1'}
              </div>
              <span className="ml-3 font-medium hidden sm:inline">Create Account</span>
            </div>
            
            <div className={`w-16 sm:w-24 h-1 mx-4 rounded-full transition-all ${
              currentStep >= 2 ? 'bg-emerald-600' : 'bg-slate-200'
            }`} />
            
            <div className={`flex items-center ${currentStep >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                currentStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                2
              </div>
              <span className="ml-3 font-medium hidden sm:inline">Choose Plan</span>
            </div>
          </div>
        </div>

        {/* Step 1: Account Setup */}
        {currentStep === 1 && (
          <Card className="max-w-xl mx-auto shadow-xl border-slate-200/50">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-slate-900">Create Your Account</CardTitle>
              <CardDescription className="text-slate-500">
                Get started with BuildFlow in just a few minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAccountSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-700">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Smith"
                      value={accountData.fullName}
                      onChange={(e) => {
                        setAccountData(prev => ({ ...prev, fullName: e.target.value }));
                        if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                      }}
                      className={`pl-10 h-11 ${errors.fullName ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Agency Name */}
                <div className="space-y-2">
                  <Label htmlFor="agencyName" className="text-slate-700">Agency / Company Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="agencyName"
                      type="text"
                      placeholder="Acme Construction Ltd"
                      value={accountData.agencyName}
                      onChange={(e) => {
                        setAccountData(prev => ({ ...prev, agencyName: e.target.value }));
                        if (errors.agencyName) setErrors(prev => ({ ...prev, agencyName: '' }));
                      }}
                      className={`pl-10 h-11 ${errors.agencyName ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                  </div>
                  {errors.agencyName && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.agencyName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">Business Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      value={accountData.email}
                      onChange={(e) => {
                        setAccountData(prev => ({ ...prev, email: e.target.value }));
                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      className={`pl-10 h-11 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700">
                    Phone Number <span className="text-slate-400 text-xs">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={accountData.phone}
                      onChange={(e) => setAccountData(prev => ({ ...prev, phone: e.target.value }))}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={accountData.password}
                        onChange={(e) => {
                          setAccountData(prev => ({ ...prev, password: e.target.value }));
                          setPasswordStrength(calculatePasswordStrength(e.target.value));
                          if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                        }}
                        className={`pr-10 h-11 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {accountData.password && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Strength:</span>
                          <span className={`font-medium ${passwordStrength >= 3 ? 'text-green-600' : 'text-orange-500'}`}>
                            {getPasswordStrengthText(passwordStrength)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all ${getPasswordStrengthColor(passwordStrength)}`}
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {errors.password && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.password}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-700">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        value={accountData.confirmPassword}
                        onChange={(e) => {
                          setAccountData(prev => ({ ...prev, confirmPassword: e.target.value }));
                          if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }}
                        className={`pr-10 h-11 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {accountData.confirmPassword && accountData.password === accountData.confirmPassword && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Passwords match
                      </p>
                    )}
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="terms" 
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => {
                        setAgreedToTerms(checked as boolean);
                        if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                      }}
                      className="mt-0.5"
                    />
                    <Label htmlFor="terms" className="text-sm text-slate-600 cursor-pointer leading-tight">
                      I agree to the{' '}
                      <Link to="/terms" className="text-emerald-600 hover:underline">Terms of Service</Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>
                    </Label>
                  </div>
                  {errors.terms && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.terms}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700">
                  Continue to Plan Selection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                  Already have an account?{' '}
                  <Link to="/auth" className="text-emerald-600 hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Plan Selection */}
        {currentStep === 2 && (
          <div>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Choose Your Plan</h2>
              <p className="text-slate-500 mb-4">
                Start with a 14-day free trial. No credit card required.
              </p>
              <Badge variant="secondary" className="px-4 py-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Cancel anytime during trial
              </Badge>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      isSelected 
                        ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-500/20' 
                        : 'border-slate-200 hover:border-slate-300'
                    } ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-emerald-600 text-white px-3">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pt-8 pb-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                        isSelected ? 'bg-emerald-100' : 'bg-slate-100'
                      }`}>
                        <plan.icon className={`h-7 w-7 ${isSelected ? 'text-emerald-600' : 'text-slate-600'}`} />
                      </div>
                      <CardTitle className="text-xl text-slate-900">{plan.name}</CardTitle>
                      <div className="mt-3">
                        <span className="text-4xl font-bold text-slate-900">{formatPrice(plan.price)}</span>
                        <span className="text-slate-500">/{plan.period}</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-2">{plan.description}</p>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className={`h-4 w-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="text-slate-700">{plan.teamSize}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className={`h-4 w-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="text-slate-700">{plan.projects}</span>
                        </div>
                      </div>
                      
                      <div className="border-t border-slate-100 pt-4">
                        <ul className="space-y-2.5">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                              <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-emerald-500' : 'text-slate-400'}`} />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {isSelected && (
                        <div className="mt-6">
                          <Badge className="w-full justify-center py-2 bg-emerald-600">
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            Selected
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Summary & Actions */}
            {selectedPlanDetails && (
              <Card className="max-w-md mx-auto mb-8 bg-slate-50 border-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-slate-900">
                      {selectedPlanDetails.name} Plan
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatPrice(selectedPlanDetails.price)}/mo
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Start your 14-day free trial today. You won't be charged until your trial ends.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(1)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              
              <Button 
                onClick={handleSignUp}
                disabled={!selectedPlan || isLoading}
                className="gap-2 min-w-[200px] bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUp;
