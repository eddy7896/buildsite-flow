import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  DollarSign, 
  Calendar, 
  Target,
  Zap,
  Brain,
  BarChart3
} from "lucide-react";

interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'warning' | 'trend' | 'recommendation';
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  actionable: boolean;
  data: any;
  created_at: string;
}

export function AIInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock AI insights data
    const mockInsights: Insight[] = [
      {
        id: '1',
        title: 'Peak Performance Period Identified',
        description: 'Your team shows 34% higher productivity between 9-11 AM. Consider scheduling important meetings during this window.',
        type: 'opportunity',
        impact: 'medium',
        confidence: 89,
        actionable: true,
        data: { peak_hours: '9-11 AM', productivity_increase: 34 },
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Client Churn Risk Detected',
        description: 'Acme Corp shows reduced engagement patterns similar to previous churned clients. Immediate attention recommended.',
        type: 'warning',
        impact: 'high',
        confidence: 76,
        actionable: true,
        data: { client: 'Acme Corp', risk_score: 76, similar_patterns: 3 },
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Revenue Optimization Opportunity',
        description: 'Upselling UI/UX services to existing web development clients could increase revenue by an estimated $45,000 this quarter.',
        type: 'opportunity',
        impact: 'high',
        confidence: 82,
        actionable: true,
        data: { service: 'UI/UX', potential_revenue: 45000, target_clients: 8 },
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        title: 'Resource Allocation Trend',
        description: 'Frontend development tasks are taking 23% longer than estimated. Consider additional training or resources.',
        type: 'trend',
        impact: 'medium',
        confidence: 91,
        actionable: true,
        data: { department: 'Frontend', time_overrun: 23, suggested_action: 'training' },
        created_at: new Date().toISOString()
      },
      {
        id: '5',
        title: 'Optimal Project Size Identified',
        description: 'Projects between $15K-$30K show highest profit margins (67%) and client satisfaction (4.7/5).',
        type: 'recommendation',
        impact: 'medium',
        confidence: 94,
        actionable: true,
        data: { optimal_range: '15K-30K', profit_margin: 67, satisfaction: 4.7 },
        created_at: new Date().toISOString()
      },
      {
        id: '6',
        title: 'Seasonal Demand Pattern',
        description: 'Historical data shows 40% increase in e-commerce projects during Q4. Prepare resources accordingly.',
        type: 'trend',
        impact: 'medium',
        confidence: 87,
        actionable: true,
        data: { season: 'Q4', increase: 40, project_type: 'e-commerce' },
        created_at: new Date().toISOString()
      }
    ];

    setInsights(mockInsights);
  }, []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'trend':
        return <BarChart3 className="h-5 w-5 text-blue-500" />;
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      default:
        return <Brain className="h-5 w-5 text-gray-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-red-100 text-red-800';
      case 'trend':
        return 'bg-blue-100 text-blue-800';
      case 'recommendation':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const refreshInsights = async () => {
    setLoading(true);
    try {
      // Simulate AI insight generation
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error refreshing insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const implementInsight = async (insightId: string) => {
    try {
      // In a real app, this would trigger automated actions or create tasks
    } catch (error) {
      console.error('Error implementing insight:', error);
    }
  };

  // Group insights by type
  const groupedInsights = insights.reduce((groups, insight) => {
    const type = insight.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(insight);
    return groups;
  }, {} as Record<string, Insight[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI-Generated Insights
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={refreshInsights}
          disabled={loading}
        >
          <Zap className="h-4 w-4 mr-2" />
          {loading ? 'Analyzing...' : 'Refresh Insights'}
        </Button>
      </div>

      {/* Insight Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Opportunities</span>
            </div>
            <p className="text-2xl font-bold mt-2">{groupedInsights.opportunity?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Warnings</span>
            </div>
            <p className="text-2xl font-bold mt-2">{groupedInsights.warning?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Trends</span>
            </div>
            <p className="text-2xl font-bold mt-2">{groupedInsights.trend?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Recommendations</span>
            </div>
            <p className="text-2xl font-bold mt-2">{groupedInsights.recommendation?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* High Priority Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            High Priority Insights
          </CardTitle>
          <CardDescription>
            AI-identified insights requiring immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights
              .filter(insight => insight.impact === 'high')
              .map((insight) => (
                <div key={insight.id} className="p-4 border rounded-lg hover:bg-muted/25">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 mt-3">
                          <Badge className={getInsightColor(insight.type)} variant="outline">
                            {insight.type}
                          </Badge>
                          <span className={`text-sm font-medium ${getImpactColor(insight.impact)}`}>
                            {insight.impact} impact
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">Confidence:</span>
                            <span className="text-sm font-medium">{insight.confidence}%</span>
                            <Progress value={insight.confidence} className="w-16 h-2" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {insight.actionable && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => implementInsight(insight.id)}
                      >
                        Take Action
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* All Insights by Category */}
      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(groupedInsights).map(([type, typeInsights]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize">
                {getInsightIcon(type)}
                {type}s
              </CardTitle>
              <CardDescription>
                AI-detected {type}s for your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {typeInsights.map((insight) => (
                  <div key={insight.id} className="p-3 border rounded-lg">
                    <h5 className="font-medium text-sm">{insight.title}</h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      {insight.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs ${getImpactColor(insight.impact)}`}>
                          {insight.impact}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {insight.confidence}% confidence
                        </span>
                      </div>
                      
                      {insight.actionable && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => implementInsight(insight.id)}
                        >
                          Act
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}