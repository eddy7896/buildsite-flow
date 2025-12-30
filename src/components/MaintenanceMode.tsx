/**
 * Maintenance Mode Component
 * Displays maintenance message when system is in maintenance mode
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MaintenanceModeProps {
  message?: string;
}

export function MaintenanceMode({ message }: MaintenanceModeProps) {
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <CardTitle>System Maintenance</CardTitle>
          </div>
          <CardDescription>
            The system is currently under maintenance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {message || "We're currently performing scheduled maintenance to improve your experience. Please check back soon."}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRetry}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            We apologize for any inconvenience
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

