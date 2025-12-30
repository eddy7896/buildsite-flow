/**
 * Hook for calculating project metrics
 */

import { useMemo, useCallback } from 'react';
import { Project } from '@/services/api/project-service';
import { ProjectMetrics } from '@/components/project-management/fragments/types';

export const useProjectMetrics = (projects: Project[]) => {
  const getProjectMetrics = useCallback((): ProjectMetrics => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const overBudgetProjects = projects.filter(p => {
      if (!p.budget || !p.actual_cost) return false;
      return p.actual_cost > p.budget;
    }).length;
    
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalActualCost = projects.reduce((sum, p) => sum + (p.actual_cost || 0), 0);
    const budgetVariance = totalBudget > 0 ? ((totalActualCost - totalBudget) / totalBudget) * 100 : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      overBudgetProjects,
      totalBudget,
      totalActualCost,
      budgetVariance
    };
  }, [projects]);

  const metrics = useMemo(() => getProjectMetrics(), [getProjectMetrics]);

  return metrics;
};

