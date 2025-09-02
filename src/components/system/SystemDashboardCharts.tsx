import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import type { SystemMetrics } from '@/hooks/useSystemAnalytics';

interface SystemDashboardChartsProps {
  metrics: SystemMetrics;
}

export const SystemDashboardCharts = ({ metrics }: SystemDashboardChartsProps) => {
  // Subscription plan data for pie chart
  const subscriptionData = [
    { name: 'Basic', value: metrics.subscriptionPlans.basic, color: '#3B82F6' },
    { name: 'Pro', value: metrics.subscriptionPlans.pro, color: '#10B981' },
    { name: 'Enterprise', value: metrics.subscriptionPlans.enterprise, color: '#8B5CF6' },
  ].filter(item => item.value > 0);

  // Usage statistics for bar chart
  const usageData = [
    { name: 'Projects', value: metrics.usageStats.totalProjects },
    { name: 'Invoices', value: metrics.usageStats.totalInvoices },
    { name: 'Clients', value: metrics.usageStats.totalClients },
    { name: 'Attendance', value: metrics.usageStats.totalAttendanceRecords },
  ];

  // Simulated growth data for line chart (you would replace this with real data)
  const growthData = [
    { month: 'Jan', agencies: 15, users: 120, revenue: 2100 },
    { month: 'Feb', agencies: 18, users: 145, revenue: 2450 },
    { month: 'Mar', agencies: 22, users: 180, revenue: 2890 },
    { month: 'Apr', agencies: 28, users: 210, revenue: 3250 },
    { month: 'May', agencies: 32, users: 250, revenue: 3680 },
    { month: 'Jun', agencies: metrics.totalAgencies, users: metrics.totalUsers, revenue: metrics.revenueMetrics.mrr },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Subscription Plans Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Platform Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Growth Trends */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Growth Trends (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="agencies" stroke="#3B82F6" strokeWidth={2} />
                <Line yAxisId="left" type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};