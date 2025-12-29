import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, User, Mail, Globe, Briefcase, Users, Check } from 'lucide-react';
import { OnboardingFormData, INDUSTRIES, COMPANY_SIZES } from '../fragments/types';

interface StepLaunchProps {
  formData: OnboardingFormData;
  isLoading: boolean;
  setCanProceed: (can: boolean) => void;
}

export default function StepLaunch({ formData, isLoading, setCanProceed }: StepLaunchProps) {
  useEffect(() => {
    setCanProceed(true);
  }, [setCanProceed]);

  const getIndustryLabel = () => {
    return INDUSTRIES.find(i => i.value === formData.industry)?.label || formData.industry;
  };

  const getCompanySizeLabel = () => {
    const size = COMPANY_SIZES.find(s => s.value === formData.companySize);
    return size ? `${size.label} (${size.employees})` : formData.companySize;
  };

  const reviewItems = [
    { icon: Building2, label: 'Agency', value: formData.agencyName },
    { icon: Globe, label: 'URL', value: `${formData.domain}${formData.domainSuffix}` },
    { icon: Briefcase, label: 'Industry', value: getIndustryLabel() },
    { icon: Users, label: 'Team', value: getCompanySizeLabel() },
    { icon: User, label: 'Admin', value: formData.adminName },
    { icon: Mail, label: 'Email', value: formData.adminEmail },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-[-0.02em]">
          Ready to launch
        </h1>
        <p className="mt-3 text-lg text-zinc-500">
          Review your details and create your workspace.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-3"
      >
        {reviewItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-600">{item.label}</p>
                <p className="text-sm text-white truncate">{item.value}</p>
              </div>
              <Check className="w-4 h-4 text-emerald-500/60 flex-shrink-0" />
            </motion.div>
          );
        })}
      </motion.div>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-8"
        >
          <div className="relative">
            <div className="w-12 h-12 border-2 border-zinc-800 rounded-full" />
            <div className="absolute inset-0 w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-sm text-zinc-500">Creating your workspace...</p>
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xs text-zinc-600 text-center"
      >
        By continuing, you agree to our Terms and Privacy Policy.
      </motion.p>
    </div>
  );
}
