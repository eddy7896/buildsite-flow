import { Building2, FileText, Briefcase, DollarSign, Users, Settings, CheckCircle2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export const SETUP_STEPS: Array<{ id: number; title: string; icon: LucideIcon; description: string }> = [
  { id: 1, title: 'Company Profile', icon: Building2, description: 'Basic company information and branding' },
  { id: 2, title: 'Business Details', icon: FileText, description: 'Legal and tax information' },
  { id: 3, title: 'Departments', icon: Briefcase, description: 'Organizational structure' },
  { id: 4, title: 'Financial Setup', icon: DollarSign, description: 'Currency, payment, and billing' },
  { id: 5, title: 'Team Members', icon: Users, description: 'Add your team' },
  { id: 6, title: 'Preferences', icon: Settings, description: 'System preferences' },
  { id: 7, title: 'Review', icon: CheckCircle2, description: 'Review and complete' },
];

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
];

export const TIMEZONES = [
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

export const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US Format)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (European Format)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO Format)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (Alternative)' },
];

export const BUSINESS_TYPES = [
  'Corporation',
  'LLC',
  'Partnership',
  'Sole Proprietorship',
  'Non-Profit',
  'Government',
  'Other'
];

export const INDUSTRY_OPTIONS = [
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

export interface AgencySetupFormData {
  companyName: string;
  companyTagline: string;
  industry: string;
  businessType: string;
  foundedYear: string;
  employeeCount: string;
  logo: File | null;
  description: string;
  
  legalName: string;
  registrationNumber: string;
  taxId: string;
  taxIdType: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  email: string;
  website: string;
  socialMedia: {
    linkedin: string;
    twitter: string;
    facebook: string;
  };
  
  departments: Array<{ id: string; name: string; description: string; manager: string; budget: string }>;
  
  currency: string;
  fiscalYearStart: string;
  paymentTerms: string;
  invoicePrefix: string;
  taxRate: string;
  enableGST: boolean;
  gstNumber: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    routingNumber: string;
    swiftCode: string;
  };
  
  teamMembers: Array<{ 
    name: string; 
    email: string; 
    role: string; 
    department: string;
    phone: string;
    title: string;
  }>;
  
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  weekStart: string;
  language: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
  };
  features: {
    enablePayroll: boolean;
    enableProjects: boolean;
    enableCRM: boolean;
    enableInventory: boolean;
    enableReports: boolean;
  };
}

export const initialFormData: AgencySetupFormData = {
  companyName: '',
  companyTagline: '',
  industry: '',
  businessType: '',
  foundedYear: '',
  employeeCount: '',
  logo: null,
  description: '',
  
  legalName: '',
  registrationNumber: '',
  taxId: '',
  taxIdType: 'EIN',
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
  
  departments: [],
  
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
  
  teamMembers: [],
  
  timezone: 'America/New_York',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12',
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
};
