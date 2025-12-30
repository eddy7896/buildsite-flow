/**
 * Report export utilities
 * Helper functions for exporting reports
 */

/**
 * Export report data as JSON
 */
export const exportReportAsJSON = (type: string, data: any, filename?: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${type}-report-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export all reports
 */
export const exportAllReports = (reportsData: {
  monthly: any;
  yearly: any;
  trends: any[];
  departments: any[];
  projects: any[];
}): void => {
  const data = {
    ...reportsData,
    generatedAt: new Date().toISOString(),
  };
  
  exportReportAsJSON('reports-export', data, `reports-export-${new Date().toISOString().split('T')[0]}.json`);
};

