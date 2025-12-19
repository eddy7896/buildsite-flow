import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Building, ArrowLeft, Mail, Loader2, CheckCircle2, KeyRound
} from 'lucide-react';

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setIsSubmitted(true);
    
    toast({
      title: "Reset link sent",
      description: "If an account exists with this email, you'll receive a password reset link.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full filter blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-blue-600/10 rounded-full filter blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Building className="h-6 w-6 text-white" />
            </div>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">
            Build<span className="text-emerald-400">Flow</span>
          </h1>
        </div>

        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-2">
            {!isSubmitted ? (
              <>
                <div className="w-14 h-14 rounded-xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="h-7 w-7 text-emerald-400" />
                </div>
                <CardTitle className="text-xl text-white">Forgot Password?</CardTitle>
                <CardDescription className="text-slate-400">
                  No worries! Enter your email and we'll send you a reset link.
                </CardDescription>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                </div>
                <CardTitle className="text-xl text-white">Check Your Email</CardTitle>
                <CardDescription className="text-slate-400">
                  We've sent a password reset link to your email address.
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent className="pt-6">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert className="border-red-500/30 bg-red-500/10">
                    <AlertDescription className="text-red-300 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      className="pl-10 h-11 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-5">
                <Alert className="border-emerald-500/30 bg-emerald-500/10">
                  <AlertDescription className="text-emerald-200 text-sm">
                    If an account exists for <strong>{email}</strong>, you'll receive an email with instructions to reset your password.
                  </AlertDescription>
                </Alert>
                
                <div className="text-center space-y-3">
                  <p className="text-sm text-slate-400">
                    Didn't receive the email? Check your spam folder or
                  </p>
                  <Button 
                    variant="outline" 
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail('');
                    }}
                  >
                    Try again with a different email
                  </Button>
                </div>
              </div>
            )}

            {/* Back to Sign In */}
            <div className="mt-6 text-center">
              <Link 
                to="/auth" 
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-600">
            Need help?{' '}
            <a href="mailto:support@buildflow.com" className="text-slate-400 hover:text-emerald-400">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

