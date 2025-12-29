import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GanttChart as GanttChartIcon, Calendar as CalendarIcon, BarChart3 } from "lucide-react";
import { Project } from "@/services/api/project-service";
import { GanttChart } from "../GanttChart";
import { ProjectTimeline } from "../ProjectTimeline";

interface ProjectPlanningTabProps {
  projects: Project[];
  planningViewMode: 'gantt' | 'timeline' | 'critical-path';
  onPlanningViewModeChange: (mode: 'gantt' | 'timeline' | 'critical-path') => void;
}

export function ProjectPlanningTab({
  projects,
  planningViewMode,
  onPlanningViewModeChange
}: ProjectPlanningTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={planningViewMode === 'gantt' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPlanningViewModeChange('gantt')}
          >
            <GanttChartIcon className="h-4 w-4 mr-2" />
            Gantt Chart
          </Button>
          <Button
            variant={planningViewMode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPlanningViewModeChange('timeline')}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Timeline
          </Button>
          <Button
            variant={planningViewMode === 'critical-path' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPlanningViewModeChange('critical-path')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Critical Path
          </Button>
        </div>
      </div>

      {planningViewMode === 'gantt' && (
        <Card>
          <CardHeader>
            <CardTitle>Gantt Chart</CardTitle>
            <CardDescription>Interactive project planning and scheduling</CardDescription>
          </CardHeader>
          <CardContent>
            <GanttChart projects={projects.map(p => ({
              id: p.id,
              title: p.name,
              start_date: p.start_date || new Date().toISOString(),
              end_date: p.end_date || new Date().toISOString(),
              status: p.status,
              progress: p.progress,
              clients: p.client ? { name: p.client.name } : undefined
            }))} />
          </CardContent>
        </Card>
      )}

      {planningViewMode === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle>Project Timeline</CardTitle>
            <CardDescription>Chronological view of all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectTimeline projects={projects.map(p => ({
              id: p.id,
              title: p.name,
              start_date: p.start_date || new Date().toISOString(),
              end_date: p.end_date || new Date().toISOString(),
              status: p.status,
              progress: p.progress,
              clients: p.client ? { name: p.client.name } : undefined,
              profiles: p.project_manager ? { full_name: p.project_manager.full_name } : undefined
            }))} />
          </CardContent>
        </Card>
      )}

      {planningViewMode === 'critical-path' && (
        <Card>
          <CardHeader>
            <CardTitle>Critical Path Analysis</CardTitle>
            <CardDescription>Identify critical tasks and dependencies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Critical path analysis coming soon...
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
