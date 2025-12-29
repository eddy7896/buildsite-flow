import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { OnboardingFormData } from '../fragments/types';
import { cn } from '@/lib/utils';

interface StepAdminProps {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
  setCanProceed: (can: boolean) => void;
}

export default function StepAdmin({ formData, updateFormData, setCanProceed }: StepAdminProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validation = useMemo(() => {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail);
    const passwordLength = formData.adminPassword.length >= 8;
    const passwordHasNumber = /\d/.test(formData.adminPassword);
    const passwordHasLetter = /[a-zA-Z]/.test(formData.adminPassword);
    const passwordsMatch = formData.adminPassword === formData.confirmPassword && formData.confirmPassword.length > 0;

    return {
      name: formData.adminName.trim().length >= 2,
      email: emailValid,
      passwordLength,
      passwordHasNumber,
      passwordHasLetter,
      passwordValid: passwordLength && passwordHasNumber && passwordHasLetter,
      passwordsMatch,
    };
  }, [formData.adminName, formData.adminEmail, formData.adminPassword, formData.confirmPassword]);

  useEffect(() => {
    setCanProceed(!!(
      validation.name &&
      validation.email &&
      validation.passwordValid &&
      validation.passwordsMatch
    ));
  }, [validation, setCanProceed]);

  const inputClass = cn(
    "w-full h-12 px-4 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white",
    "placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.05]",
    "transition-all duration-200"
  );

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-[-0.02em]">
          Create your account
        </h1>
        <p className="mt-3 text-lg text-zinc-500">
          Set up your Super Admin credentials.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-5"
      >
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Full Name</label>
          <input
            value={formData.adminName}
            onChange={(e) => updateFormData({ adminName: e.target.value })}
            placeholder="John Smith"
            className={inputClass}
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Email</label>
          <input
            type="email"
            value={formData.adminEmail}
            onChange={(e) => updateFormData({ adminEmail: e.target.value })}
            placeholder="john@company.com"
            className={inputClass}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.adminPassword}
              onChange={(e) => updateFormData({ adminPassword: e.target.value })}
              placeholder="Create a password"
              className={cn(inputClass, "pr-12")}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {formData.adminPassword && (
            <div className="flex gap-4 text-xs pt-1">
              <span className={validation.passwordLength ? "text-emerald-400" : "text-zinc-600"}>
                8+ chars
              </span>
              <span className={validation.passwordHasLetter ? "text-emerald-400" : "text-zinc-600"}>
                Letters
              </span>
              <span className={validation.passwordHasNumber ? "text-emerald-400" : "text-zinc-600"}>
                Numbers
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
              placeholder="Confirm password"
              className={cn(
                inputClass, 
                "pr-12",
                formData.confirmPassword && !validation.passwordsMatch && "border-red-500/30"
              )}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {formData.confirmPassword && (
            <p className={cn(
              "text-xs flex items-center gap-1",
              validation.passwordsMatch ? "text-emerald-400" : "text-red-400"
            )}>
              {validation.passwordsMatch ? (
                <><Check className="w-3 h-3" /> Passwords match</>
              ) : (
                <><X className="w-3 h-3" /> Passwords don't match</>
              )}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
