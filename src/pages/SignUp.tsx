import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
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
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SignUp = () => {
  const { signUp, user, loading } = useAuth();
  const { currency, formatPrice, changeCurrency, availableCurrencies } = useCurrency();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [accountData, setAccountData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    agencyName: '',
    fullName: '',
    phone: '',
    countryCode: '+1 US'
  });
  
  const [selectedPlan, setSelectedPlan] = useState('');

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

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (accountData.password !== accountData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (accountData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    setCurrentStep(2);
  };

  const handlePlanSelection = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSignUp = async () => {
    if (!selectedPlan) {
      alert('Please select a plan');
      return;
    }

    setIsLoading(true);
    
    const { error } = await signUp(accountData.email, accountData.password, accountData.fullName);
    
    if (!error) {
      // TODO: Store selected plan and agency info
      // This would typically be handled by a separate API call
      console.log('Agency signup:', { 
        ...accountData, 
        selectedPlan,
        planDetails: plans.find(p => p.id === selectedPlan)
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
                Set up your construction management agency in minutes
              </CardDescription>
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
                      onChange={(e) => setAccountData(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agencyName">Agency Name</Label>
                    <Input
                      id="agencyName"
                      type="text"
                      placeholder="ABC Construction"
                      value={accountData.agencyName}
                      onChange={(e) => setAccountData(prev => ({ ...prev, agencyName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Business Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@abcconstruction.com"
                    value={accountData.email}
                    onChange={(e) => setAccountData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
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
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a strong password"
                      value={accountData.password}
                      onChange={(e) => setAccountData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={accountData.confirmPassword}
                      onChange={(e) => setAccountData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Continue to Plan Selection
                  <ArrowRight className="ml-2 h-4 w-4" />
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
              <p className="text-muted-foreground">
                Select the perfect plan for {accountData.agencyName}
              </p>
              <Badge variant="secondary" className="mt-4">
                14-day free trial • No credit card required
              </Badge>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`relative cursor-pointer transition-all hover:shadow-lg ${
                    selectedPlan === plan.id ? 'border-primary shadow-lg scale-105' : 'border-border'
                  } ${plan.popular ? 'border-primary' : ''}`}
                  onClick={() => handlePlanSelection(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Most Popular
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
              ))}
            </div>

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