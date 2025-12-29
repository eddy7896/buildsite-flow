import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { OnboardingFormData, INDUSTRIES, COMPANY_SIZES } from '../fragments/types';
import { cn } from '@/lib/utils';

interface StepBusinessProps {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
  setCanProceed: (can: boolean) => void;
}

export default function StepBusiness({ formData, updateFormData, setCanProceed }: StepBusinessProps) {
  useEffect(() => {
    setCanProceed(!!(formData.industry && formData.companySize));
  }, [formData.industry, formData.companySize, setCanProceed]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-[-0.02em]">
          Tell us about your business
        </h1>
        <p className="mt-3 text-lg text-zinc-500">
          This helps us customize your workspace experience.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-6"
      >
        <div className="space-y-3">
          <label className="text-sm text-zinc-400">Industry</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {INDUSTRIES.map((industry) => {
              const Icon = industry.icon;
              return (
                <button
                  key={industry.value}
                  type="button"
                  onClick={() => updateFormData({ industry: industry.value })}
                  className={cn(
                    "p-3 rounded-lg border text-center transition-all duration-200",
                    formData.industry === industry.value
                      ? "bg-white/[0.08] border-white/[0.2] text-white"
                      : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/[0.12] hover:text-zinc-300"
                  )}
                >
                  <span className="text-xl block mb-1">
                    <Icon className="w-5 h-5 mx-auto" />
                  </span>
                  <span className="text-xs">{industry.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm text-zinc-400">Team Size</label>
          <div className="grid grid-cols-5 gap-2">
            {COMPANY_SIZES.map((size) => {
              const Icon = size.icon;
              return (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => updateFormData({ companySize: size.value })}
                  className={cn(
                    "p-3 rounded-lg border text-center transition-all duration-200",
                    formData.companySize === size.value
                      ? "bg-white/[0.08] border-white/[0.2] text-white"
                      : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/[0.12] hover:text-zinc-300"
                  )}
                >
                  <span className="text-lg block mb-1">
                    <Icon className="w-5 h-5 mx-auto" />
                  </span>
                  <span className="text-xs block">{size.label}</span>
                  <span className="text-[10px] text-zinc-600">{size.employees}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {formData.industry && formData.companySize && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
        >
          <p className="text-sm text-emerald-400/80">
            We'll optimize your workspace for {INDUSTRIES.find(i => i.value === formData.industry)?.label.toLowerCase()} teams.
          </p>
        </motion.div>
      )}
    </div>
  );
}
