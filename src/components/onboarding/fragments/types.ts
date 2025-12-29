import { 
  Building2, 
  Briefcase, 
  Shield, 
  Rocket, 
  LucideIcon,
  Laptop,
  Megaphone,
  BarChart3,
  Wallet,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  Building,
  Scale,
  Palette,
  Truck,
  Globe,
  User,
  Users,
  TrendingUp,
  ClipboardList,
  Banknote,
  UserCheck,
  Handshake,
  Sparkles
} from 'lucide-react';

export interface OnboardingStep {
  id: number;
  key: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
  tip: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    key: 'identity',
    title: 'Agency Identity',
    subtitle: 'Name your workspace',
    description: 'Give your agency a unique name and claim your workspace URL',
    icon: Building2,
    color: 'blue',
    tip: 'Choose a memorable name that reflects your brand',
  },
  {
    id: 2,
    key: 'business',
    title: 'Business Profile',
    subtitle: 'Tell us about you',
    description: 'Help us customize your experience based on your industry',
    icon: Briefcase,
    color: 'violet',
    tip: 'This helps us recommend the best features for you',
  },
  {
    id: 3,
    key: 'admin',
    title: 'Admin Account',
    subtitle: 'Secure your access',
    description: 'Create your Super Admin credentials for full control',
    icon: Shield,
    color: 'emerald',
    tip: 'Use a strong password you\'ll remember',
  },
  {
    id: 4,
    key: 'launch',
    title: 'Launch',
    subtitle: 'Go live instantly',
    description: 'Review your setup and launch your agency workspace',
    icon: Rocket,
    color: 'amber',
    tip: 'You can always customize settings later',
  },
];

export interface OnboardingFormData {
  agencyName: string;
  domain: string;
  domainSuffix: string;
  tagline: string;
  industry: string;
  companySize: string;
  primaryFocus: string;
  country: string;
  timezone: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  enableGST: boolean;
  subscriptionPlan: string;
}

export const initialFormData: OnboardingFormData = {
  agencyName: '',
  domain: '',
  domainSuffix: '.app',
  tagline: '',
  industry: '',
  companySize: '',
  primaryFocus: '',
  country: 'IN',
  timezone: 'Asia/Kolkata',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
  confirmPassword: '',
  agreeToTerms: false,
  enableGST: true,
  subscriptionPlan: 'professional',
};

export const DOMAIN_SUFFIXES = [
  { value: '.app', label: '.app', popular: true },
  { value: '.io', label: '.io', popular: true },
  { value: '.co', label: '.co', popular: true },
  { value: '.com', label: '.com', popular: false },
  { value: '.net', label: '.net', popular: false },
  { value: '.dev', label: '.dev', popular: false },
  { value: '.agency', label: '.agency', popular: false },
  { value: '.tech', label: '.tech', popular: false },
];

export const INDUSTRIES = [
  { value: 'technology', label: 'Technology', icon: Laptop, description: 'Software, SaaS, IT Services' },
  { value: 'marketing', label: 'Marketing', icon: Megaphone, description: 'Digital Marketing, Advertising' },
  { value: 'consulting', label: 'Consulting', icon: BarChart3, description: 'Business, Management, Strategy' },
  { value: 'finance', label: 'Finance', icon: Wallet, description: 'Banking, Accounting, Investment' },
  { value: 'healthcare', label: 'Healthcare', icon: HeartPulse, description: 'Medical, Wellness, Pharma' },
  { value: 'education', label: 'Education', icon: GraduationCap, description: 'EdTech, Training, Coaching' },
  { value: 'retail', label: 'Retail', icon: ShoppingBag, description: 'E-commerce, Consumer Goods' },
  { value: 'real_estate', label: 'Real Estate', icon: Building, description: 'Property, Construction' },
  { value: 'legal', label: 'Legal', icon: Scale, description: 'Law Firms, Compliance' },
  { value: 'creative', label: 'Creative', icon: Palette, description: 'Design, Media, Entertainment' },
  { value: 'logistics', label: 'Logistics', icon: Truck, description: 'Supply Chain, Transportation' },
  { value: 'other', label: 'Other', icon: Globe, description: 'Other Industries' },
];

export const COMPANY_SIZES = [
  { value: 'solo', label: 'Just Me', employees: '1', icon: User, color: 'from-blue-500/20 to-blue-600/20' },
  { value: '2-10', label: 'Small Team', employees: '2-10', icon: Users, color: 'from-emerald-500/20 to-emerald-600/20' },
  { value: '11-50', label: 'Growing', employees: '11-50', icon: Rocket, color: 'from-violet-500/20 to-violet-600/20' },
  { value: '51-200', label: 'Scaling', employees: '51-200', icon: TrendingUp, color: 'from-amber-500/20 to-amber-600/20' },
  { value: '201+', label: 'Enterprise', employees: '201+', icon: Building2, color: 'from-rose-500/20 to-rose-600/20' },
];

export const PRIMARY_FOCUSES = [
  { value: 'projects', label: 'Project Management', icon: ClipboardList, description: 'Tasks, timelines, team collaboration' },
  { value: 'finance', label: 'Finance & Invoicing', icon: Banknote, description: 'Billing, expenses, payments' },
  { value: 'hr', label: 'HR & Payroll', icon: UserCheck, description: 'Employees, attendance, salaries' },
  { value: 'crm', label: 'Client Management', icon: Handshake, description: 'Leads, clients, relationships' },
  { value: 'all', label: 'Everything', icon: Sparkles, description: 'Full suite of features' },
];

export const COUNTRIES = [
  { value: 'IN', label: 'India', code: 'IN' },
  { value: 'US', label: 'United States', code: 'US' },
  { value: 'GB', label: 'United Kingdom', code: 'GB' },
  { value: 'CA', label: 'Canada', code: 'CA' },
  { value: 'AU', label: 'Australia', code: 'AU' },
  { value: 'DE', label: 'Germany', code: 'DE' },
  { value: 'FR', label: 'France', code: 'FR' },
  { value: 'SG', label: 'Singapore', code: 'SG' },
  { value: 'AE', label: 'UAE', code: 'AE' },
  { value: 'OTHER', label: 'Other', code: 'OTHER' },
];
