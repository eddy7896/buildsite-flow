/**
 * Dynamic Onboarding Wizard
 * Modular onboarding wizard with dynamic page selection based on agency characteristics
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getApiBaseUrl } from '@/config/api';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

// Step components
import Step1AgencyEssentials from './steps/Step1AgencyEssentials';
import Step2ProfileFocus from './steps/Step2ProfileFocus';
import Step3ContactDetails from './steps/Step3ContactDetails';
import Step4BusinessGoals from './steps/Step4BusinessGoals';
import Step5PageSelection from './steps/Step5PageSelection';
import Step6PricingReview from './steps/Step6PricingReview';
import Step7AdminAccount from './steps/Step7AdminAccount';
import Step8Review from './steps/Step8Review';

import { useOnboardingState } from './hooks/useOnboardingState';

const STEPS = [
  { id: 1, title: 'Agency Essentials', component: Step1AgencyEssentials },
  { id: 2, title: 'Profile & Focus', component: Step2ProfileFocus },
  { id: 3, title: 'Contact Details', component: Step3ContactDetails },
  { id: 4, title: 'Business Goals', component: Step4BusinessGoals },
  { id: 5, title: 'Page Selection', component: Step5PageSelection },
  { id: 6, title: 'Pricing Review', component: Step6PricingReview },
  { id: 7, title: 'Admin Account', component: Step7AdminAccount },
  { id: 8, title: 'Review & Activate', component: Step8Review },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const {
    formData,
    updateFormData,
    selectedPages,
    setSelectedPages,
    recommendations,
    setRecommendations
  } = useOnboardingState();

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('agency_onboarding_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        updateFormData(parsed.formData || {});
        setCurrentStep(parsed.currentStep || 1);
        setCompletedSteps(parsed.completedSteps || []);
        if (parsed.selectedPages) {
          setSelectedPages(parsed.selectedPages);
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  // Save draft to localStorage
  useEffect(() => {
    const draft = {
      formData,
      currentStep,
      completedSteps,
      selectedPages
    };
    localStorage.setItem('agency_onboarding_draft', JSON.stringify(draft));
  }, [formData, currentStep, completedSteps, selectedPages]);

  const handleNext = useCallback(() => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, completedSteps]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/agencies/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agencyName: formData.agencyName,
          domain: `${formData.domain}${formData.domainSuffix}`,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          subscriptionPlan: formData.subscriptionPlan || 'professional',
          phone: formData.phone,
          address: formData.address,
          industry: formData.industry,
          companySize: formData.companySize,
          primaryFocus: formData.primaryFocus,
          enableGST: formData.enableGST,
          business_goals: formData.businessGoals || [],
          page_ids: selectedPages.map(p => p.id)
        }),
      });

      let result;
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (isJson) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = text ? { error: text } : { error: `Server error: ${response.status}` };
      }

      if (!response.ok) {
        const errorMessage = result.error || result.message || `Server error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      if (!result.success) {
        throw new Error(result.error || result.message || 'Failed to create agency');
      }

      // Clear draft
      localStorage.removeItem('agency_onboarding_draft');
      
      // Sign in the admin user
      await signIn(formData.adminEmail, formData.adminPassword);
      
      toast({
        title: 'Success!',
        description: result.message || 'Your agency has been created successfully.',
      });
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Agency creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create agency. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, selectedPages, signIn, navigate, toast]);

  const CurrentStepComponent = STEPS.find(s => s.id === currentStep)?.component || Step1AgencyEssentials;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Progress Bar */}
      <div className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Step {currentStep} of {STEPS.length}
            </div>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {Math.round(progress)}% Complete
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Step Navigation */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                        currentStep > step.id
                          ? 'bg-green-500 text-white'
                          : currentStep === step.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="mt-2 text-xs text-center text-slate-600 dark:text-slate-400 max-w-[80px]">
                      {step.title}
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        currentStep > step.id
                          ? 'bg-green-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
            <CurrentStepComponent
              formData={formData}
              updateFormData={updateFormData}
              selectedPages={selectedPages}
              setSelectedPages={setSelectedPages}
              recommendations={recommendations}
              setRecommendations={setRecommendations}
              onNext={handleNext}
              onBack={handleBack}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} disabled={isLoading}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Creating Agency...' : 'Create Agency'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

