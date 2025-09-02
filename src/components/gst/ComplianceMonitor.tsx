import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Bell,
  BarChart3,
  FileText,
  Calendar
} from 'lucide-react';

interface ComplianceScore {
  overall: number;
  filing_timeliness: number;
  data_accuracy: number;
  penalty_management: number;
  documentation: number;
}

interface ComplianceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  action_required: boolean;
  due_date?: string;
}

interface ComplianceMonitorProps {
  filings: any[];
  penalties: number;
  onSetReminder: (filingId: string) => void;
}

export const ComplianceMonitor: React.FC<ComplianceMonitorProps> = ({
  filings,
  penalties,
  onSetReminder
}) => {
  const [complianceScore, setComplianceScore] = useState<ComplianceScore>({
    overall: 85,
    filing_timeliness: 90,
    data_accuracy: 95,
    penalty_management: 70,
    documentation: 80
  });

  const [alerts, setAlerts] = useState<ComplianceAlert[]>([
    {
      id: '1',
      type: 'warning',
      message: 'GSTR-3B for March 2024 is due in 3 days',
      action_required: true,
      due_date: '2024-03-20'
    },
    {
      id: '2',
      type: 'info',
      message: 'Annual return GSTR-9 filing period starts next month',
      action_required: false
    }
  ]);

  useEffect(() => {
    calculateComplianceScore();
  }, [filings, penalties]);

  const calculateComplianceScore = () => {
    const totalFilings = filings.length;
    const onTimeFilings = filings.filter(f => f.status === 'filed' && !f.late_fee).length;
    const timeliness = totalFilings > 0 ? (onTimeFilings / totalFilings) * 100 : 100;
    
    const penaltyScore = penalties > 0 ? Math.max(0, 100 - (penalties / 10000) * 10) : 100;
    
    const overall = (timeliness * 0.4 + 95 * 0.3 + penaltyScore * 0.2 + 80 * 0.1);
    
    setComplianceScore({
      overall: Math.round(overall),
      filing_timeliness: Math.round(timeliness),
      data_accuracy: 95,
      penalty_management: Math.round(penaltyScore),
      documentation: 80
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLevel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    return 'Needs Improvement';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Compliance Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(complianceScore.overall)}`}>
              {complianceScore.overall}%
            </div>
            <div className="text-sm text-muted-foreground">
              {getScoreLevel(complianceScore.overall)}
            </div>
            <Progress value={complianceScore.overall} className="mt-2" />
          </div>

          {/* Score Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Filing Timeliness</span>
              <span className={`font-medium ${getScoreColor(complianceScore.filing_timeliness)}`}>
                {complianceScore.filing_timeliness}%
              </span>
            </div>
            <Progress value={complianceScore.filing_timeliness} className="h-2" />

            <div className="flex items-center justify-between">
              <span className="text-sm">Data Accuracy</span>
              <span className={`font-medium ${getScoreColor(complianceScore.data_accuracy)}`}>
                {complianceScore.data_accuracy}%
              </span>
            </div>
            <Progress value={complianceScore.data_accuracy} className="h-2" />

            <div className="flex items-center justify-between">
              <span className="text-sm">Penalty Management</span>
              <span className={`font-medium ${getScoreColor(complianceScore.penalty_management)}`}>
                {complianceScore.penalty_management}%
              </span>
            </div>
            <Progress value={complianceScore.penalty_management} className="h-2" />

            <div className="flex items-center justify-between">
              <span className="text-sm">Documentation</span>
              <span className={`font-medium ${getScoreColor(complianceScore.documentation)}`}>
                {complianceScore.documentation}%
              </span>
            </div>
            <Progress value={complianceScore.documentation} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Compliance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Compliance Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
              <p>No compliance issues detected</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <Alert key={alert.id} className={
                alert.type === 'error' ? 'border-destructive' :
                alert.type === 'warning' ? 'border-warning' : 'border-primary'
              }>
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-grow">
                    <AlertDescription>{alert.message}</AlertDescription>
                    {alert.action_required && (
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline">
                          Take Action
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onSetReminder(alert.id)}>
                          Set Reminder
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            ))
          )}
        </CardContent>
      </Card>

      {/* Compliance Analytics */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Compliance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="text-2xl font-bold text-success">
                {filings.filter(f => f.status === 'filed' && !f.late_fee).length}
              </div>
              <div className="text-sm text-muted-foreground">On-time Filings</div>
            </div>
            
            <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
              <div className="text-2xl font-bold text-warning">
                {filings.filter(f => f.late_fee && f.late_fee > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Late Filings</div>
            </div>
            
            <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="text-2xl font-bold text-destructive">
                ₹{penalties.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Penalties</div>
            </div>
            
            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-2xl font-bold text-primary">
                {Math.round(((filings.filter(f => f.status === 'filed').length / Math.max(filings.length, 1)) * 100))}%
              </div>
              <div className="text-sm text-muted-foreground">Filing Rate</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Generate Compliance Report
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Compliance Review
            </Button>
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Trends
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};