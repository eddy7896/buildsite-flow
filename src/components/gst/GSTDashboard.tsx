import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  FileText, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';
import { useGST, GSTReturn } from '@/hooks/useGST';
import { GSTSettingsDialog } from './GSTSettingsDialog';
import { useAuth } from '@/hooks/useAuth';

export const GSTDashboard: React.FC = () => {
  const { settings, returns, liability, loading, saveSettings, fetchLiability, isAuthenticated } = useGST();
  const { user, loading: authLoading } = useAuth();
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  
  // Simple currency formatter
  const formatCurrency = (amount: number, currency: string = 'INR'): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  React.useEffect(() => {
    // Only fetch liability if user is authenticated and has selected a period
    if (isAuthenticated && selectedPeriod) {
      const [year, month] = selectedPeriod.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      fetchLiability(startDate, endDate);
    }
  }, [selectedPeriod, fetchLiability, isAuthenticated]);

  const getStatusColor = (status: GSTReturn['status']) => {
    switch (status) {
      case 'filed': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'late': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: GSTReturn['status']) => {
    switch (status) {
      case 'filed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'late': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Show loading state while auth is loading or GST data is loading
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show authentication required message if user is not authenticated
  if (!user || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access GST compliance features.</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">GST Compliance</h1>
            <p className="text-muted-foreground">
              Configure your GST settings to start managing compliance and returns
            </p>
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="space-y-4 text-center">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">GST Settings Required</h3>
                  <p className="text-sm text-muted-foreground">
                    Please configure your GST registration details to continue
                  </p>
                </div>
                <Button onClick={() => setShowSettingsDialog(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configure GST Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <GSTSettingsDialog
          open={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
          existingSettings={settings}
          onSave={saveSettings}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">GST Compliance</h1>
          <p className="text-muted-foreground">
            Manage your GST returns, liability, and compliance
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tax Liability</p>
                <p className="text-2xl font-bold">
                  {liability ? formatCurrency(liability.total_tax, 'INR') : '₹0'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxable Value</p>
                <p className="text-2xl font-bold">
                  {liability ? formatCurrency(liability.total_taxable_value, 'INR') : '₹0'}
                </p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Returns</p>
                <p className="text-2xl font-bold">
                  {returns.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filed Returns</p>
                <p className="text-2xl font-bold">
                  {returns.filter(r => r.status === 'filed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="returns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="liability">Tax Liability</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="returns" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>GST Returns</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Generate Return
              </Button>
            </CardHeader>
            <CardContent>
              {returns.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Returns Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by generating your first GST return
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Return
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {returns.map((returnItem) => (
                    <div key={returnItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(returnItem.status)}
                        <div>
                          <div className="font-medium">{returnItem.return_type}</div>
                          <div className="text-sm text-muted-foreground">
                            Period: {new Date(returnItem.filing_period).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Due: {new Date(returnItem.due_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(returnItem.total_tax_amount, 'INR')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(returnItem.total_taxable_value, 'INR')} taxable
                          </div>
                        </div>
                        <Badge className={getStatusColor(returnItem.status)}>
                          {returnItem.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Liability Summary</CardTitle>
              <div className="flex gap-2">
                <input
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-1 border rounded"
                />
              </div>
            </CardHeader>
            <CardContent>
              {liability ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">CGST</h4>
                    <p className="text-2xl font-bold">{formatCurrency(liability.total_cgst, 'INR')}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">SGST</h4>
                    <p className="text-2xl font-bold">{formatCurrency(liability.total_sgst, 'INR')}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">IGST</h4>
                    <p className="text-2xl font-bold">{formatCurrency(liability.total_igst, 'INR')}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Cess</h4>
                    <p className="text-2xl font-bold">{formatCurrency(liability.total_cess, 'INR')}</p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <h4 className="font-medium mb-2">Total Tax</h4>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(liability.total_tax, 'INR')}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Taxable Value</h4>
                    <p className="text-2xl font-bold">{formatCurrency(liability.total_taxable_value, 'INR')}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Liability Data</h3>
                  <p className="text-muted-foreground">
                    No transactions found for the selected period
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>GST Transactions</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Transactions</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding your first GST transaction
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <GSTSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        existingSettings={settings}
        onSave={saveSettings}
        loading={loading}
      />
    </div>
  );
};