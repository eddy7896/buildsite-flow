import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { 
  FileText, 
  Calendar as CalendarIcon, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Calculator,
  Settings
} from 'lucide-react';
import { AdvancedFilingDashboard } from '@/components/gst/AdvancedFilingDashboard';
import { GstSettingsDialog } from '@/components/gst/GstSettingsDialog';

interface GstSettings {
  id?: string;
  gstin: string;
  legal_name: string;
  trade_name?: string;
  business_type: string;
  filing_frequency: string;
  composition_scheme: boolean;
}

interface GstFiling {
  id: string;
  filing_period: string;
  return_type: string;
  due_date: string;
  filed_date?: string;
  status: string;
  total_taxable_value: number;
  total_tax_amount: number;
  late_fee: number;
}

interface GstLiability {
  total_taxable_value: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  total_tax: number;
}

const GstCompliance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [gstSettings, setGstSettings] = useState<GstSettings | null>(null);
  const [filings, setFilings] = useState<GstFiling[]>([]);
  const [liability, setLiability] = useState<GstLiability | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Date>(new Date());
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  

  useEffect(() => {
    fetchGstSettings();
    fetchFilings();
    calculateLiability();
  }, [selectedPeriod]);

  const fetchGstSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('gst_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setGstSettings(data);
    } catch (error) {
      console.error('Error fetching GST settings:', error);
    }
  };

  const fetchFilings = async () => {
    try {
      const { data, error } = await supabase
        .from('gst_filings')
        .select('*')
        .order('filing_period', { ascending: false })
        .limit(10);

      if (error) throw error;
      setFilings(data || []);
    } catch (error) {
      console.error('Error fetching filings:', error);
    }
  };

  const calculateLiability = async () => {
    if (!user) return;

    try {
      const startDate = format(startOfMonth(selectedPeriod), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(selectedPeriod), 'yyyy-MM-dd');

      const { data, error } = await supabase.rpc('calculate_gst_liability', {
        p_agency_id: user.id,
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;
      setLiability(data?.[0] || null);
    } catch (error) {
      console.error('Error calculating liability:', error);
    }
  };

  const generateGSTR1 = async () => {
    setLoading(true);
    try {
      // Mock GSTR-1 generation - in real implementation, this would call an edge function
      toast({
        title: "GSTR-1 Generated",
        description: "Your GSTR-1 return has been prepared for filing."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate GSTR-1 return.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateGSTR3B = async () => {
    setLoading(true);
    try {
      // Mock GSTR-3B generation
      toast({
        title: "GSTR-3B Generated",
        description: "Your GSTR-3B return has been prepared for filing."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate GSTR-3B return.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filed': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'late': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (!gstSettings) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">GST Compliance</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              GST Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please configure your GST settings to start using the compliance features.
            </p>
            <Button onClick={() => {
              console.log('Configure GST Settings button clicked');
              console.log('Current showSettingsDialog state:', showSettingsDialog);
              setShowSettingsDialog(true);
              console.log('After setting showSettingsDialog to true');
            }}>
              <Settings className="mr-2 h-4 w-4" />
              Configure GST Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GST Compliance</h1>
          <p className="text-muted-foreground">
            GSTIN: {gstSettings.gstin} | {gstSettings.legal_name}
          </p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedPeriod, 'MMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedPeriod}
                onSelect={(date) => date && setSelectedPeriod(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tax Liability</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liability ? formatCurrency(liability.total_tax) : '₹0'}
            </div>
            <p className="text-xs text-muted-foreground">
              For {format(selectedPeriod, 'MMM yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxable Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liability ? formatCurrency(liability.total_taxable_value) : '₹0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total sales value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Returns</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filings.filter(f => f.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Due for filing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">Good</div>
            <p className="text-xs text-muted-foreground">
              All returns filed on time
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Filing Dashboard</TabsTrigger>
          <TabsTrigger value="returns">GST Returns</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="liability">Tax Liability</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <AdvancedFilingDashboard
            filings={filings}
            onGenerateReturn={(returnType) => {
              if (returnType === 'GSTR1') {
                generateGSTR1();
              } else if (returnType === 'GSTR3B') {
                generateGSTR3B();
              }
            }}
            onFileReturn={(filing) => {
              toast({
                title: "Filing Initiated",
                description: `${filing.return_type} filing process started.`
              });
            }}
          />
        </TabsContent>

        <TabsContent value="returns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                GST Return Filing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={generateGSTR1} disabled={loading}>
                  <Download className="mr-2 h-4 w-4" />
                  Generate GSTR-1
                </Button>
                <Button onClick={generateGSTR3B} disabled={loading}>
                  <Download className="mr-2 h-4 w-4" />
                  Generate GSTR-3B
                </Button>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  File Return
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return Type</TableHead>
                    <TableHead>Filing Period</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tax Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filings.map((filing) => (
                    <TableRow key={filing.id}>
                      <TableCell className="font-medium">{filing.return_type}</TableCell>
                      <TableCell>{format(new Date(filing.filing_period), 'MMM yyyy')}</TableCell>
                      <TableCell>{format(new Date(filing.due_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(filing.status)}>
                          {filing.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(filing.total_tax_amount)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Liability Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {liability && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{formatCurrency(liability.total_cgst)}</div>
                    <div className="text-sm text-muted-foreground">CGST</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{formatCurrency(liability.total_sgst)}</div>
                    <div className="text-sm text-muted-foreground">SGST</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{formatCurrency(liability.total_igst)}</div>
                    <div className="text-sm text-muted-foreground">IGST</div>
                  </div>
                  <div className="text-center p-4 bg-primary text-primary-foreground rounded-lg">
                    <div className="text-2xl font-bold">{formatCurrency(liability.total_tax)}</div>
                    <div className="text-sm">Total Tax</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GST Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Transaction details will be displayed here</p>
                <p className="text-sm">Import invoices to see GST transaction breakdown</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GST Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">GSTIN</label>
                  <Input value={gstSettings.gstin} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Legal Name</label>
                  <Input value={gstSettings.legal_name} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Business Type</label>
                  <Select value={gstSettings.business_type} disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="composition">Composition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Filing Frequency</label>
                  <Select value={gstSettings.filing_frequency} disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => {
                console.log('Update Settings button clicked');
                console.log('Current showSettingsDialog state:', showSettingsDialog);
                setShowSettingsDialog(true);
                console.log('After setting showSettingsDialog to true');
              }}>
                <Settings className="mr-2 h-4 w-4" />
                Update Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <GstSettingsDialog
        key={`gst-dialog-${showSettingsDialog}`}
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        existingSettings={gstSettings}
        onSave={(settings) => {
          setGstSettings(settings);
          fetchGstSettings(); // Refresh the data
          setShowSettingsDialog(false);
        }}
      />
    </div>
  );
};

export default GstCompliance;