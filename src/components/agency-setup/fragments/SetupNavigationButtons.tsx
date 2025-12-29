import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { SETUP_STEPS } from './types';

interface SetupNavigationButtonsProps {
  currentStep: number;
  isLoading: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
  isMobile?: boolean;
}

export function SetupNavigationButtons({
  currentStep,
  isLoading,
  onBack,
  onNext,
  onComplete,
  isMobile = false
}: SetupNavigationButtonsProps) {
  const totalSteps = SETUP_STEPS.length;

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg safe-area-inset-bottom">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={currentStep === 1 || isLoading}
              size="default"
              className="flex-1 max-w-[120px] border-slate-300 dark:border-slate-700"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              <span className="text-sm">Back</span>
            </Button>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 px-2">
              <span className="font-medium">{currentStep}</span>
              <span>/</span>
              <span>{totalSteps}</span>
            </div>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={onNext}
                disabled={isLoading}
                size="default"
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium"
              >
                <span className="text-sm">Continue</span>
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onComplete}
                disabled={isLoading}
                size="default"
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    <span className="text-sm">Completing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    <span className="text-sm">Complete Setup</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex justify-between items-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={currentStep === 1 || isLoading}
        size="lg"
        className="border-slate-300 dark:border-slate-700"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <span>Step {currentStep} of {totalSteps}</span>
      </div>

      {currentStep < totalSteps ? (
        <Button
          type="button"
          onClick={onNext}
          disabled={isLoading}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-white"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onComplete}
          disabled={isLoading}
          size="lg"
          className="min-w-[160px] bg-primary hover:bg-primary/90 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete Setup
            </>
          )}
        </Button>
      )}
    </div>
  );
}
