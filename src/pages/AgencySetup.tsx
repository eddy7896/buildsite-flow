import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { generateUUID } from '@/lib/uuid';
import { 
  Loader2, 
  Building2, 
  Users, 
  Settings,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Phone,
  Globe,
  Briefcase,
  FileText,
  Check,
  Sparkles,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Calendar,
  Bell,
  Shield,
  Zap,
  TrendingUp,
  Mail,
  CreditCard,
  FileCheck,
  Info,
  AlertCircle,
  Plus,
  X,
  Building,
  Landmark,
  Receipt,
  Wallet,
  BarChart3,
  Target,
  Clock,
  Globe2,
  FileSpreadsheet
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SETUP_STEPS = [
  { id: 1, title: 'Company Profile', icon: Building2, description: 'Basic company information and branding' },
  { id: 2, title: 'Business Details', icon: FileText, description: 'Legal and tax information' },
  { id: 3, title: 'Departments', icon: Briefcase, description: 'Organizational structure' },
  { id: 4, title: 'Financial Setup', icon: DollarSign, description: 'Currency, payment, and billing' },
  { id: 5, title: 'Team Members', icon: Users, description: 'Add your team' },
  { id: 6, title: 'Preferences', icon: Settings, description: 'System preferences' },
  { id: 7, title: 'Review', icon: CheckCircle2, description: 'Review and complete' },
];

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
];

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Toronto', label: 'Eastern Time - Toronto' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore Time (SGT)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US Format)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (European Format)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO Format)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (Alternative)' },
];

const BUSINESS_TYPES = [
  'Corporation',
  'LLC',
  'Partnership',
  'Sole Proprietorship',
  'Non-Profit',
  'Government',
  'Other'
];

const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Construction',
  'Real Estate',
  'Education',
  'Consulting',
  'Legal',
  'Marketing',
  'Hospitality',
  'Transportation',
  'Energy',
  'Other'
];

export default function AgencySetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    // Step 1: Company Profile
    companyName: '',
    companyTagline: '',
    industry: '',
    businessType: '',
    foundedYear: '',
    employeeCount: '',
    logo: null as File | null,
    description: '',
    
    // Step 2: Business Details
    legalName: '',
    registrationNumber: '',
    taxId: '',
    taxIdType: 'EIN', // EIN, VAT, GST, Other
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
    },
    phone: '',
    email: '',
    website: '',
    socialMedia: {
      linkedin: '',
      twitter: '',
      facebook: '',
    },
    
    // Step 3: Departments
    departments: [] as Array<{ id: string; name: string; description: string; manager: string; budget: string }>,
    
    // Step 4: Financial Setup
    currency: 'USD',
    fiscalYearStart: '01-01',
    paymentTerms: '30',
    invoicePrefix: 'INV',
    taxRate: '0',
    enableGST: false,
    gstNumber: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      routingNumber: '',
      swiftCode: '',
    },
    
    // Step 5: Team Members
    teamMembers: [] as Array<{ 
      name: string; 
      email: string; 
      role: string; 
      department: string;
      phone: string;
      title: string;
    }>,
    
    // Step 6: Preferences
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12', // 12 or 24
    weekStart: 'Monday',
    language: 'en',
    notifications: {
      email: true,
      sms: false,
      push: true,
      weeklyReport: true,
      monthlyReport: true,
    },
    features: {
      enablePayroll: true,
      enableProjects: true,
      enableCRM: true,
      enableInventory: false,
      enableReports: true,
    },
  });

  // Check if setup is already complete
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const agencyDatabase = localStorage.getItem('agency_database');
        if (!agencyDatabase) {
          navigate('/dashboard');
          return;
        }

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const apiBaseUrl = API_URL.replace(/\/api\/?$/, '');
        
        const response = await fetch(`${apiBaseUrl}/api/agencies/check-setup?database=${encodeURIComponent(agencyDatabase || '')}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'X-Agency-Database': agencyDatabase || '',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.setupComplete) {
            setSetupComplete(true);
            navigate('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking setup status:', error);
      } finally {
        setIsCheckingSetup(false);
      }
    };

    checkSetupStatus();
  }, [navigate]);

  if (isCheckingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking setup status...</p>
        </div>
      </div>
    );
  }

  if (setupComplete) {
    return null;
  }

  const progress = (currentStep / SETUP_STEPS.length) * 100;
  const CurrentStepIcon = SETUP_STEPS[currentStep - 1]?.icon || Building2;

  const handleNext = () => {
    // Step-by-step validation
    if (currentStep === 1) {
      if (!formData.companyName.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Company name is required',
          variant: 'destructive',
        });
        return;
      }
    } else if (currentStep === 5) {
      // Validate team members if any are added
      if (formData.teamMembers.length > 0) {
        for (let i = 0; i < formData.teamMembers.length; i++) {
          const member = formData.teamMembers[i];
          if (!member.name || !member.name.trim()) {
            toast({
              title: 'Validation Error',
              description: `Team member ${i + 1}: Name is required`,
              variant: 'destructive',
            });
            return;
          }
          if (!member.email || !member.email.trim()) {
            toast({
              title: 'Validation Error',
              description: `Team member ${i + 1}: Email is required`,
              variant: 'destructive',
            });
            return;
          }
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(member.email)) {
            toast({
              title: 'Validation Error',
              description: `Team member ${i + 1}: Please enter a valid email address`,
              variant: 'destructive',
            });
            return;
          }
        }
      }
    }
    
    if (currentStep < SETUP_STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Logo must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      setFormData(prev => ({ ...prev, logo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = async () => {
    if (!formData.companyName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Company name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const apiBaseUrl = API_URL.replace(/\/api\/?$/, '');
      
      const agencyDatabase = localStorage.getItem('agency_database');
      
      // Convert logo to base64 if present
      let logoBase64 = null;
      if (formData.logo) {
        const reader = new FileReader();
        logoBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(formData.logo!);
        });
      }

      const response = await fetch(`${apiBaseUrl}/api/agencies/complete-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'X-Agency-Database': agencyDatabase || '',
        },
        body: JSON.stringify({
          ...formData,
          logo: logoBase64,
          database: agencyDatabase,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to complete setup');
      }

      toast({
        title: '🎉 Setup Complete!',
        description: 'Your agency is now fully configured and ready to use.',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      toast({
        title: 'Setup Failed',
        description: error.message || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completedSteps = currentStep - 1;
  const totalSteps = SETUP_STEPS.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Complete Your Agency Setup
          </h1>
          <p className="text-muted-foreground text-lg">
            Let's configure your agency to get you started in just a few steps
          </p>
        </div>

        {/* Progress Card */}
        <Card className="mb-6 border-0 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <CurrentStepIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl mb-1">
                    {SETUP_STEPS[currentStep - 1]?.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {SETUP_STEPS[currentStep - 1]?.description}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-sm px-4 py-2">
                Step {currentStep} of {totalSteps}
              </Badge>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-muted-foreground">Progress</span>
                <span className="font-semibold text-primary">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between items-center">
                {SETUP_STEPS.map((step, idx) => (
                  <TooltipProvider key={step.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center gap-2 flex-1">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                            idx + 1 < currentStep
                              ? 'bg-primary text-white shadow-lg scale-110'
                              : idx + 1 === currentStep
                              ? 'bg-primary text-white shadow-lg scale-110 ring-4 ring-primary/20'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {idx + 1 < currentStep ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <step.icon className="h-5 w-5" />
                            )}
                          </div>
                          <span className={`text-xs font-medium text-center hidden md:block ${
                            idx + 1 <= currentStep ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            {step.title}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{step.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Step Content */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            {/* Step 1: Company Profile */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-2 flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-primary" />
                    Company Profile
                  </h3>
                  <p className="text-muted-foreground">
                    Tell us about your company. This information will be used throughout the platform.
                  </p>
                </div>

                <div className="grid gap-8">
                  {/* Logo Upload */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Company Logo</Label>
                    <div className="flex items-center gap-6">
                      <div className="h-32 w-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50 overflow-hidden">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">No logo</p>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <Label htmlFor="logo-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" asChild>
                            <span>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Logo
                            </span>
                          </Button>
                        </Label>
                        <p className="text-xs text-muted-foreground mt-2">
                          Recommended: 512x512px, PNG or JPG, max 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="companyName" className="text-base">
                        Company Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        placeholder="Enter your company name"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyTagline">Company Tagline</Label>
                      <Input
                        id="companyTagline"
                        placeholder="Your company's tagline or slogan"
                        value={formData.companyTagline}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyTagline: e.target.value }))}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Select
                        value={formData.industry}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRY_OPTIONS.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessType">Business Type</Label>
                      <Select
                        value={formData.businessType}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, businessType: value }))}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="foundedYear">Year Founded</Label>
                      <Input
                        id="foundedYear"
                        type="number"
                        placeholder="e.g., 2020"
                        value={formData.foundedYear}
                        onChange={(e) => setFormData(prev => ({ ...prev, foundedYear: e.target.value }))}
                        className="h-11"
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employeeCount">Number of Employees</Label>
                      <Select
                        value={formData.employeeCount}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, employeeCount: value }))}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10</SelectItem>
                          <SelectItem value="11-50">11-50</SelectItem>
                          <SelectItem value="51-200">51-200</SelectItem>
                          <SelectItem value="201-500">201-500</SelectItem>
                          <SelectItem value="501-1000">501-1000</SelectItem>
                          <SelectItem value="1000+">1000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Company Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of your company..."
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Business Details */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-2 flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    Business Details
                  </h3>
                  <p className="text-muted-foreground">
                    Legal and contact information for your business
                  </p>
                </div>

                <Tabs defaultValue="legal" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="legal">Legal Info</TabsTrigger>
                    <TabsTrigger value="address">Address</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                  </TabsList>

                  <TabsContent value="legal" className="space-y-6 mt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="legalName">Legal Business Name</Label>
                        <Input
                          id="legalName"
                          placeholder="As registered with authorities"
                          value={formData.legalName}
                          onChange={(e) => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="registrationNumber">Registration Number</Label>
                        <Input
                          id="registrationNumber"
                          placeholder="Business registration number"
                          value={formData.registrationNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="taxIdType">Tax ID Type</Label>
                        <Select
                          value={formData.taxIdType}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, taxIdType: value }))}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EIN">EIN (US)</SelectItem>
                            <SelectItem value="VAT">VAT (EU)</SelectItem>
                            <SelectItem value="GST">GST (India/Canada)</SelectItem>
                            <SelectItem value="ABN">ABN (Australia)</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="taxId">Tax ID Number</Label>
                        <Input
                          id="taxId"
                          placeholder="Enter your tax ID"
                          value={formData.taxId}
                          onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="address" className="space-y-6 mt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Input
                          id="street"
                          placeholder="123 Main Street"
                          value={formData.address.street}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, street: e.target.value }
                          }))}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="City"
                          value={formData.address.city}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, city: e.target.value }
                          }))}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State/Province</Label>
                        <Input
                          id="state"
                          placeholder="State or Province"
                          value={formData.address.state}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, state: e.target.value }
                          }))}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                        <Input
                          id="zipCode"
                          placeholder="12345"
                          value={formData.address.zipCode}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, zipCode: e.target.value }
                          }))}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          placeholder="Country"
                          value={formData.address.country}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, country: e.target.value }
                          }))}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contact" className="space-y-6 mt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            className="h-11 pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Business Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="contact@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="h-11 pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="website"
                            type="url"
                            placeholder="https://yourcompany.com"
                            value={formData.website}
                            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                            className="h-11 pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          type="url"
                          placeholder="https://linkedin.com/company/..."
                          value={formData.socialMedia.linkedin}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            socialMedia: { ...prev.socialMedia, linkedin: e.target.value }
                          }))}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Step 3: Departments - Enhanced */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-2 flex items-center gap-3">
                    <Briefcase className="h-6 w-6 text-primary" />
                    Organizational Structure
                  </h3>
                  <p className="text-muted-foreground">
                    Set up your departments and organizational hierarchy
                  </p>
                </div>

                <div className="space-y-4">
                  {formData.departments.map((dept, index) => (
                    <Card key={dept.id} className="p-6 border-2">
                      <div className="flex items-start justify-between mb-4">
                        <Badge variant="outline" className="text-sm">
                          Department {index + 1}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              departments: prev.departments.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Department Name *</Label>
                          <Input
                            value={dept.name}
                            onChange={(e) => {
                              const updated = [...formData.departments];
                              updated[index].name = e.target.value;
                              setFormData(prev => ({ ...prev, departments: updated }));
                            }}
                            placeholder="e.g., Engineering, Sales, HR"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Department Manager</Label>
                          <Input
                            value={dept.manager}
                            onChange={(e) => {
                              const updated = [...formData.departments];
                              updated[index].manager = e.target.value;
                              setFormData(prev => ({ ...prev, departments: updated }));
                            }}
                            placeholder="Manager name"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Description</Label>
                          <Textarea
                            value={dept.description}
                            onChange={(e) => {
                              const updated = [...formData.departments];
                              updated[index].description = e.target.value;
                              setFormData(prev => ({ ...prev, departments: updated }));
                            }}
                            placeholder="Brief description of department responsibilities"
                            rows={2}
                            className="resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Annual Budget (Optional)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={dept.budget}
                              onChange={(e) => {
                                const updated = [...formData.departments];
                                updated[index].budget = e.target.value;
                                setFormData(prev => ({ ...prev, departments: updated }));
                              }}
                              placeholder="0.00"
                              className="h-11 pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        departments: [...prev.departments, {
                          id: generateUUID(),
                          name: '',
                          description: '',
                          manager: '',
                          budget: ''
                        }]
                      }));
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Department
                  </Button>

                  {formData.departments.length === 0 && (
                    <Card className="p-8 text-center border-dashed">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">No departments added yet</p>
                      <p className="text-sm text-muted-foreground">
                        You can add departments now or later from the department management page
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Financial Setup */}
            {currentStep === 4 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-2 flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-primary" />
                    Financial Configuration
                  </h3>
                  <p className="text-muted-foreground">
                    Configure currency, billing, and financial settings
                  </p>
                </div>

                <div className="grid gap-8">
                  <Card className="p-6">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Currency & Billing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Base Currency</Label>
                          <Select
                            value={formData.currency}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map((curr) => (
                                <SelectItem key={curr.code} value={curr.code}>
                                  {curr.symbol} {curr.code} - {curr.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Fiscal Year Start</Label>
                          <Input
                            type="text"
                            placeholder="MM-DD (e.g., 01-01)"
                            value={formData.fiscalYearStart}
                            onChange={(e) => setFormData(prev => ({ ...prev, fiscalYearStart: e.target.value }))}
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Default Payment Terms (Days)</Label>
                          <Input
                            type="number"
                            placeholder="30"
                            value={formData.paymentTerms}
                            onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Invoice Prefix</Label>
                          <Input
                            placeholder="INV"
                            value={formData.invoicePrefix}
                            onChange={(e) => setFormData(prev => ({ ...prev, invoicePrefix: e.target.value }))}
                            className="h-11"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="p-6">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Tax Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Default Tax Rate (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.taxRate}
                            onChange={(e) => setFormData(prev => ({ ...prev, taxRate: e.target.value }))}
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2 flex items-center gap-4">
                          <div className="flex-1">
                            <Label>Enable GST/VAT</Label>
                            <p className="text-xs text-muted-foreground">Enable GST/VAT tracking</p>
                          </div>
                          <Switch
                            checked={formData.enableGST}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableGST: checked }))}
                          />
                        </div>

                        {formData.enableGST && (
                          <div className="space-y-2 md:col-span-2">
                            <Label>GST/VAT Number</Label>
                            <Input
                              placeholder="Enter GST/VAT number"
                              value={formData.gstNumber}
                              onChange={(e) => setFormData(prev => ({ ...prev, gstNumber: e.target.value }))}
                              className="h-11"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="p-6">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Landmark className="h-5 w-5" />
                        Bank Details (Optional)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Account Name</Label>
                          <Input
                            placeholder="Account holder name"
                            value={formData.bankDetails.accountName}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              bankDetails: { ...prev.bankDetails, accountName: e.target.value }
                            }))}
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Account Number</Label>
                          <Input
                            placeholder="Account number"
                            value={formData.bankDetails.accountNumber}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                            }))}
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Bank Name</Label>
                          <Input
                            placeholder="Bank name"
                            value={formData.bankDetails.bankName}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              bankDetails: { ...prev.bankDetails, bankName: e.target.value }
                            }))}
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Routing/SWIFT Code</Label>
                          <Input
                            placeholder="Routing or SWIFT code"
                            value={formData.bankDetails.routingNumber}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              bankDetails: { ...prev.bankDetails, routingNumber: e.target.value }
                            }))}
                            className="h-11"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 5: Team Members - Enhanced */}
            {currentStep === 5 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-2 flex items-center gap-3">
                    <Users className="h-6 w-6 text-primary" />
                    Team Members
                  </h3>
                  <p className="text-muted-foreground">
                    Add your team members. You can invite more later from the employee management page.
                  </p>
                </div>

                <div className="space-y-4">
                  {formData.teamMembers.map((member, index) => (
                    <Card key={index} className="p-6 border-2">
                      <div className="flex items-start justify-between mb-4">
                        <Badge variant="outline" className="text-sm">
                          Member {index + 1}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              teamMembers: prev.teamMembers.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Full Name *</Label>
                          <Input
                            value={member.name}
                            onChange={(e) => {
                              const updated = [...formData.teamMembers];
                              updated[index].name = e.target.value;
                              setFormData(prev => ({ ...prev, teamMembers: updated }));
                            }}
                            placeholder="John Doe"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email Address *</Label>
                          <Input
                            type="email"
                            value={member.email}
                            onChange={(e) => {
                              const updated = [...formData.teamMembers];
                              updated[index].email = e.target.value;
                              setFormData(prev => ({ ...prev, teamMembers: updated }));
                            }}
                            placeholder="john@company.com"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Job Title</Label>
                          <Input
                            value={member.title}
                            onChange={(e) => {
                              const updated = [...formData.teamMembers];
                              updated[index].title = e.target.value;
                              setFormData(prev => ({ ...prev, teamMembers: updated }));
                            }}
                            placeholder="e.g., Software Engineer"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Department</Label>
                          <Select
                            value={member.department}
                            onValueChange={(value) => {
                              const updated = [...formData.teamMembers];
                              updated[index].department = value;
                              setFormData(prev => ({ ...prev, teamMembers: updated }));
                            }}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {formData.departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.name}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                              <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select
                            value={member.role}
                            onValueChange={(value) => {
                              const updated = [...formData.teamMembers];
                              updated[index].role = value;
                              setFormData(prev => ({ ...prev, teamMembers: updated }));
                            }}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="hr">HR Manager</SelectItem>
                              <SelectItem value="finance_manager">Finance Manager</SelectItem>
                              <SelectItem value="project_manager">Project Manager</SelectItem>
                              <SelectItem value="admin">Administrator</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            type="tel"
                            value={member.phone}
                            onChange={(e) => {
                              const updated = [...formData.teamMembers];
                              updated[index].phone = e.target.value;
                              setFormData(prev => ({ ...prev, teamMembers: updated }));
                            }}
                            placeholder="+1 (555) 123-4567"
                            className="h-11"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        teamMembers: [...prev.teamMembers, {
                          name: '',
                          email: '',
                          role: 'employee',
                          department: '',
                          phone: '',
                          title: ''
                        }]
                      }));
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Team Member
                  </Button>

                  {formData.teamMembers.length === 0 && (
                    <Card className="p-8 text-center border-dashed">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">No team members added yet</p>
                      <p className="text-sm text-muted-foreground">
                        You can add team members now or later from the employee management page
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Preferences */}
            {currentStep === 6 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-2 flex items-center gap-3">
                    <Settings className="h-6 w-6 text-primary" />
                    System Preferences
                  </h3>
                  <p className="text-muted-foreground">
                    Configure your system preferences and notification settings
                  </p>
                </div>

                <div className="grid gap-8">
                  <Card className="p-6">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Globe2 className="h-5 w-5" />
                        Localization
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Timezone</Label>
                          <Select
                            value={formData.timezone}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIMEZONES.map((tz) => (
                                <SelectItem key={tz.value} value={tz.value}>
                                  {tz.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Date Format</Label>
                          <Select
                            value={formData.dateFormat}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, dateFormat: value }))}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DATE_FORMATS.map((format) => (
                                <SelectItem key={format.value} value={format.value}>
                                  {format.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Time Format</Label>
                          <Select
                            value={formData.timeFormat}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, timeFormat: value }))}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12">12-hour (AM/PM)</SelectItem>
                              <SelectItem value="24">24-hour</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Week Starts On</Label>
                          <Select
                            value={formData.weekStart}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, weekStart: value }))}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Monday">Monday</SelectItem>
                              <SelectItem value="Sunday">Sunday</SelectItem>
                              <SelectItem value="Saturday">Saturday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="p-6">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                        </div>
                        <Switch
                          checked={formData.notifications.email}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            notifications: { ...prev.notifications, email: checked }
                          }))}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>SMS Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                        </div>
                        <Switch
                          checked={formData.notifications.sms}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            notifications: { ...prev.notifications, sms: checked }
                          }))}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                        </div>
                        <Switch
                          checked={formData.notifications.push}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            notifications: { ...prev.notifications, push: checked }
                          }))}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Weekly Reports</Label>
                          <p className="text-sm text-muted-foreground">Receive weekly summary reports</p>
                        </div>
                        <Switch
                          checked={formData.notifications.weeklyReport}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            notifications: { ...prev.notifications, weeklyReport: checked }
                          }))}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Monthly Reports</Label>
                          <p className="text-sm text-muted-foreground">Receive monthly summary reports</p>
                        </div>
                        <Switch
                          checked={formData.notifications.monthlyReport}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            notifications: { ...prev.notifications, monthlyReport: checked }
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="p-6">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Feature Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Payroll Management</Label>
                          <p className="text-sm text-muted-foreground">Enable payroll features</p>
                        </div>
                        <Switch
                          checked={formData.features.enablePayroll}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            features: { ...prev.features, enablePayroll: checked }
                          }))}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Project Management</Label>
                          <p className="text-sm text-muted-foreground">Enable project tracking</p>
                        </div>
                        <Switch
                          checked={formData.features.enableProjects}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            features: { ...prev.features, enableProjects: checked }
                          }))}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>CRM</Label>
                          <p className="text-sm text-muted-foreground">Enable customer relationship management</p>
                        </div>
                        <Switch
                          checked={formData.features.enableCRM}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            features: { ...prev.features, enableCRM: checked }
                          }))}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Inventory Management</Label>
                          <p className="text-sm text-muted-foreground">Enable inventory tracking</p>
                        </div>
                        <Switch
                          checked={formData.features.enableInventory}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            features: { ...prev.features, enableInventory: checked }
                          }))}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Advanced Reports</Label>
                          <p className="text-sm text-muted-foreground">Enable advanced reporting features</p>
                        </div>
                        <Switch
                          checked={formData.features.enableReports}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            features: { ...prev.features, enableReports: checked }
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 7: Review & Complete */}
            {currentStep === 7 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-2 flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                    Review & Complete Setup
                  </h3>
                  <p className="text-muted-foreground">
                    Review all your information before completing the setup
                  </p>
                </div>

                <div className="grid gap-6">
                  {/* Company Profile */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Company Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Company Name</Label>
                          <p className="font-medium">{formData.companyName || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Industry</Label>
                          <p className="font-medium">{formData.industry || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Business Type</Label>
                          <p className="font-medium">{formData.businessType || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Employees</Label>
                          <p className="font-medium">{formData.employeeCount || 'Not provided'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Business Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Business Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Legal Name</Label>
                          <p className="font-medium">{formData.legalName || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Tax ID</Label>
                          <p className="font-medium">{formData.taxId || 'Not provided'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-muted-foreground">Address</Label>
                          <p className="font-medium">
                            {formData.address.street || 'Not provided'}
                            {formData.address.city && `, ${formData.address.city}`}
                            {formData.address.state && `, ${formData.address.state}`}
                            {formData.address.zipCode && ` ${formData.address.zipCode}`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Departments */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Departments ({formData.departments.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {formData.departments.length > 0 ? (
                        <div className="space-y-2">
                          {formData.departments.map((dept) => (
                            <div key={dept.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                              <Check className="h-4 w-4 text-primary" />
                              <span className="font-medium">{dept.name}</span>
                              {dept.manager && <span className="text-sm text-muted-foreground">- {dept.manager}</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No departments added</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Financial */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Financial Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Currency</Label>
                          <p className="font-medium">{formData.currency}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Payment Terms</Label>
                          <p className="font-medium">{formData.paymentTerms} days</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Tax Rate</Label>
                          <p className="font-medium">{formData.taxRate}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Team Members */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members ({formData.teamMembers.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {formData.teamMembers.length > 0 ? (
                        <div className="space-y-2">
                          {formData.teamMembers.map((member, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                              <Check className="h-4 w-4 text-primary" />
                              <span className="font-medium">{member.name}</span>
                              <span className="text-sm text-muted-foreground">({member.email})</span>
                              <Badge variant="outline" className="ml-auto">{member.role}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No team members added</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Preferences */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Timezone</Label>
                          <p className="font-medium">{TIMEZONES.find(tz => tz.value === formData.timezone)?.label || formData.timezone}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Date Format</Label>
                          <p className="font-medium">{DATE_FORMATS.find(df => df.value === formData.dateFormat)?.label || formData.dateFormat}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Info className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Ready to Complete Setup?</h4>
                        <p className="text-sm text-muted-foreground">
                          Once you complete the setup, you'll be redirected to your dashboard. 
                          You can always update these settings later from the settings page.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isLoading}
                size="lg"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Step {currentStep} of {totalSteps}</span>
              </div>

              {currentStep < SETUP_STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  size="lg"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleComplete}
                  disabled={isLoading}
                  size="lg"
                  className="min-w-[160px] bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Complete Setup
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
