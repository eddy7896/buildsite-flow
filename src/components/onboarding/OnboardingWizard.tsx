import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getApiBaseUrl } from '@/config/api';
import { logError } from '@/utils/consoleLogger';
import { cn } from '@/lib/utils';

import { GridPattern } from '@/components/landing/fragments/Backgrounds';
import { OnboardingFormData, initialFormData, ONBOARDING_STEPS } from './fragments/types';
import StepIdentity from './steps/StepIdentity';
import StepBusiness from './steps/StepBusiness';
import StepAdmin from './steps/StepAdmin';
import StepLaunch from './steps/StepLaunch';

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [formData, setFormData] = useState<OnboardingFormData>(initialFormData);

  useEffect(() => {
    const savedDraft = localStorage.getItem('onboarding_draft_v2');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(prev => ({ ...prev, ...parsed.formData }));
        setCurrentStep(parsed.currentStep || 1);
      } catch (error) {
        logError('Error loading draft:', error);
      }
    }
  }, []);

  useEffect(() => {
    const draft = { formData, currentStep };
    localStorage.setItem('onboarding_draft_v2', JSON.stringify(draft));
  }, [formData, currentStep]);

  const updateFormData = useCallback((updates: Partial<OnboardingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length && canProceed) {
      setDirection('forward');
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, canProceed]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setDirection('backward');
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/agencies/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyName: formData.agencyName,
          domain: `${formData.domain}${formData.domainSuffix}`,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          industry: formData.industry,
          companySize: formData.companySize,
          primaryFocus: formData.primaryFocus,
          country: formData.country,
          timezone: formData.timezone,
          enableGST: formData.enableGST,
          subscriptionPlan: formData.subscriptionPlan,
        }),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const result = isJson ? await response.json() : { error: await response.text() };

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Failed to create agency');
      }

      localStorage.removeItem('onboarding_draft_v2');
      await signIn(formData.adminEmail, formData.adminPassword);

      toast({
        title: 'Welcome aboard!',
        description: 'Your agency workspace is ready.',
      });

      // Redirect agency admins to agency dashboard, not general dashboard
      navigate('/agency');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create agency. Please try again.';
      logError('Agency creation error:', error);
      toast({
        title: 'Something went wrong',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, signIn, navigate, toast]);

  const slideVariants = {
    enter: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? -40 : 40,
      opacity: 0,
    }),
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepIdentity
            formData={formData}
            updateFormData={updateFormData}
            setCanProceed={setCanProceed}
          />
        );
      case 2:
        return (
          <StepBusiness
            formData={formData}
            updateFormData={updateFormData}
            setCanProceed={setCanProceed}
          />
        );
      case 3:
        return (
          <StepAdmin
            formData={formData}
            updateFormData={updateFormData}
            setCanProceed={setCanProceed}
          />
        );
      case 4:
        return (
          <StepLaunch
            formData={formData}
            isLoading={isLoading}
            setCanProceed={setCanProceed}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-[#000000] text-white antialiased selection:bg-blue-500/20 overflow-hidden">
      <GridPattern />

      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                localStorage.removeItem('onboarding_draft_v2');
                navigate('/');
              }}
              className="text-zinc-500 hover:text-white transition-colors text-sm flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>

            <div className="flex items-center gap-2">
              {ONBOARDING_STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                      currentStep > step.id
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : currentStep === step.id
                        ? "bg-white text-black"
                        : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                    )}
                  >
                    {currentStep > step.id ? '✓' : step.id}
                  </div>
                  {index < ONBOARDING_STEPS.length - 1 && (
                    <div
                      className={cn(
                        "w-8 h-[2px] mx-1 transition-colors duration-300",
                        currentStep > step.id ? "bg-emerald-500/30" : "bg-zinc-800"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="text-xs text-zinc-600 w-16 text-right">
              {currentStep}/{ONBOARDING_STEPS.length}
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-10 min-h-screen flex flex-col justify-center px-6 py-24">
        <div className="max-w-xl mx-auto w-full">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || isLoading}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                currentStep === 1
                  ? "text-zinc-700 cursor-not-allowed"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep < ONBOARDING_STEPS.length ? (
              <button
                onClick={handleNext}
                disabled={!canProceed || isLoading}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                  canProceed
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                )}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed || isLoading}
                className={cn(
                  "flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-medium transition-all",
                  canProceed && !isLoading
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Launch Agency
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
