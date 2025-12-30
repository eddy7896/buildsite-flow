/**
 * Planning Tab Component
 */

import { ProjectPlanningTab } from "@/components/project-management/fragments/ProjectPlanningTab";
import { Project } from "@/services/api/project-service";

interface PlanningTabProps {
  projects: Project[];
  planningViewMode: 'gantt' | 'timeline' | 'critical-path';
  onPlanningViewModeChange: (mode: 'gantt' | 'timeline' | 'critical-path') => void;
}

export const PlanningTab = ({ projects, planningViewMode, onPlanningViewModeChange }: PlanningTabProps) => {
  return (
    <div className="space-y-4">
      <ProjectPlanningTab
        projects={projects}
        planningViewMode={planningViewMode}
        onPlanningViewModeChange={onPlanningViewModeChange}
      />
    </div>
  );
};

