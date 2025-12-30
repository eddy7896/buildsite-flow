/**
 * Hook for fetching all reports data
 * Centralized data fetching for reports page
 */

import { useState, useEffect } from 'react';
import { ReportService, MonthlyReportData, YearlyReportData, MonthlyTrend, DepartmentReport, ProjectReport, CustomReport, Report } from '@/services/api/reports';
import { selectOne } from '@/services/api/postgresql-service';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';

export const useReportsData = () => {
  const { addNotification } = useAppStore();
  const { user, profile } = useAuthStore();
  const [profileId, setProfileId] = useState<string | null>(null);
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  
  const [monthlyData, setMonthlyData] = useState<MonthlyReportData | null>(null);
  const [yearlyData, setYearlyData] = useState<YearlyReportData | null>(null);
  const [previousMonthData, setPreviousMonthData] = useState<MonthlyReportData | null>(null);
  const [previousYearData, setPreviousYearData] = useState<YearlyReportData | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentReport[]>([]);
  const [projectReports, setProjectReports] = useState<ProjectReport[]>([]);
  const [customReports, setCustomReports] = useState<CustomReport[]>([]);
  const [savedReports, setSavedReports] = useState<Report[]>([]);
  
  const [loading, setLoading] = useState({
    monthly: false,
    yearly: false,
    trends: false,
    departments: false,
    projects: false,
    custom: false,
    saved: false,
  });
  
  const [error, setError] = useState<string | null>(null);

  // Fetch profile ID
  useEffect(() => {
    const fetchProfileId = async () => {
      if (user?.id) {
        try {
          const profileData = await selectOne('profiles', { user_id: user.id });
          if (profileData?.id) {
            setProfileId(profileData.id);
          } else {
            setProfileId(null);
          }
        } catch (err) {
          console.error('Failed to fetch profile:', err);
          setProfileId(null);
        }
      } else {
        setProfileId(null);
      }
    };
    fetchProfileId();
  }, [user]);

  // Fetch monthly report data
  useEffect(() => {
    const fetchMonthlyData = async () => {
      setLoading(prev => ({ ...prev, monthly: true }));
      setError(null);
      try {
        const [month, year] = selectedMonth.split('-');
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        
        let prevMonth = monthNum - 1;
        let prevYear = yearNum;
        if (prevMonth < 1) {
          prevMonth = 12;
          prevYear = yearNum - 1;
        }
        const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
        
        const agencyId = profile?.agency_id;
        const [currentResponse, previousResponse] = await Promise.all([
          ReportService.getMonthlyReport(selectedMonth, year, agencyId, { showLoading: false }),
          ReportService.getMonthlyReport(prevMonthStr, String(prevYear), agencyId, { showLoading: false }),
        ]);
        
        if (currentResponse.success && currentResponse.data) {
          setMonthlyData(currentResponse.data);
        } else {
          setError(currentResponse.error || 'Failed to load monthly data');
        }
        
        if (previousResponse.success && previousResponse.data) {
          setPreviousMonthData(previousResponse.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load monthly data');
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load monthly report data',
        });
      } finally {
        setLoading(prev => ({ ...prev, monthly: false }));
      }
    };
    fetchMonthlyData();
  }, [selectedMonth, addNotification, profile?.agency_id]);

  // Fetch yearly report data
  useEffect(() => {
    const fetchYearlyData = async () => {
      setLoading(prev => ({ ...prev, yearly: true }));
      setError(null);
      try {
        const currentYear = parseInt(selectedYear);
        const previousYear = String(currentYear - 1);
        const agencyId = profile?.agency_id;
        
        const [currentResponse, previousResponse] = await Promise.all([
          ReportService.getYearlyReport(selectedYear, agencyId, { showLoading: false }),
          ReportService.getYearlyReport(previousYear, agencyId, { showLoading: false }),
        ]);
        
        if (currentResponse.success && currentResponse.data) {
          setYearlyData(currentResponse.data);
        } else {
          setError(currentResponse.error || 'Failed to load yearly data');
        }
        
        if (previousResponse.success && previousResponse.data) {
          setPreviousYearData(previousResponse.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load yearly data');
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load yearly report data',
        });
      } finally {
        setLoading(prev => ({ ...prev, yearly: false }));
      }
    };
    fetchYearlyData();
  }, [selectedYear, addNotification, profile?.agency_id]);

  // Fetch monthly trends
  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(prev => ({ ...prev, trends: true }));
      try {
        const agencyId = profile?.agency_id;
        const response = await ReportService.getMonthlyTrends(selectedYear, agencyId, { showLoading: false });
        if (response.success && response.data) {
          setMonthlyTrends(response.data);
        }
      } catch (err: any) {
        console.error('Failed to load trends:', err);
      } finally {
        setLoading(prev => ({ ...prev, trends: false }));
      }
    };
    fetchTrends();
  }, [selectedYear, profile?.agency_id]);

  // Fetch department data
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(prev => ({ ...prev, departments: true }));
      try {
        const response = await ReportService.getDepartmentReports(undefined, { showLoading: false });
        if (response.success && response.data) {
          setDepartmentData(response.data);
        }
      } catch (err: any) {
        console.error('Failed to load departments:', err);
      } finally {
        setLoading(prev => ({ ...prev, departments: false }));
      }
    };
    fetchDepartments();
  }, []);

  // Fetch project reports
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(prev => ({ ...prev, projects: true }));
      try {
        const agencyId = profile?.agency_id;
        const response = await ReportService.getProjectReports(agencyId, { showLoading: false });
        if (response.success && response.data) {
          setProjectReports(response.data);
        }
      } catch (err: any) {
        console.error('Failed to load projects:', err);
      } finally {
        setLoading(prev => ({ ...prev, projects: false }));
      }
    };
    fetchProjects();
  }, [profile?.agency_id]);

  // Fetch custom reports
  useEffect(() => {
    const fetchCustomReports = async () => {
      if (!profileId) return;
      
      setLoading(prev => ({ ...prev, custom: true }));
      try {
        const response = await ReportService.getCustomReports(profileId, { showLoading: false });
        if (response.success && response.data) {
          setCustomReports(response.data);
        }
      } catch (err: any) {
        console.error('Failed to load custom reports:', err);
      } finally {
        setLoading(prev => ({ ...prev, custom: false }));
      }
    };
    fetchCustomReports();
  }, [profileId]);

  // Fetch saved reports
  useEffect(() => {
    const fetchSavedReports = async () => {
      setLoading(prev => ({ ...prev, saved: true }));
      try {
        const filters: any = {};
        if (user?.id) {
          filters.generated_by = user.id;
        }
        const response = await ReportService.getReports(filters, { showLoading: false });
        if (response.success && response.data) {
          setSavedReports(response.data || []);
        }
      } catch (err: any) {
        console.error('Failed to load saved reports:', err);
      } finally {
        setLoading(prev => ({ ...prev, saved: false }));
      }
    };
    fetchSavedReports();
  }, [user?.id]);

  const refreshAll = async () => {
    const [month, year] = selectedMonth.split('-');
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    let prevMonth = monthNum - 1;
    let prevYear = yearNum;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear = yearNum - 1;
    }
    const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    const previousYear = String(yearNum - 1);
    
    setLoading({
      monthly: true,
      yearly: true,
      trends: true,
      departments: true,
      projects: true,
      custom: true,
      saved: true,
    });

    try {
      const userId = user?.id || profile?.user_id;
      const agencyId = profile?.agency_id;
      const [monthlyRes, prevMonthlyRes, yearlyRes, prevYearlyRes, trendsRes, deptRes, projRes, customRes, savedRes] = await Promise.all([
        ReportService.getMonthlyReport(selectedMonth, year, agencyId, { showLoading: false }),
        ReportService.getMonthlyReport(prevMonthStr, String(prevYear), agencyId, { showLoading: false }),
        ReportService.getYearlyReport(selectedYear, agencyId, { showLoading: false }),
        ReportService.getYearlyReport(previousYear, agencyId, { showLoading: false }),
        ReportService.getMonthlyTrends(selectedYear, agencyId, { showLoading: false }),
        ReportService.getDepartmentReports(agencyId, { showLoading: false }),
        ReportService.getProjectReports(agencyId, { showLoading: false }),
        profileId ? ReportService.getCustomReports(profileId, { showLoading: false }) : Promise.resolve({ success: true, data: [] }),
        ReportService.getReports(userId ? { generated_by: userId } : {}, { showLoading: false }),
      ]);

      if (monthlyRes.success && monthlyRes.data) setMonthlyData(monthlyRes.data);
      if (prevMonthlyRes.success && prevMonthlyRes.data) setPreviousMonthData(prevMonthlyRes.data);
      if (yearlyRes.success && yearlyRes.data) setYearlyData(yearlyRes.data);
      if (prevYearlyRes.success && prevYearlyRes.data) setPreviousYearData(prevYearlyRes.data);
      if (trendsRes.success && trendsRes.data) setMonthlyTrends(trendsRes.data);
      if (deptRes.success && deptRes.data) setDepartmentData(deptRes.data);
      if (projRes.success && projRes.data) setProjectReports(projRes.data);
      if (customRes.success && customRes.data) setCustomReports(customRes.data);
      if (savedRes.success && savedRes.data) {
        setSavedReports(savedRes.data);
      }

      addNotification({
        type: 'success',
        title: 'Refresh Complete',
        message: 'All reports have been refreshed',
      });
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: 'Failed to refresh reports',
      });
    } finally {
      setLoading({
        monthly: false,
        yearly: false,
        trends: false,
        departments: false,
        projects: false,
        custom: false,
        saved: false,
      });
    }
  };

  return {
    // State
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
    
    // Actions
    refreshAll,
    setMonthlyData,
    setYearlyData,
    setPreviousMonthData,
    setPreviousYearData,
    setMonthlyTrends,
    setDepartmentData,
    setProjectReports,
    setCustomReports,
    setSavedReports,
  };
};

