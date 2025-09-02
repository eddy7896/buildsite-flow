import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  Mail, 
  ArrowRight, 
  Building,
  Users,
  Clock,
  Star,
  Zap
} from 'lucide-react';

const SignupSuccess = () => {
  const [searchParams] = useSearchParams();
  const [agencyName, setAgencyName] = useState('');
  const [agencyDomain, setAgencyDomain] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('');

  useEffect(() => {
    // Get data from URL params
    setAgencyName(searchParams.get('agencyName') || 'Your Agency');
    setAgencyDomain(searchParams.get('agencyDomain') || '');
    setEmail(searchParams.get('email') || '');
    setPlan(searchParams.get('plan') || 'selected plan');
  }, [searchParams]);

  const nextSteps = [
    {
      icon: Mail,
      title: "Check Your Email",
      description: "We've sent a verification email to confirm your account. Please check your inbox and click the verification link.",
      status: "pending"
    },
    {
      icon: Users,
      title: "Complete Your Profile",
      description: "After verification, sign in to complete your agency profile and add team members.",
      status: "upcoming"
    },
    {
      icon: Building,
      title: "Set Up Your Agency",
      description: "Configure your agency settings, upload your logo, and customize your workspace.",
      status: "upcoming"
    },
    {
      icon: Star,
      title: "Start Your Free Trial",
      description: "Begin using all premium features with your 14-day free trial - no credit card required.",
      status: "upcoming"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Building className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">BuildFlow</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4">
            Welcome to BuildFlow, {agencyName}! 🎉
          </h1>
          
          <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            Your agency account has been successfully created. You're now ready to streamline your operations and accelerate growth.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge variant="secondary" className="px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Selected
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Clock className="w-4 w-4 mr-2" />
              14-Day Free Trial Active
            </Badge>
            {agencyDomain && (
              <Badge variant="outline" className="px-4 py-2">
                <Building className="w-4 h-4 mr-2" />
                {agencyDomain}.lovable.app
              </Badge>
            )}
          </div>
        </div>

        {/* Email Verification Alert */}
        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <Mail className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Important:</strong> Please check your email at <strong>{email}</strong> and click the verification link to activate your account.
          </AlertDescription>
        </Alert>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Next Steps</CardTitle>
            <CardDescription>
              Follow these steps to get your agency up and running
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {nextSteps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    step.status === 'pending' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${
                      step.status === 'pending' ? 'text-blue-600' : 'text-foreground'
                    }`}>
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>
                  </div>
                  {step.status === 'pending' && (
                    <Badge variant="default" className="self-start">
                      Current Step
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Sign In to Your Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Contact Support
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Need help? Our support team is available 24/7 to assist you.
          </p>
        </div>

        {/* Features Preview */}
        <Card className="mt-12 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">What's Next?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Once you verify your email and sign in, you'll have access to powerful tools designed specifically for construction agencies.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Project Management</h3>
                <p className="text-sm text-muted-foreground">
                  Track projects, manage tasks, and collaborate with your team
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Team Management</h3>
                <p className="text-sm text-muted-foreground">
                  Handle HR, attendance, payroll, and employee management
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Financial Control</h3>
                <p className="text-sm text-muted-foreground">
                  Invoicing, payments, accounting, and financial reporting
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignupSuccess;