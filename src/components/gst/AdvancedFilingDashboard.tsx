import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Upload, 
  Calculator, 
  Eye,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { FilingCalendar } from './FilingCalendar';
import { FilingWorkflow } from './FilingWorkflow';
import { ComplianceMonitor } from './ComplianceMonitor';

interface AdvancedFilingDashboardProps {
  filings: any[];
  onGenerateReturn: (returnType: string) => void;
  onFileReturn: (filing: any) => void;
}

export const AdvancedFilingDashboard: React.FC<AdvancedFilingDashboardProps> = ({
  filings,
  onGenerateReturn,
  onFileReturn
}) => {
  const [selectedReturnType, setSelectedReturnType] = useState<'GSTR1' | 'GSTR3B' | 'GSTR9'>('GSTR1');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleStepComplete = (stepId: string) => {
    console.log('Step completed:', stepId);
    // Handle workflow step completion
  };

  const handleSetReminder = (filingId: string) => {
    console.log('Setting reminder for:', filingId);
    // Handle reminder setting
  };

  const filteredFilings = filings.filter(filing => {
    const matchesStatus = filterStatus === 'all' || filing.status === filterStatus;
    const matchesSearch = filing.return_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         filing.filing_period.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Advanced Filing Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive GST filing management with automated workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onGenerateReturn('GSTR1')}>
            <Download className="mr-2 h-4 w-4" />
            Quick GSTR-1
          </Button>
          <Button onClick={() => onGenerateReturn('GSTR3B')}>
            <Download className="mr-2 h-4 w-4" />
            Quick GSTR-3B
          </Button>
          <Button variant="outline">
            <Calculator className="mr-2 h-4 w-4" />
            Calculate Liability
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="calendar">Filing Calendar</TabsTrigger>
          <TabsTrigger value="workflow">Filing Workflow</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Monitor</TabsTrigger>
          <TabsTrigger value="returns">Return Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Filing Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <FilingCalendar 
            filings={filings}
            onFileReturn={onFileReturn}
            onViewDetails={(filing) => console.log('View details:', filing)}
          />
        </TabsContent>

        {/* Filing Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Label>Select Return Type:</Label>
            <Select value={selectedReturnType} onValueChange={(value: any) => setSelectedReturnType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GSTR1">GSTR-1 (Outward Supplies)</SelectItem>
                <SelectItem value="GSTR3B">GSTR-3B (Summary Return)</SelectItem>
                <SelectItem value="GSTR9">GSTR-9 (Annual Return)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <FilingWorkflow
            returnType={selectedReturnType}
            onStepComplete={handleStepComplete}
            onFileReturn={() => onFileReturn({ return_type: selectedReturnType })}
          />
        </TabsContent>

        {/* Compliance Monitor Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <ComplianceMonitor
            filings={filings}
            penalties={filings.reduce((sum, f) => sum + (f.late_fee || 0), 0)}
            onSetReminder={handleSetReminder}
          />
        </TabsContent>

        {/* Return Management Tab */}
        <TabsContent value="returns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Return Management</span>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search filings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-48"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="filed">Filed</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredFilings.map((filing) => (
                  <div key={filing.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{filing.return_type}</div>
                        <div className="text-sm text-muted-foreground">
                          Period: {filing.filing_period} | Due: {filing.due_date}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Tax Amount: ₹{filing.total_tax_amount?.toLocaleString() || 0}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        filing.status === 'filed' ? 'default' :
                        filing.status === 'pending' ? 'secondary' :
                        'destructive'
                      }>
                        {filing.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filing Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Filing trend charts will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tax Liability Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Tax liability trends will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compliance History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Compliance history will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};