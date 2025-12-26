/**
 * Service Unavailable / 404 Error Page
 * Shows friendly error page with early-man.gif when services are down
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Home, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ServiceUnavailableProps {
  title?: string;
  description?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export function ServiceUnavailable({
  title = 'Service Temporarily Unavailable',
  description = 'Our servers are taking a quick break. The early man is working hard to get things back up and running!',
  showRetry = true,
  onRetry
}: ServiceUnavailableProps) {
  // useNavigate will work if component is inside Router, otherwise we'll use window.location
  const navigate = useNavigate();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    try {
      navigate('/');
    } catch {
      // Fallback if navigate fails (not in Router context)
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-6">
            <img 
              src="/early-man.gif" 
              alt="Early man working on connections" 
              className="w-64 h-64 object-contain"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800 mb-2">
            {title}
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            {description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <WifiOff className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">What happened?</p>
                <p className="text-blue-700">
                  The backend services (Docker containers) are currently down or restarting. 
                  This usually happens during maintenance or deployment. Don't worry, we're working on it!
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {showRetry && (
              <Button 
                onClick={handleRetry} 
                className="flex-1"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button 
              onClick={handleGoHome} 
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            <p>If this problem persists, please contact support or try again in a few minutes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

