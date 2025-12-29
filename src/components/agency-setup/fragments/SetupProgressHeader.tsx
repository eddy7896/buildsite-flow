import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';
import { SETUP_STEPS } from './types';

interface SetupProgressHeaderProps {
  currentStep: number;
}

export function SetupProgressHeader({ currentStep }: SetupProgressHeaderProps) {
  const progress = (currentStep / SETUP_STEPS.length) * 100;
  const CurrentStepIcon = SETUP_STEPS[currentStep - 1]?.icon;

  return (
    <Card className="mb-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-4 md:px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              {CurrentStepIcon && <CurrentStepIcon className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white">
                {SETUP_STEPS[currentStep - 1]?.title}
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                {SETUP_STEPS[currentStep - 1]?.description}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
            Step {currentStep} of {SETUP_STEPS.length}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Overall Progress</span>
            <span className="font-semibold text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between pt-2">
            {SETUP_STEPS.map((step, idx) => {
              const isCompleted = idx + 1 < currentStep;
              const isCurrent = idx + 1 === currentStep;
              const StepIcon = step.icon;
              
              return (
                <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-primary text-white'
                      : isCurrent
                      ? 'bg-primary text-white ring-2 ring-primary/30'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium text-center hidden sm:block max-w-[60px] ${
                    isCurrent ? 'text-primary' : isCompleted ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'
                  }`}>
                    {step.title.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
