import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

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
        title: "Demo Users Created",
        description: `Successfully processed ${data.results?.length || 0} demo accounts`,
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
    <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-white text-base">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Users className="h-4 w-4 text-white" />
          </div>
          Demo User Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-400">
          Initialize demo accounts for testing different user roles and permissions.
        </p>
        
        <Button 
          onClick={createDemoUsers} 
          disabled={loading}
          className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating accounts...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Initialize Demo Users
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-sm font-medium text-slate-300">Results:</h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
                    result.status === 'created' 
                      ? 'bg-emerald-500/10 text-emerald-300' 
                      : result.status === 'already_exists' 
                        ? 'bg-blue-500/10 text-blue-300' 
                        : 'bg-red-500/10 text-red-300'
                  }`}
                >
                  {result.status === 'created' ? (
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  ) : result.status === 'already_exists' ? (
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  )}
                  <span className="truncate">
                    <strong>{result.email}:</strong>{' '}
                    {result.status === 'created' 
                      ? 'Created' 
                      : result.status === 'already_exists' 
                        ? 'Exists' 
                        : `Error: ${result.error}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Alert className="border-slate-600/50 bg-slate-700/30">
          <AlertCircle className="h-4 w-4 text-slate-400" />
          <AlertDescription className="text-slate-400 text-xs">
            All demo accounts use their role name as password (e.g., <code className="text-amber-400">super123</code> for super admin).
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
