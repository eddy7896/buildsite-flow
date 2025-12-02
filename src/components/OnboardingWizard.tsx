import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Sparkles, Users, Building2, FileText, BarChart3, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/database';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  optional?: boolean;
}

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingWizard = ({ onComplete, onSkip }: OnboardingWizardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [demoDataGenerated, setDemoDataGenerated] = useState(false);

  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'Welcome to BuildFlow',
      description: 'Get familiar with your new agency management platform',
      icon: Building2,
      completed: false
    },
    {
      id: 'demo-data',
      title: 'Generate Demo Data',
      description: 'Create sample clients, projects, and leads to explore the platform',
      icon: Sparkles,
      completed: false,
      optional: true
    },
    {
      id: 'team-setup',
      title: 'Add Team Members',
      description: 'Invite your team and assign roles for collaboration',
      icon: Users,
      completed: false,
      optional: true
    },
    {
      id: 'customize',
      title: 'Customize Settings',
      description: 'Configure your agency preferences and branding',
      icon: Settings,
      completed: false,
      optional: true
    },
    {
      id: 'explore',
      title: 'Explore Features',
      description: 'Take a tour of key features like CRM, project management, and reporting',
      icon: BarChart3,
      completed: false
    }
  ]);

  const progress = ((steps.filter(step => step.completed).length) / steps.length) * 100;

  const markStepCompleted = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  const generateDemoData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user's agency ID
      const { data: profile } = await db
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.agency_id) {
        throw new Error('Agency not found');
      }

      const { data, error } = await db.functions.invoke('generate-demo-data', {
        body: { agencyId: profile.agency_id }
      });

      if (error) throw error;

      setDemoDataGenerated(true);
      markStepCompleted('demo-data');

      toast({
        title: "Demo data generated!",
        description: `Created ${data.summary.clients} clients, ${data.summary.jobs} projects, ${data.summary.leads} leads, and more.`,
      });
    } catch (error: any) {
      console.error('Error generating demo data:', error);
      toast({
        title: "Error generating demo data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Mark current step as completed when moving to next (except for optional steps)
      if (!steps[currentStep].optional) {
        markStepCompleted(steps[currentStep].id);
      }
      setCurrentStep(currentStep + 1);
    } else {
      // Mark final step as completed
      markStepCompleted(steps[currentStep].id);
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipStep = () => {
    markStepCompleted(steps[currentStep].id);
    handleNext();
  };

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Welcome to BuildFlow!</h3>
            <p className="text-muted-foreground">
              BuildFlow is your all-in-one agency management platform. Manage clients, projects, 
              team members, finances, and more from a single dashboard.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                <h4 className="font-medium">Team Management</h4>
                <p className="text-sm text-muted-foreground">Organize your team and assign roles</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                <h4 className="font-medium">Project Tracking</h4>
                <p className="text-sm text-muted-foreground">Track projects from start to finish</p>
              </div>
            </div>
          </div>
        );

      case 'demo-data':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Generate Demo Data</h3>
            <p className="text-muted-foreground">
              We can create sample data to help you explore BuildFlow's features. 
              This includes clients, projects, leads, and more.
            </p>
            {demoDataGenerated ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium">Demo data generated successfully!</p>
                <p className="text-green-700 text-sm">You can now explore the platform with sample data.</p>
              </div>
            ) : (
              <Button onClick={generateDemoData} disabled={loading} className="w-full">
                {loading ? 'Generating...' : 'Generate Demo Data'}
              </Button>
            )}
          </div>
        );

      case 'team-setup':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Add Team Members</h3>
            <p className="text-muted-foreground">
              Invite your team members and assign them appropriate roles. You can do this later 
              from the Agency Management section.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-medium">Available Roles:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">Admin</Badge>
                <Badge variant="outline">HR</Badge>
                <Badge variant="outline">Finance Manager</Badge>
                <Badge variant="outline">Employee</Badge>
              </div>
            </div>
          </div>
        );

      case 'customize':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Settings className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Customize Your Agency</h3>
            <p className="text-muted-foreground">
              Personalize your agency settings including branding, currency preferences, 
              and other configurations from the Agency Management dashboard.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-800 font-medium">You can customize:</p>
              <ul className="text-purple-700 text-sm mt-2 space-y-1">
                <li>• Agency name and logo</li>
                <li>• Default currency</li>
                <li>• Domain settings</li>
                <li>• Notification preferences</li>
              </ul>
            </div>
          </div>
        );

      case 'explore':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Explore BuildFlow</h3>
            <p className="text-muted-foreground">
              You're all set! Start exploring BuildFlow's powerful features to manage 
              your agency more efficiently.
            </p>
            <div className="grid grid-cols-1 gap-3 mt-6">
              <div className="flex items-center p-3 bg-muted/30 rounded-lg">
                <Building2 className="h-5 w-5 text-primary mr-3" />
                <div className="text-left">
                  <h4 className="font-medium">CRM & Lead Management</h4>
                  <p className="text-sm text-muted-foreground">Track leads and manage client relationships</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-muted/30 rounded-lg">
                <FileText className="h-5 w-5 text-primary mr-3" />
                <div className="text-left">
                  <h4 className="font-medium">Project Management</h4>
                  <p className="text-sm text-muted-foreground">Plan, execute, and track project progress</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-muted/30 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary mr-3" />
                <div className="text-left">
                  <h4 className="font-medium">Financial Management</h4>
                  <p className="text-sm text-muted-foreground">Handle invoices, payments, and reporting</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <StepIcon className="h-5 w-5" />
                Agency Setup
              </CardTitle>
              <CardDescription>
                Step {currentStep + 1} of {steps.length}: {currentStepData.title}
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onSkip}>
              Skip Setup
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step Indicators */}
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  {step.completed ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : index === currentStep ? (
                    <Circle className="h-6 w-6 text-primary fill-primary/20" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                  {index < steps.length - 1 && (
                    <div className="w-8 h-px bg-muted-foreground/30 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[300px] flex items-center">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStepData.optional && !currentStepData.completed && (
                <Button variant="ghost" onClick={handleSkipStep}>
                  Skip
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
                {currentStep < steps.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingWizard;