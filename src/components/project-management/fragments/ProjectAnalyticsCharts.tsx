import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/services/api/project-service";
import { CHART_COLORS } from "./types";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { useMemo } from "react";

interface ProjectAnalyticsChartsProps {
  projects: Project[];
}

export function ProjectAnalyticsCharts({ projects }: ProjectAnalyticsChartsProps) {
  const statusChartData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    projects.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value
    }));
  }, [projects]);

  const budgetTrendData = useMemo(() => {
    const monthlyData: Record<string, { budget: number; actual: number }> = {};
    projects.forEach(p => {
      if (p.start_date) {
        const month = new Date(p.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { budget: 0, actual: 0 };
        }
        monthlyData[month].budget += p.budget || 0;
        monthlyData[month].actual += p.actual_cost || 0;
      }
    });
    return Object.entries(monthlyData)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([name, data]) => ({ name, ...data }));
  }, [projects]);

  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Project Status Distribution</CardTitle>
          <CardDescription>Breakdown of projects by status</CardDescription>
        </CardHeader>
        <CardContent>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual Trend</CardTitle>
          <CardDescription>Monthly budget comparison</CardDescription>
        </CardHeader>
        <CardContent>
          {budgetTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={budgetTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="budget" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Budget"
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Actual"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No budget data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
