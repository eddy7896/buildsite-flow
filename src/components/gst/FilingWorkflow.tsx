import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Download, 
  Upload, 
  Eye,
  Calculator,
  Database,
  Shield
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'error';
  icon: React.ReactNode;
  action?: () => void;
  actionLabel?: string;
}

interface FilingWorkflowProps {
  returnType: 'GSTR1' | 'GSTR3B' | 'GSTR9';
  onStepComplete: (stepId: string) => void;
  onFileReturn: () => void;
}

export const FilingWorkflow: React.FC<FilingWorkflowProps> = ({
  returnType,
  onStepComplete,
  onFileReturn
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const getWorkflowSteps = (): WorkflowStep[] => {
    const baseSteps: WorkflowStep[] = [
      {
        id: 'data_validation',
        title: 'Data Validation',
        description: 'Validate transaction data and ensure completeness',
        status: 'completed',
        icon: <Database className="h-4 w-4" />,
        actionLabel: 'Validate Data'
      },
      {
        id: 'tax_calculation',
        title: 'Tax Calculation',
        description: 'Calculate CGST, SGST, IGST amounts',
        status: 'completed',
        icon: <Calculator className="h-4 w-4" />,
        actionLabel: 'Calculate Taxes'
      }
    ];

    if (returnType === 'GSTR1') {
      return [
        ...baseSteps,
        {
          id: 'outward_supplies',
          title: 'Outward Supplies',
          description: 'Review outward supplies and invoice details',
          status: 'in_progress',
          icon: <FileText className="h-4 w-4" />,
          actionLabel: 'Review Supplies'
        },
        {
          id: 'hsn_summary',
          title: 'HSN Summary',
          description: 'Generate HSN/SAC wise summary',
          status: 'pending',
          icon: <FileText className="h-4 w-4" />,
          actionLabel: 'Generate HSN'
        },
        {
          id: 'generate_return',
          title: 'Generate GSTR-1',
          description: 'Generate the final GSTR-1 return file',
          status: 'pending',
          icon: <Download className="h-4 w-4" />,
          actionLabel: 'Generate Return'
        }
      ];
    }

    if (returnType === 'GSTR3B') {
      return [
        ...baseSteps,
        {
          id: 'input_credits',
          title: 'Input Tax Credits',
          description: 'Review and reconcile input tax credits',
          status: 'in_progress',
          icon: <FileText className="h-4 w-4" />,
          actionLabel: 'Review Credits'
        },
        {
          id: 'liability_calculation',
          title: 'Liability Calculation',
          description: 'Calculate net tax liability',
          status: 'pending',
          icon: <Calculator className="h-4 w-4" />,
          actionLabel: 'Calculate Liability'
        },
        {
          id: 'generate_return',
          title: 'Generate GSTR-3B',
          description: 'Generate the final GSTR-3B return file',
          status: 'pending',
          icon: <Download className="h-4 w-4" />,
          actionLabel: 'Generate Return'
        }
      ];
    }

    // GSTR9 (Annual Return)
    return [
      ...baseSteps,
      {
        id: 'reconciliation',
        title: 'Annual Reconciliation',
        description: 'Reconcile annual data with monthly returns',
        status: 'in_progress',
        icon: <Shield className="h-4 w-4" />,
        actionLabel: 'Reconcile Data'
      },
      {
        id: 'annual_summary',
        title: 'Annual Summary',
        description: 'Generate annual summary of supplies and taxes',
        status: 'pending',
        icon: <FileText className="h-4 w-4" />,
        actionLabel: 'Generate Summary'
      },
      {
        id: 'generate_return',
        title: 'Generate GSTR-9',
        description: 'Generate the final GSTR-9 annual return',
        status: 'pending',
        icon: <Download className="h-4 w-4" />,
        actionLabel: 'Generate Return'
      }
    ];
  };

  const steps = getWorkflowSteps();
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'in_progress':
        return 'bg-warning text-warning-foreground';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{returnType} Filing Workflow</span>
          <Badge variant="outline">
            {completedSteps} of {steps.length} completed
          </Badge>
        </CardTitle>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                step.status === 'in_progress' ? 'bg-warning/5 border-warning/20' : ''
              }`}
            >
              <div className="flex-shrink-0">
                {getStatusIcon(step.status)}
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{step.title}</h4>
                  <Badge className={getStatusColor(step.status)}>
                    {step.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>
              <div className="flex-shrink-0">
                {step.status === 'in_progress' && step.actionLabel && (
                  <Button 
                    size="sm" 
                    onClick={() => onStepComplete(step.id)}
                  >
                    {step.actionLabel}
                  </Button>
                )}
                {step.status === 'pending' && step.actionLabel && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    disabled
                  >
                    {step.actionLabel}
                  </Button>
                )}
                {step.status === 'completed' && (
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button 
            onClick={onFileReturn}
            disabled={completedSteps < steps.length}
            className="flex-1"
          >
            <Upload className="mr-2 h-4 w-4" />
            File {returnType} Return
          </Button>
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download JSON
          </Button>
        </div>

        {/* Filing Checklist */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h5 className="font-medium mb-2">Pre-filing Checklist:</h5>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>✓ All invoices for the period are recorded</li>
            <li>✓ HSN/SAC codes are correctly mapped</li>
            <li>✓ Tax calculations are verified</li>
            <li>✓ Required approvals are obtained</li>
            <li>✓ Bank details for refund (if applicable) are updated</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};