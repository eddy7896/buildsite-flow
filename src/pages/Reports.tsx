/**
 * Reports Page - Refactored
 * Main orchestrator component using extracted hooks and components
 */

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, RefreshCw, BarChart3, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportService } from "@/services/api/reports";
import { useAppStore } from "@/stores/appStore";

// Hooks
import { useReportsData } from "./reports/hooks/useReportsData";

// Utils
import { exportAllReports, exportReportAsJSON } from "./reports/utils/reportExport";
import { formatIndianDate } from "./reports/utils/reportFormatters";

// Components (to be created)
// import { MonthlyReportsTab } from "./reports/components/MonthlyReportsTab";
// import { YearlyReportsTab } from "./reports/components/YearlyReportsTab";
// import { DepartmentReportsTab } from "./reports/components/DepartmentReportsTab";
// import { ProjectReportsTab } from "./reports/components/ProjectReportsTab";
// import { CustomReportsTab } from "./reports/components/CustomReportsTab";
// import { SavedReportsTab } from "./reports/components/SavedReportsTab";

const Reports = () => {
  const { addNotification } = useAppStore();
  const [createReportOpen, setCreateReportOpen] = useState(false);
  const [newReportName, setNewReportName] = useState("");
  const [newReportDescription, setNewReportDescription] = useState("");
  const [newReportType, setNewReportType] = useState("custom");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReportType, setSelectedReportType] = useState<string>("all");

  const {
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    monthlyData,
    yearlyData,
    previousMonthData,
    previousYearData,
    monthlyTrends,
    departmentData,
    projectReports,
    customReports,
    savedReports,
    loading,
    error,
    profileId,
    user,
    profile,
    refreshAll,
    setCustomReports,
    setSavedReports,
  } = useReportsData();

  // Filter saved reports
  const filteredReports = useMemo(() => {
    let filtered = savedReports;

    if (selectedReportType !== 'all') {
      filtered = filtered.filter(r => r.report_type === selectedReportType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [savedReports, selectedReportType, searchTerm]);

  // Generate month options
  const generateMonthOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 2; year--) {
      for (let month = 1; month <= 12; month++) {
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        const monthName = new Date(year, month - 1).toLocaleString('en-IN', { month: 'long' });
        options.push(
          <SelectItem key={monthStr} value={monthStr}>
            {monthName} {year}
          </SelectItem>
        );
      }
    }
    return options;
  };

  // Generate year options
  const generateYearOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 5; year--) {
      options.push(
        <SelectItem key={year} value={String(year)}>
          {year}
        </SelectItem>
      );
    }
    return options;
  };

  // Create custom report
  const handleCreateReport = async () => {
    if (!newReportName.trim()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Report name is required',
      });
      return;
    }

    try {
      if (!profileId) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Unable to find user profile. Please ensure you are logged in.',
        });
        return;
      }

      const response = await ReportService.createCustomReport({
        name: newReportName,
        description: newReportDescription,
        report_type: newReportType,
        parameters: {
          month: selectedMonth,
          year: selectedYear,
          reportData: {
            monthly: monthlyData,
            yearly: yearlyData,
            trends: monthlyTrends,
            departments: departmentData,
            projects: projectReports,
          },
        },
        created_by: profileId,
        agency_id: profile?.agency_id || undefined,
      }, { showLoading: true, showErrorToast: true });

      if (response.success) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Custom report created successfully',
        });
        setCreateReportOpen(false);
        setNewReportName("");
        setNewReportDescription("");
        setNewReportType("custom");
        if (profileId) {
          const customRes = await ReportService.getCustomReports(profileId, { showLoading: false });
          if (customRes.success && customRes.data) {
            setCustomReports(customRes.data);
          }
        }
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: response.error || 'Failed to create custom report',
        });
      }
    } catch (err: any) {
      console.error('Failed to create report:', err);
      addNotification({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to create custom report. Please try again.',
      });
    }
  };

  // Export all reports
  const handleExportAll = () => {
    exportAllReports({
      monthly: monthlyData,
      yearly: yearlyData,
      trends: monthlyTrends,
      departments: departmentData,
      projects: projectReports,
    });
    
    addNotification({
      type: 'success',
      title: 'Export Successful',
      message: 'All reports have been exported',
    });
  };

  // Export individual report
  const handleExportReport = (type: string, data: any) => {
    exportReportAsJSON(type, data);
    addNotification({
      type: 'success',
      title: 'Export Successful',
      message: `${type} report has been exported`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">View comprehensive business reports and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshAll} disabled={Object.values(loading).some(l => l)}>
            <RefreshCw className={`mr-2 h-4 w-4 ${Object.values(loading).some(l => l) ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
          <Button variant="outline" onClick={handleExportAll} disabled={loading.monthly || loading.yearly}>
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
          <Dialog open={createReportOpen} onOpenChange={setCreateReportOpen}>
            <DialogTrigger asChild>
              <Button>
                <BarChart3 className="mr-2 h-4 w-4" />
                Create Custom Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Custom Report</DialogTitle>
                <DialogDescription>
                  Create a custom report with specific parameters and filters
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input
                    id="report-name"
                    value={newReportName}
                    onChange={(e) => setNewReportName(e.target.value)}
                    placeholder="Enter report name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-description">Description</Label>
                  <Textarea
                    id="report-description"
                    value={newReportDescription}
                    onChange={(e) => setNewReportDescription(e.target.value)}
                    placeholder="Enter report description (optional)"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select value={newReportType} onValueChange={setNewReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateReportOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateReport}
                  type="button"
                  disabled={!newReportName.trim() || !profileId}
                >
                  Create Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
          <TabsTrigger value="departmental">Department</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly" className="mt-6">
          <p className="text-muted-foreground">Monthly Reports Tab - Component to be implemented</p>
          {/* <MonthlyReportsTab 
            monthlyData={monthlyData}
            previousMonthData={previousMonthData}
            monthlyTrends={monthlyTrends}
            loading={loading}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            onExport={handleExportReport}
            generateMonthOptions={generateMonthOptions}
          /> */}
        </TabsContent>
        
        <TabsContent value="yearly" className="mt-6">
          <p className="text-muted-foreground">Yearly Reports Tab - Component to be implemented</p>
          {/* <YearlyReportsTab 
            yearlyData={yearlyData}
            previousYearData={previousYearData}
            monthlyTrends={monthlyTrends}
            loading={loading}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            onExport={handleExportReport}
            generateYearOptions={generateYearOptions}
          /> */}
        </TabsContent>
        
        <TabsContent value="departmental" className="mt-6">
          <p className="text-muted-foreground">Department Reports Tab - Component to be implemented</p>
          {/* <DepartmentReportsTab 
            departmentData={departmentData}
            loading={loading.departments}
            onExport={handleExportReport}
          /> */}
        </TabsContent>
        
        <TabsContent value="projects" className="mt-6">
          <p className="text-muted-foreground">Project Reports Tab - Component to be implemented</p>
          {/* <ProjectReportsTab 
            projectReports={projectReports}
            loading={loading.projects}
            onExport={handleExportReport}
          /> */}
        </TabsContent>
        
        <TabsContent value="attendance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Reports</CardTitle>
              <CardDescription>Attendance reports coming soon</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        
        <TabsContent value="payroll" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Reports</CardTitle>
              <CardDescription>Payroll reports coming soon</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        
        <TabsContent value="financial" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Financial reports coming soon</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        
        <TabsContent value="saved" className="mt-6">
          <p className="text-muted-foreground">Saved Reports Tab - Component to be implemented</p>
          {/* <SavedReportsTab 
            savedReports={filteredReports}
            loading={loading.saved}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedReportType={selectedReportType}
            setSelectedReportType={setSelectedReportType}
            onExport={handleExportReport}
          /> */}
        </TabsContent>
        
        <TabsContent value="custom" className="mt-6">
          <p className="text-muted-foreground">Custom Reports Tab - Component to be implemented</p>
          {/* <CustomReportsTab 
            customReports={customReports}
            loading={loading.custom}
            onExport={handleExportReport}
          /> */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;

