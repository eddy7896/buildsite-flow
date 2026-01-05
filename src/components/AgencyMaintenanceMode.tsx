/**
 * Agency Maintenance Mode Display Component
 * Shows maintenance message to agency users when maintenance mode is enabled
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

interface AgencyMaintenanceModeProps {
  message?: string | null;
}

export function AgencyMaintenanceMode({ message }: AgencyMaintenanceModeProps) {
  const defaultMessage = 'This agency is currently under maintenance. Please check back later.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900 p-4">
              <Wrench className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Maintenance Mode</CardTitle>
          <CardDescription>
            We're currently performing scheduled maintenance
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            {message || defaultMessage}
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            We apologize for any inconvenience. Please check back soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

