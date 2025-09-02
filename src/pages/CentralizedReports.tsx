import React, { useState } from 'react';
import { Download, Plus, Calendar, Filter, BarChart3, FileText, DollarSign, Users, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const CentralizedReports = () => {
  const [selectedMonth, setSelectedMonth] = useState('january');
  const [selectedYear, setSelectedYear] = useState('2024');

  // Enhanced mock data for all report types
  const financialReports = [
    {
      id: 1,
      name: 'Balance Sheet',
      description: 'Assets, liabilities, and equity statement',
      category: 'Financial',
      lastGenerated: '2024-01-25',
      icon: FileText,
      color: 'blue'
    },
    {
      id: 2,
      name: 'Profit & Loss',
      description: 'Income and expenses statement',
      category: 'Financial', 
      lastGenerated: '2024-01-24',
      icon: BarChart3,
      color: 'green'
    },
    {
      id: 3,
      name: 'Cash Flow Statement',
      description: 'Cash receipts and payments',
      category: 'Financial',
      lastGenerated: '2024-01-23',
      icon: DollarSign,
      color: 'purple'
    },
    {
      id: 4,
      name: 'Job Profitability',
      description: 'Job cost analysis and margins',
      category: 'Financial',
      lastGenerated: '2024-01-22',
      icon: Briefcase,
      color: 'orange'
    }
  ];

  const hrReports = [
    {
      id: 5,
      name: 'Employee Attendance Summary',
      description: 'Monthly attendance tracking',
      category: 'HR',
      lastGenerated: '2024-01-25',
      icon: Users,
      color: 'indigo'
    },
    {
      id: 6,
      name: 'Payroll Summary',
      description: 'Salary and compensation overview',
      category: 'HR',
      lastGenerated: '2024-01-20',
      icon: DollarSign,
      color: 'pink'
    },
    {
      id: 7,
      name: 'Leave Report',
      description: 'Leave requests and balances',
      category: 'HR',
      lastGenerated: '2024-01-18',
      icon: Calendar,
      color: 'teal'
    },
    {
      id: 8,
      name: 'Employee Performance',
      description: 'Performance metrics and reviews',
      category: 'HR',
      lastGenerated: '2024-01-15',
      icon: BarChart3,
      color: 'cyan'
    }
  ];

  const projectReports = [
    {
      id: 9,
      name: 'Project Status Overview',
      description: 'Current status of all projects',
      category: 'Project',
      lastGenerated: '2024-01-25',
      icon: Briefcase,
      color: 'violet'
    },
    {
      id: 10,
      name: 'Resource Utilization',
      description: 'Team and resource allocation',
      category: 'Project',
      lastGenerated: '2024-01-23',
      icon: Users,
      color: 'amber'
    },
    {
      id: 11,
      name: 'Budget vs Actual',
      description: 'Project budget performance',
      category: 'Project',
      lastGenerated: '2024-01-21',
      icon: DollarSign,
      color: 'emerald'
    }
  ];

  const customReports = [
    {
      id: 12,
      name: 'Executive Dashboard',
      description: 'High-level KPIs and metrics',
      category: 'Custom',
      lastGenerated: '2024-01-25',
      icon: BarChart3,
      color: 'rose'
    },
    {
      id: 13,
      name: 'Client Profitability Analysis',
      description: 'Revenue and profit by client',
      category: 'Custom',
      lastGenerated: '2024-01-22',
      icon: DollarSign,
      color: 'slate'
    }
  ];

  const allReports = [...financialReports, ...hrReports, ...projectReports, ...customReports];

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'h-12 w-12 text-blue-600',
      green: 'h-12 w-12 text-green-600',
      purple: 'h-12 w-12 text-purple-600',
      orange: 'h-12 w-12 text-orange-600',
      indigo: 'h-12 w-12 text-indigo-600',
      pink: 'h-12 w-12 text-pink-600',
      teal: 'h-12 w-12 text-teal-600',
      cyan: 'h-12 w-12 text-cyan-600',
      violet: 'h-12 w-12 text-violet-600',
      amber: 'h-12 w-12 text-amber-600',
      emerald: 'h-12 w-12 text-emerald-600',
      rose: 'h-12 w-12 text-rose-600',
      slate: 'h-12 w-12 text-slate-600'
    };
    return colorMap[color] || 'h-12 w-12 text-gray-600';
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'Financial': return 'bg-green-100 text-green-800';
      case 'HR': return 'bg-blue-100 text-blue-800';
      case 'Project': return 'bg-purple-100 text-purple-800';
      case 'Custom': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerateReport = (reportId: number) => {
    console.log(`Generating report ${reportId}`);
    // Add report generation logic here
  };

  const handleScheduleReport = (reportId: number) => {
    console.log(`Scheduling report ${reportId}`);
    // Add report scheduling logic here
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Centralized Reports</h1>
          <p className="text-muted-foreground">Generate, view, and manage all your business reports in one place</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Report
          </Button>
        </div>
      </div>

      {/* Report Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold">{allReports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Financial Reports</p>
                <p className="text-2xl font-bold">{financialReports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">HR Reports</p>
                <p className="text-2xl font-bold">{hrReports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Project Reports</p>
                <p className="text-2xl font-bold">{projectReports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search reports..."
            className="pl-10"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="financial">Financial</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
            <SelectItem value="project">Project</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="hr">HR Reports</TabsTrigger>
          <TabsTrigger value="project">Project</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allReports.map((report) => (
              <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <report.icon className={getColorClasses(report.color)} />
                      <div>
                        <CardTitle className="text-lg">{report.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      </div>
                    </div>
                    <Badge className={getCategoryBadgeColor(report.category)}>
                      {report.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Last generated: </span>
                      <span className="font-medium">{new Date(report.lastGenerated).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleGenerateReport(report.id)}>
                        Generate
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleScheduleReport(report.id)}>
                        Schedule
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {financialReports.map((report) => (
              <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <report.icon className={getColorClasses(report.color)} />
                      <div>
                        <CardTitle className="text-lg">{report.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      </div>
                    </div>
                    <Badge className={getCategoryBadgeColor(report.category)}>
                      {report.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Last generated: </span>
                      <span className="font-medium">{new Date(report.lastGenerated).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleGenerateReport(report.id)}>
                        Generate
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleScheduleReport(report.id)}>
                        Schedule
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="hr" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hrReports.map((report) => (
              <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <report.icon className={getColorClasses(report.color)} />
                      <div>
                        <CardTitle className="text-lg">{report.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      </div>
                    </div>
                    <Badge className={getCategoryBadgeColor(report.category)}>
                      {report.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Last generated: </span>
                      <span className="font-medium">{new Date(report.lastGenerated).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleGenerateReport(report.id)}>
                        Generate
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleScheduleReport(report.id)}>
                        Schedule
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="project" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectReports.map((report) => (
              <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <report.icon className={getColorClasses(report.color)} />
                      <div>
                        <CardTitle className="text-lg">{report.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      </div>
                    </div>
                    <Badge className={getCategoryBadgeColor(report.category)}>
                      {report.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Last generated: </span>
                      <span className="font-medium">{new Date(report.lastGenerated).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleGenerateReport(report.id)}>
                        Generate
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleScheduleReport(report.id)}>
                        Schedule
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="custom" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customReports.map((report) => (
              <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <report.icon className={getColorClasses(report.color)} />
                      <div>
                        <CardTitle className="text-lg">{report.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      </div>
                    </div>
                    <Badge className={getCategoryBadgeColor(report.category)}>
                      {report.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Last generated: </span>
                      <span className="font-medium">{new Date(report.lastGenerated).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleGenerateReport(report.id)}>
                        Generate
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleScheduleReport(report.id)}>
                        Schedule
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CentralizedReports;