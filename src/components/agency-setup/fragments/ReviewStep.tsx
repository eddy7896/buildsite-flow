import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  FileText, 
  Briefcase, 
  DollarSign, 
  Users, 
  Settings, 
  CheckCircle2, 
  Check, 
  Info 
} from 'lucide-react';
import { AgencySetupFormData, TIMEZONES, DATE_FORMATS } from './types';

interface ReviewStepProps {
  formData: AgencySetupFormData;
}

export function ReviewStep({ formData }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-lg md:text-xl font-semibold mb-1.5 flex items-center gap-2 text-slate-900 dark:text-white">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Review & Complete Setup
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Review all your information before completing the setup
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <Building2 className="h-4 w-4 text-primary" />
              Company Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Company Name</Label>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{formData.companyName || <span className="text-slate-400 dark:text-slate-500 italic">Not provided</span>}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Industry</Label>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{formData.industry || <span className="text-slate-400 dark:text-slate-500 italic">Not provided</span>}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Business Type</Label>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{formData.businessType || <span className="text-slate-400 dark:text-slate-500 italic">Not provided</span>}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Employees</Label>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{formData.employeeCount || <span className="text-slate-400 dark:text-slate-500 italic">Not provided</span>}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <FileText className="h-4 w-4 text-primary" />
              Business Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Legal Name</Label>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{formData.legalName || <span className="text-slate-400 dark:text-slate-500 italic">Not provided</span>}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tax ID</Label>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{formData.taxId || <span className="text-slate-400 dark:text-slate-500 italic">Not provided</span>}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Address</Label>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                  {formData.address.street || <span className="text-slate-400 dark:text-slate-500 italic">Not provided</span>}
                  {formData.address.city && `, ${formData.address.city}`}
                  {formData.address.state && `, ${formData.address.state}`}
                  {formData.address.zipCode && ` ${formData.address.zipCode}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <Briefcase className="h-4 w-4 text-primary" />
              Departments ({formData.departments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {formData.departments.length > 0 ? (
              <div className="space-y-2">
                {formData.departments.map((dept) => (
                  <div key={dept.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{dept.name}</span>
                    {dept.manager && <span className="text-xs text-slate-500 dark:text-slate-400">- {dept.manager}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No departments added</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <DollarSign className="h-4 w-4 text-primary" />
              Financial Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Currency</Label>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{formData.currency}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Payment Terms</Label>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{formData.paymentTerms} days</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tax Rate</Label>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{formData.taxRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{member.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">({member.email})</span>
                    <Badge variant="secondary" className="ml-auto text-xs">{member.role}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No team members added</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <Settings className="h-4 w-4 text-primary" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Timezone</Label>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{TIMEZONES.find(tz => tz.value === formData.timezone)?.label || formData.timezone}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date Format</Label>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{DATE_FORMATS.find(df => df.value === formData.dateFormat)?.label || formData.dateFormat}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Info className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold mb-1 text-sm md:text-base">Ready to Complete Setup?</h4>
              <p className="text-xs md:text-sm text-muted-foreground">
                Once you complete the setup, you'll be redirected to your dashboard. 
                You can always update these settings later from the settings page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
