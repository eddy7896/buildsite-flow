/**
 * Hook for calculating project metrics
 */

import { useMemo } from 'react';
import { Project, Task } from '@/services/api/project-service';
import { calculateBudgetVariance, calculateTaskCompletionRate } from '../utils/projectDetailsUtils';

export const useProjectMetrics = (project: Project | null, tasks: Task[]) => {
  const metrics = useMemo(() => {
    if (!project) {
      return {
        budgetVariance: 0,
        completedTasks: 0,
        totalTasks: 0,
        taskCompletionRate: 0,
      };
    }

    const budgetVariance = calculateBudgetVariance(project.budget, project.actual_cost);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const taskCompletionRate = calculateTaskCompletionRate(tasks);

    return {
      budgetVariance,
      completedTasks,
      totalTasks,
      taskCompletionRate,
    };
  }, [project, tasks]);

  return metrics;
};

