import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, CheckCircle, AlertCircle } from 'lucide-react';

export const CreateDemoUsers = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const createDemoUsers = async () => {
    setLoading(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('create-demo-users');

      if (error) throw error;

      setResults(data.results || []);
      
      toast({
        title: "Demo Users Process Complete",
        description: `Processed ${data.results?.length || 0} demo users`,
      });

    } catch (error: any) {
      console.error('Error creating demo users:', error);
      toast({
        title: "Error creating demo users",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Demo User Management
        </CardTitle>
        <CardDescription>
          Create authentication accounts for demo users to enable login functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={createDemoUsers} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Demo Users...
            </>
          ) : (
            <>
              <Users className="mr-2 h-4 w-4" />
              Create Demo Users
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Results:</h4>
            {results.map((result, index) => (
              <Alert key={index} className={result.status === 'created' ? 'border-green-200 bg-green-50' : 
                                            result.status === 'already_exists' ? 'border-blue-200 bg-blue-50' : 
                                            'border-red-200 bg-red-50'}>
                {result.status === 'created' ? <CheckCircle className="h-4 w-4" /> :
                 result.status === 'already_exists' ? <CheckCircle className="h-4 w-4" /> :
                 <AlertCircle className="h-4 w-4" />}
                <AlertDescription>
                  <strong>{result.email}:</strong> {
                    result.status === 'created' ? 'Successfully created' :
                    result.status === 'already_exists' ? 'Already exists' :
                    `Error: ${result.error}`
                  }
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Demo Accounts:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• super@buildflow.com / super123 (Super Admin)</li>
              <li>• admin@buildflow.com / admin123 (Admin)</li>
              <li>• hr@buildflow.com / hr123 (HR Manager)</li>
              <li>• finance@buildflow.com / finance123 (Finance Manager)</li>
              <li>• employee@buildflow.com / employee123 (Employee)</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};