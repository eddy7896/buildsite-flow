import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Trash2, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';

interface DemoDataManagerProps {
  onDataChange?: () => void;
}

const DemoDataManager = ({ onDataChange }: DemoDataManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const generateDemoData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user's agency ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.agency_id) {
        throw new Error('Agency not found');
      }

      const { data, error } = await supabase.functions.invoke('generate-demo-data', {
        body: { agencyId: profile.agency_id }
      });

      if (error) throw error;

      toast({
        title: "Demo data generated!",
        description: `Created ${data.summary.clients} clients, ${data.summary.jobs} projects, ${data.summary.leads} leads, and more.`,
      });

      if (onDataChange) onDataChange();
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

  const cleanupDemoData = async () => {
    if (!user) return;

    setCleanupLoading(true);
    try {
      // Get user's agency ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.agency_id) {
        throw new Error('Agency not found');
      }

      const agencyId = profile.agency_id;

      // Delete demo data in order (respecting foreign key constraints)
      
      // 1. Delete quotation line items first
      const { data: quotationsToDelete } = await supabase
        .from('quotations')
        .select('id')
        .eq('agency_id', agencyId);

      if (quotationsToDelete?.length) {
        await supabase
          .from('quotation_line_items')
          .delete()
          .in('quotation_id', quotationsToDelete.map(q => q.id));
      }

      // 2. Delete job cost items
      const { data: jobsToDelete } = await supabase
        .from('jobs')
        .select('id')
        .eq('agency_id', agencyId);

      if (jobsToDelete?.length) {
        await supabase
          .from('job_cost_items')
          .delete()
          .in('job_id', jobsToDelete.map(j => j.id));
      }

      // 3. Delete CRM activities
      await supabase
        .from('crm_activities')
        .delete()
        .eq('agency_id', agencyId);

      // 4. Delete quotations
      await supabase
        .from('quotations')
        .delete()
        .eq('agency_id', agencyId);

      // 5. Delete leads
      await supabase
        .from('leads')
        .delete()
        .eq('agency_id', agencyId);

      // 6. Delete jobs
      await supabase
        .from('jobs')
        .delete()
        .eq('agency_id', agencyId);

      // 7. Delete clients
      await supabase
        .from('clients')
        .delete()
        .eq('agency_id', agencyId);

      // 8. Delete global demo data (expense categories, lead sources, job categories)
      // Note: These might be shared across agencies, so we only delete if they're demo data
      const demoCategories = ['Office Supplies', 'Travel & Transportation', 'Software & Licenses', 'Marketing & Advertising', 'Training & Education'];
      await supabase
        .from('expense_categories')
        .delete()
        .in('name', demoCategories);

      const demoSources = ['Website Contact Form', 'Referral', 'Social Media', 'Trade Shows', 'Cold Outreach'];
      await supabase
        .from('lead_sources')
        .delete()
        .in('name', demoSources);

      const demoJobCategories = ['Web Development', 'Mobile Development', 'System Integration', 'Consulting', 'Maintenance & Support'];
      await supabase
        .from('job_categories')
        .delete()
        .in('name', demoJobCategories);

      toast({
        title: "Demo data cleaned up",
        description: "All demo data has been removed from your agency.",
      });

      if (onDataChange) onDataChange();
    } catch (error: any) {
      console.error('Error cleaning up demo data:', error);
      toast({
        title: "Error cleaning up demo data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Demo Data Management
          </CardTitle>
          <CardDescription>
            Generate or clean up sample data for exploring BuildFlow features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Demo data includes sample clients, projects, leads, quotations, and reference data 
              to help you explore BuildFlow's features. You can safely remove it anytime.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Generate Demo Data</CardTitle>
                <CardDescription className="text-sm">
                  Create sample data to explore features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={generateDemoData} 
                  disabled={loading}
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {loading ? 'Generating...' : 'Generate Demo Data'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Creates 3 clients, 3 projects, 3 leads, 2 quotations, and reference data
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Clean Up Demo Data</CardTitle>
                <CardDescription className="text-sm">
                  Remove all demo data from your agency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={cleanupDemoData} 
                  disabled={cleanupLoading}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {cleanupLoading ? 'Cleaning...' : 'Clean Up Demo Data'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Removes all demo data - this action cannot be undone
                </p>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Demo data cleanup will permanently remove sample clients, 
              projects, leads, and related data. Make sure you no longer need this data before proceeding.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoDataManager;