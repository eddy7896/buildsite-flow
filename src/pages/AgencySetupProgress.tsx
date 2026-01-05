import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAgencySettings } from '@/hooks/useAgencySettings';
import { getApiBaseUrl } from '@/config/api';
import { getAgencyDatabase } from '@/utils/authContext';
import {
  Loader2,
  Building2,
  Users,
  Settings,
  CheckCircle2,
  ArrowRight,
  FileText,
  DollarSign,
  Briefcase,
  Sparkles,
  Rocket,
  Calendar,
  AlertCircle,
  Zap,
  Target,
} from 'lucide-react';

const SETUP_STEPS = [
  { id: 1, title: 'Company Profile', icon: Building2, description: 'Basic company information and branding' },
  { id: 2, title: 'Business Details', icon: FileText, description: 'Legal and tax information' },
  { id: 3, title: 'Departments', icon: Briefcase, description: 'Organizational structure' },
  { id: 4, title: 'Financial Setup', icon: DollarSign, description: 'Currency, payment, and billing' },
  { id: 5, title: 'Team Members', icon: Users, description: 'Add your team' },
  { id: 6, title: 'Preferences', icon: Settings, description: 'System preferences' },
  { id: 7, title: 'Review', icon: CheckCircle2, description: 'Review and complete' },
];

interface SetupProgress {
  setupComplete: boolean;
  progress: number;
  completedSteps: string[];
  totalSteps: number;
  lastUpdated: string | null;
  agencyName?: string;
}

// Helper function to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Animated Progress Circle Component
const ProgressCircle = ({ 
  progress, 
  size = 200, 
  primaryColor = '#3b82f6' 
}: { 
  progress: number; 
  size?: number;
  primaryColor?: string;
}) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          className="text-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={primaryColor}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="text-5xl font-bold"
          style={{ color: primaryColor }}
        >
          {Math.round(progress)}%
        </motion.div>
        <div className="text-sm text-muted-foreground mt-1">Complete</div>
      </div>
    </div>
  );
};

// Grid Pattern Background
const GridPattern = () => (
  <div className="absolute inset-0 -z-10">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 dark:opacity-10" />
  </div>
);

// Glow Orb Component - Subtle and professional
const GlowOrb = ({ 
  color, 
  size, 
  position,
  primaryColor 
}: { 
  color: string; 
  size: string; 
  position: { top?: string; bottom?: string; left?: string; right?: string };
  primaryColor?: string;
}) => {
  const sizeClasses = {
    sm: 'w-[200px] h-[200px]',
    md: 'w-[400px] h-[400px]',
    lg: 'w-[500px] h-[500px]',
    xl: 'w-[800px] h-[800px]',
  };

  const rgb = primaryColor ? hexToRgb(primaryColor) : null;
  const bgColor = rgb 
    ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.03)` 
    : 'rgba(59, 130, 246, 0.03)';

  return (
    <div
      className={`absolute ${sizeClasses[size as keyof typeof sizeClasses]} rounded-full blur-3xl -z-10 hidden lg:block`}
      style={{ 
        ...position,
        backgroundColor: bgColor,
      }}
    />
  );
};

export default function AgencySetupProgress() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole } = useAuth();
  const { settings: agencySettings } = useAgencySettings();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<SetupProgress | null>(null);

  // Get agency colors with fallback to defaults
  const primaryColor = agencySettings?.primary_color || '#3b82f6';
  const secondaryColor = agencySettings?.secondary_color || '#1e40af';

  // Redirect super admins immediately
  useEffect(() => {
    if (userRole === 'super_admin') {
      navigate('/system', { replace: true });
      return;
    }
  }, [userRole, navigate]);

  useEffect(() => {
    // Don't fetch if super admin (will be redirected)
    if (userRole === 'super_admin') {
      return;
    }
    
    const fetchProgress = async () => {
      try {
        const agencyDatabase = getAgencyDatabase();
        if (!agencyDatabase) {
          navigate('/dashboard');
          return;
        }

        const apiBaseUrl = getApiBaseUrl();
        
        const response = await fetch(`${apiBaseUrl}/api/agencies/check-setup?database=${encodeURIComponent(agencyDatabase)}&detailed=true`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'X-Agency-Database': agencyDatabase || '',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Ensure data has required structure with defaults
          const normalizedData: SetupProgress = {
            setupComplete: data.setupComplete || false,
            progress: data.progress || 0,
            completedSteps: Array.isArray(data.completedSteps) ? data.completedSteps : [],
            totalSteps: data.totalSteps || 7,
            lastUpdated: data.lastUpdated || null,
            agencyName: data.agencyName || '',
          };
          setProgressData(normalizedData);
          
          // If setup is complete, redirect to dashboard
          if (normalizedData.setupComplete) {
            toast({
              title: 'Setup Complete!',
              description: 'Your agency setup is already complete.',
            });
            setTimeout(() => navigate('/dashboard'), 2000);
          }
        } else {
          throw new Error('Failed to fetch progress');
        }
      } catch (error: any) {
        console.error('Error fetching setup progress:', error);
        toast({
          title: 'Error',
          description: 'Failed to load setup progress. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [navigate, toast, userRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading setup progress...</p>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Progress</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't load your setup progress. Please try again.
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Safely destructure with defaults to prevent undefined errors
  const { 
    progress = 0, 
    completedSteps = [], 
    totalSteps = 7, 
    lastUpdated = null, 
    agencyName = '', 
    setupComplete = false 
  } = progressData || {};

  const remainingSteps = totalSteps - completedSteps.length;
  const rgb = hexToRgb(primaryColor);
  const primaryColorRgba = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` : 'rgba(59, 130, 246, 0.1)';
  const primaryColorRgbaHover = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` : 'rgba(59, 130, 246, 0.15)';

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <GridPattern />
      <GlowOrb color="primary" size="xl" position={{ top: '-10%', left: '10%' }} primaryColor={primaryColor} />
      <GlowOrb color="primary" size="lg" position={{ bottom: '10%', right: '10%' }} primaryColor={primaryColor} />
      <GlowOrb color="primary" size="md" position={{ top: '50%', left: '50%' }} primaryColor={primaryColor} />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-muted border border-border text-xs sm:text-sm font-medium mb-4 sm:mb-6"
            style={{ 
              backgroundColor: primaryColorRgba,
              borderColor: `${primaryColor}40`,
            }}
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: primaryColor }} />
            <span>Welcome to {agencyName || 'your agency'}</span>
          </motion.div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1] mb-4 sm:mb-6 px-2">
            <span className="block">Let's get your agency</span>
            <span className="block" style={{ color: primaryColor }}>
              up and running
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
            Complete your setup in just a few steps and unlock the full power of your agency management platform.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1fr,380px] xl:grid-cols-[1fr,400px]">
          {/* Left Column - Progress Circle & Steps */}
          <div className="space-y-6 lg:space-y-8">
            {/* Progress Circle Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Card className="border">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col md:flex-row items-center gap-6 lg:gap-8">
                    <div className="flex-shrink-0">
                      <div className="w-[160px] h-[160px] sm:w-[180px] sm:h-[180px] md:w-[200px] md:h-[200px] mx-auto">
                        <ProgressCircle progress={progress} size={200} primaryColor={primaryColor} />
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left w-full">
                      <div className="flex items-center gap-2 mb-3 sm:mb-4 justify-center md:justify-start">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: primaryColor }} />
                        <h2 className="text-xl sm:text-2xl font-bold">Overall Progress</h2>
                      </div>
                      <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                        {setupComplete
                          ? '🎉 Congratulations! Your agency setup is complete. You can now access all features.'
                          : `You've completed ${completedSteps.length} of ${totalSteps} steps. ${remainingSteps} more to go!`}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        <Badge variant="outline" className="text-xs sm:text-sm" style={{ 
                          backgroundColor: primaryColorRgba,
                          borderColor: `${primaryColor}40`,
                          color: primaryColor,
                        }}>
                          {completedSteps.length} Completed
                        </Badge>
                        <Badge variant="outline" className="text-xs sm:text-sm">
                          {remainingSteps} Remaining
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Setup Steps Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: primaryColor }} />
                <h2 className="text-xl sm:text-2xl font-bold">Setup Checklist</h2>
              </div>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <AnimatePresence>
                  {SETUP_STEPS.map((step, index) => {
                    const isCompleted = completedSteps.includes(step.title);
                    const StepIcon = step.icon;

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index, duration: 0.4 }}
                        whileHover={{ 
                          y: -2,
                          transition: { duration: 0.2 }
                        }}
                        className="h-full"
                      >
                        <Card 
                          className={`border h-full transition-all duration-200 ${
                            isCompleted
                              ? 'border-primary/30'
                              : 'hover:border-primary/20'
                          } cursor-pointer`}
                          style={{
                            backgroundColor: isCompleted ? primaryColorRgba : undefined,
                          }}
                          onMouseEnter={(e) => {
                            if (!isCompleted) {
                              e.currentTarget.style.backgroundColor = primaryColorRgbaHover;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isCompleted) {
                              e.currentTarget.style.backgroundColor = '';
                            }
                          }}
                        >
                          <CardContent className="p-4 sm:p-5 lg:p-6 h-full flex flex-col">
                            <div className="flex items-start gap-3 sm:gap-4 flex-1">
                              <div 
                                className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center transition-all duration-200"
                                style={{
                                  backgroundColor: isCompleted ? primaryColor : 'transparent',
                                  border: `2px solid ${isCompleted ? primaryColor : 'hsl(var(--border))'}`,
                                }}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                ) : (
                                  <StepIcon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <h3 className="font-semibold text-sm sm:text-base leading-tight">
                                    {step.title}
                                  </h3>
                                  {isCompleted && (
                                    <Badge 
                                      variant="outline" 
                                      className="text-[10px] px-1.5 py-0 flex-shrink-0"
                                      style={{
                                        backgroundColor: primaryColorRgba,
                                        borderColor: `${primaryColor}40`,
                                        color: primaryColor,
                                      }}
                                    >
                                      Done
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 flex-1">
                                  {step.description}
                                </p>
                                <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                                  Step {index + 1} of {totalSteps}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Status & Actions */}
          <div className="space-y-4 sm:space-y-6">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Card className="border">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4 sm:mb-6">
                    <Rocket className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: primaryColor }} />
                    <h3 className="text-lg sm:text-xl font-bold">Status & Actions</h3>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Setup Status */}
                    <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted border">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Setup Status</p>
                        <p className="text-base sm:text-lg font-semibold">
                          {setupComplete ? 'Complete' : 'In Progress'}
                        </p>
                      </div>
                      <Badge 
                        variant="outline"
                        className="text-xs sm:text-sm"
                        style={{
                          backgroundColor: setupComplete ? primaryColorRgba : 'hsl(var(--muted))',
                          borderColor: setupComplete ? `${primaryColor}40` : 'hsl(var(--border))',
                          color: setupComplete ? primaryColor : 'hsl(var(--muted-foreground))',
                        }}
                      >
                        {setupComplete ? 'Ready' : 'Active'}
                      </Badge>
                    </div>

                    {/* Last Updated */}
                    {lastUpdated && (
                      <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-muted border">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Last Updated</p>
                          <p className="text-xs sm:text-sm font-medium truncate">
                            {new Date(lastUpdated).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-4">
                      <Button
                        onClick={() => navigate('/dashboard')}
                        variant="outline"
                        className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium transition-all duration-200 hover:bg-accent hover:border-primary/30"
                      >
                        Go to Dashboard
                      </Button>
                      {!setupComplete && (
                        <Button
                          onClick={() => navigate('/agency-setup')}
                          className="group w-full h-11 sm:h-12 text-sm sm:text-base font-medium transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                          style={{
                            backgroundColor: primaryColor,
                            color: 'white',
                          }}
                        >
                          Continue Setup
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Completion Message */}
            {setupComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Card className="border" style={{ borderColor: `${primaryColor}40` }}>
                  <CardContent className="p-4 sm:p-6" style={{ backgroundColor: primaryColorRgba }}>
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div 
                        className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold mb-2">Setup Complete! 🎉</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                          Your agency has been fully configured. You can now access all features and start managing your operations.
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          You can adjust settings anytime from the{' '}
                          <button
                            onClick={() => navigate('/settings')}
                            className="underline font-medium transition-colors hover:opacity-80"
                            style={{ color: primaryColor }}
                          >
                            Settings
                          </button>{' '}
                          area.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
