import { Project, Task } from "@/services/api/project-service";
import { DateRange } from "react-day-picker";

export interface ProjectMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overBudgetProjects: number;
  totalBudget: number;
  totalActualCost: number;
  budgetVariance: number;
}

export interface SavedView {
  id: string;
  name: string;
  filters: {
    status: string;
    priority: string;
    tags: string[];
    dateRange?: DateRange;
  };
}

export interface HealthScore {
  score: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface ProjectFilters {
  statusFilter: string;
  priorityFilter: string;
  searchTerm: string;
  selectedTags: string[];
  dateRange?: DateRange;
  showArchived: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  hourly_rate: number;
  availability: number;
  current_projects: number;
  utilization: number;
  total_hours: number;
  estimated_hours: number;
}

export const statusColors: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  on_hold: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

export const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
