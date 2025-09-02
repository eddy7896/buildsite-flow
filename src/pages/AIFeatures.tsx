import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain,
  Zap,
  TrendingUp,
  FileText,
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Bot,
  Sparkles,
  Target,
  Lightbulb,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PredictiveAnalytics } from "@/components/ai/PredictiveAnalytics";
import { DocumentProcessor } from "@/components/ai/DocumentProcessor";
import { AIInsights } from "@/components/ai/AIInsights";
import { SmartRecommendations } from "@/components/ai/SmartRecommendations";

interface AIMetrics {
  predictionsGenerated: number;
  documentsProcessed: number;
  insightsProvided: number;
  automationsSaved: number;
  accuracyScore: number;
  timeSaved: number;
}

interface Prediction {
  id: string;
  type: 'revenue' | 'project_completion' | 'resource_demand' | 'risk_assessment';
  title: string;
  prediction: string;
  confidence: number;
  timeline: string;
  impact: 'low' | 'medium' | 'high';
  created_at: string;
}

interface ProcessedDocument {
  id: string;
  filename: string;
  type: 'invoice' | 'contract' | 'report' | 'receipt';
  status: 'processing' | 'completed' | 'failed';
  extractedData: any;
  processed_at: string;
}

export default function AIFeatures() {
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [processedDocs, setProcessedDocs] = useState<ProcessedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const { toast } = useToast();

  const fetchAIMetrics = async () => {
    try {
      // Mock AI metrics - in production, these would come from AI service analytics
      const mockMetrics: AIMetrics = {
        predictionsGenerated: 247,
        documentsProcessed: 89,
        insightsProvided: 156,
        automationsSaved: 45,
        accuracyScore: 94.2,
        timeSaved: 128 // hours
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching AI metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load AI metrics",
        variant: "destructive"
      });
    }
  };

  const fetchPredictions = async () => {
    try {
      // Mock predictions data
      const mockPredictions: Prediction[] = [
        {
          id: '1',
          type: 'revenue',
          title: 'Q1 Revenue Forecast',
          prediction: 'Projected revenue increase of 18% based on current project pipeline and historical data',
          confidence: 87,
          timeline: 'Next 3 months',
          impact: 'high',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          type: 'project_completion',
          title: 'Project Delivery Risk',
          prediction: 'Project Alpha has 73% chance of delay due to resource constraints',
          confidence: 73,
          timeline: 'Next 2 weeks',
          impact: 'medium',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          type: 'resource_demand',
          title: 'Staffing Requirements',
          prediction: 'Need to hire 2 additional developers by March to meet project demands',
          confidence: 91,
          timeline: 'Next 6 weeks',
          impact: 'high',
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          type: 'risk_assessment',
          title: 'Client Retention Alert',
          prediction: 'Client XYZ showing early warning signs of churn based on engagement patterns',
          confidence: 68,
          timeline: 'Next 4 weeks',
          impact: 'medium',
          created_at: new Date().toISOString()
        }
      ];

      setPredictions(mockPredictions);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const fetchProcessedDocuments = async () => {
    try {
      // Mock processed documents data
      const mockDocs: ProcessedDocument[] = [
        {
          id: '1',
          filename: 'Invoice_Q4_2024.pdf',
          type: 'invoice',
          status: 'completed',
          extractedData: {
            amount: 15420.50,
            client: 'Acme Corp',
            dueDate: '2025-02-15'
          },
          processed_at: new Date().toISOString()
        },
        {
          id: '2',
          filename: 'Contract_NewClient.docx',
          type: 'contract',
          status: 'completed',
          extractedData: {
            parties: ['BuildFlow Agency', 'TechStart Inc'],
            value: 85000,
            duration: '12 months'
          },
          processed_at: new Date().toISOString()
        },
        {
          id: '3',
          filename: 'Expense_Report_Jan.pdf',
          type: 'receipt',
          status: 'processing',
          extractedData: null,
          processed_at: new Date().toISOString()
        }
      ];

      setProcessedDocs(mockDocs);
    } catch (error) {
      console.error('Error fetching processed documents:', error);
    }
  };

  const generatePrediction = async (type: string) => {
    try {
      // Call AI service to generate prediction
      const { data, error } = await supabase.functions.invoke('ai-predictions', {
        body: { type, timeframe: selectedTimeframe }
      });

      if (error) throw error;

      toast({
        title: "Prediction Generated",
        description: "New AI prediction has been generated successfully"
      });

      fetchPredictions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate prediction",
        variant: "destructive"
      });
    }
  };

  const processDocument = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('document', file);

      const { data, error } = await supabase.functions.invoke('ai-document-processor', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Document Processing Started",
        description: "Your document is being processed by AI"
      });

      fetchProcessedDocuments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process document",
        variant: "destructive"
      });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAIMetrics(),
        fetchPredictions(),
        fetchProcessedDocuments()
      ]);
      setLoading(false);
    };
    loadData();
  }, [selectedTimeframe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI-Powered Features
          </h1>
          <p className="text-muted-foreground">
            Intelligent automation and predictive analytics for your agency
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Settings
          </Button>
        </div>
      </div>

      {/* AI Metrics Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predictions Generated</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.predictionsGenerated}</div>
            <p className="text-xs text-muted-foreground">
              +12 from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Processed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.documentsProcessed}</div>
            <p className="text-xs text-muted-foreground">
              +23 from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.accuracyScore}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.timeSaved}h</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Features Tabs */}
      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions">Predictive Analytics</TabsTrigger>
          <TabsTrigger value="documents">Document Processing</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="automation">Smart Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">AI Predictions</h3>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => generatePrediction('revenue')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Generate Revenue Forecast
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => generatePrediction('risk')}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Risk Assessment
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {predictions.map((prediction) => (
              <Card key={prediction.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {prediction.type === 'revenue' && <DollarSign className="h-5 w-5" />}
                      {prediction.type === 'project_completion' && <Calendar className="h-5 w-5" />}
                      {prediction.type === 'resource_demand' && <Users className="h-5 w-5" />}
                      {prediction.type === 'risk_assessment' && <AlertTriangle className="h-5 w-5" />}
                      {prediction.title}
                    </CardTitle>
                    <Badge className={getImpactColor(prediction.impact)}>
                      {prediction.impact} impact
                    </Badge>
                  </div>
                  <CardDescription>{prediction.timeline}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{prediction.prediction}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Confidence Level</span>
                      <span className={getConfidenceColor(prediction.confidence)}>
                        {prediction.confidence}%
                      </span>
                    </div>
                    <Progress value={prediction.confidence} className="h-2" />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Generated {new Date(prediction.created_at).toLocaleDateString()}
                    </span>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <PredictiveAnalytics />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <DocumentProcessor 
            onDocumentUpload={processDocument}
            processedDocuments={processedDocs}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <AIInsights />
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <SmartRecommendations />
        </TabsContent>
      </Tabs>
    </div>
  );
}