import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Globe, Check, Loader2, AlertCircle } from 'lucide-react';
import { getApiBaseUrl } from '@/config/api';
import { OnboardingFormData, DOMAIN_SUFFIXES } from '../fragments/types';
import { cn } from '@/lib/utils';

interface StepIdentityProps {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
  setCanProceed: (can: boolean) => void;
}

export default function StepIdentity({ formData, updateFormData, setCanProceed }: StepIdentityProps) {
  const [domainStatus, setDomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const checkDomainAvailability = useCallback(async (domain: string) => {
    if (!domain || domain.length < 3) {
      setDomainStatus('idle');
      return;
    }

    setDomainStatus('checking');
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/agencies/check-domain?domain=${encodeURIComponent(domain)}`
      );
      const data = await response.json();
      setDomainStatus(data.available ? 'available' : 'taken');
    } catch {
      setDomainStatus('idle');
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      checkDomainAvailability(formData.domain);
    }, 500);
    return () => clearTimeout(timeout);
  }, [formData.domain, checkDomainAvailability]);

  useEffect(() => {
    const hasValidName = formData.agencyName.trim().length >= 2;
    const hasValidDomain = formData.domain.length >= 3;
    const isDomainOk = domainStatus === 'available' || domainStatus === 'idle';
    setCanProceed(hasValidName && hasValidDomain && isDomainOk && domainStatus !== 'checking');
  }, [formData.agencyName, formData.domain, domainStatus, setCanProceed]);

  const handleNameChange = (value: string) => {
    updateFormData({ agencyName: value });
    if (!formData.domain || formData.domain === generateSlug(formData.agencyName)) {
      updateFormData({ domain: generateSlug(value) });
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30);
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-[-0.02em]">
          Name your agency
        </h1>
        <p className="mt-3 text-lg text-zinc-500">
          Choose a memorable name and claim your workspace URL.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Agency Name</label>
          <input
            value={formData.agencyName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Acme Corporation"
            className={cn(
              "w-full h-12 px-4 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white",
              "placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.05]",
              "transition-all duration-200"
            )}
            autoFocus
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Workspace URL</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={formData.domain}
                onChange={(e) => updateFormData({ 
                  domain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30) 
                })}
                placeholder="acme-corp"
                className={cn(
                  "w-full h-12 px-4 pr-10 rounded-lg bg-white/[0.03] border text-white font-mono text-sm",
                  "placeholder:text-zinc-600 focus:outline-none transition-all duration-200",
                  domainStatus === 'taken' 
                    ? "border-red-500/50 focus:border-red-500/70" 
                    : domainStatus === 'available'
                    ? "border-emerald-500/50 focus:border-emerald-500/70"
                    : "border-white/[0.08] focus:border-white/[0.15] focus:bg-white/[0.05]"
                )}
                maxLength={30}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {domainStatus === 'checking' && (
                  <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
                )}
                {domainStatus === 'available' && (
                  <Check className="w-4 h-4 text-emerald-400" />
                )}
                {domainStatus === 'taken' && (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>

            <select
              value={formData.domainSuffix}
              onChange={(e) => updateFormData({ domainSuffix: e.target.value })}
              className="h-12 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-white/[0.15] cursor-pointer"
            >
              {DOMAIN_SUFFIXES.map((suffix) => (
                <option key={suffix.value} value={suffix.value} className="bg-zinc-900">
                  {suffix.label}
                </option>
              ))}
            </select>
          </div>

          {domainStatus === 'taken' && (
            <p className="text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              This URL is taken. Try another.
            </p>
          )}
          {domainStatus === 'available' && (
            <p className="text-sm text-emerald-400 flex items-center gap-2">
              <Check className="w-3.5 h-3.5" />
              Available
            </p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center">
              <Globe className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Your workspace</p>
              <p className="text-sm font-mono text-white">
                {formData.domain || 'your-agency'}
                <span className="text-blue-400">{formData.domainSuffix}</span>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
