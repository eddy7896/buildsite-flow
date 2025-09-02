import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  Zap,
  Calendar,
  DollarSign,
  Users,
  AlertTriangle
} from "lucide-react";

interface PredictionData {
  period: string;
  actual: number;
  predicted: number;
  confidence: number;
}

interface TrendData {
  metric: string;
  current: number;
  predicted: number;
  change: number;
  confidence: number;
}

export function PredictiveAnalytics() {
  const [revenueData, setRevenueData] = useState<PredictionData[]>([]);
  const [projectData, setProjectData] = useState<PredictionData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock predictive analytics data
    const mockRevenueData: PredictionData[] = [
      { period: 'Jan', actual: 45000, predicted: 47000, confidence: 87 },
      { period: 'Feb', actual: 52000, predicted: 54000, confidence: 89 },
      { period: 'Mar', actual: 48000, predicted: 49500, confidence: 91 },
      { period: 'Apr', actual: 0, predicted: 56000, confidence: 85 },
      { period: 'May', actual: 0, predicted: 61000, confidence: 82 },
      { period: 'Jun', actual: 0, predicted: 58000, confidence: 78 }
    ];

    const mockProjectData: PredictionData[] = [
      { period: 'Week 1', actual: 8, predicted: 9, confidence: 92 },
      { period: 'Week 2', actual: 12, predicted: 11, confidence: 88 },
      { period: 'Week 3', actual: 7, predicted: 8, confidence: 85 },
      { period: 'Week 4', actual: 0, predicted: 10, confidence: 83 },
      { period: 'Week 5', actual: 0, predicted: 12, confidence: 80 },
      { period: 'Week 6', actual: 0, predicted: 14, confidence: 77 }
    ];

    const mockTrendData: TrendData[] = [
      { metric: 'Monthly Revenue', current: 52000, predicted: 61000, change: 17.3, confidence: 85 },
      { metric: 'Project Completion', current: 89, predicted: 94, change: 5.6, confidence: 91 },
      { metric: 'Client Acquisition', current: 12, predicted: 16, change: 33.3, confidence: 78 },
      { metric: 'Team Utilization', current: 87, predicted: 92, change: 5.7, confidence: 88 },
      { metric: 'Customer Satisfaction', current: 4.2, predicted: 4.6, change: 9.5, confidence: 82 }
    ];

    setRevenueData(mockRevenueData);
    setProjectData(mockProjectData);
    setTrendData(mockTrendData);
  }, []);

  const generateAdvancedPrediction = async (type: string) => {
    setLoading(true);
    try {
      // Simulate AI prediction generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update data with new predictions
      console.log(`Generated ${type} prediction`);
    } catch (error) {
      console.error('Error generating prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Advanced Predictive Analytics
        </h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => generateAdvancedPrediction('revenue')}
            disabled={loading}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Forecast Revenue
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => generateAdvancedPrediction('resources')}
            disabled={loading}
          >
            <Users className="h-4 w-4 mr-2" />
            Resource Planning
          </Button>
        </div>
      </div>

      {/* Key Predictions Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {trendData.slice(0, 3).map((trend, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{trend.metric}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {trend.metric.includes('Revenue') ? `$${trend.predicted.toLocaleString()}` : 
                     trend.metric.includes('Satisfaction') ? trend.predicted.toFixed(1) : trend.predicted}
                  </p>
                  <div className="flex items-center text-sm">
                    {trend.change > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={trend.change > 0 ? "text-green-600" : "text-red-600"}>
                      {Math.abs(trend.change).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className="text-sm font-medium">{trend.confidence}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Prediction Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Prediction vs Actual
          </CardTitle>
          <CardDescription>
            AI-powered revenue forecasting with confidence intervals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `$${Number(value).toLocaleString()}`, 
                  name === 'actual' ? 'Actual' : 'Predicted'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "hsl(var(--secondary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Project Completion Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Project Completion Forecast
          </CardTitle>
          <CardDescription>
            Predicted project delivery timeline with risk assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={projectData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, name === 'actual' ? 'Actual' : 'Predicted']} />
              <Area 
                type="monotone" 
                dataKey="actual" 
                stackId="1"
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="predicted" 
                stackId="2"
                stroke="hsl(var(--secondary))" 
                fill="hsl(var(--secondary))"
                fillOpacity={0.4}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Trend Analysis & Predictions
          </CardTitle>
          <CardDescription>
            Comprehensive metrics with AI-driven insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trendData.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{trend.metric}</h4>
                  <div className="flex items-center space-x-4 mt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Current</p>
                      <p className="font-medium">
                        {trend.metric.includes('Revenue') ? `$${trend.current.toLocaleString()}` : 
                         trend.metric.includes('Satisfaction') ? trend.current.toFixed(1) : trend.current}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Predicted</p>
                      <p className="font-medium">
                        {trend.metric.includes('Revenue') ? `$${trend.predicted.toLocaleString()}` : 
                         trend.metric.includes('Satisfaction') ? trend.predicted.toFixed(1) : trend.predicted}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center">
                      {trend.change > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={trend.change > 0 ? "text-green-600" : "text-red-600"}>
                        {Math.abs(trend.change).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Change</p>
                  </div>
                  
                  <div className="w-16">
                    <Progress value={trend.confidence} className="h-2" />
                    <p className="text-xs text-center mt-1">{trend.confidence}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
          <CardDescription>
            Data-driven suggestions for optimal business outcomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-blue-900">Revenue Optimization</h5>
                <p className="text-sm text-blue-700">
                  Focus on high-value clients in Q2. Predicted 23% revenue increase by targeting enterprise accounts.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-yellow-900">Resource Alert</h5>
                <p className="text-sm text-yellow-700">
                  Development team will be over-capacity in 3 weeks. Consider hiring or redistributing workload.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <Target className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-green-900">Project Optimization</h5>
                <p className="text-sm text-green-700">
                  Implementing suggested workflow changes could reduce project delivery time by 15%.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}