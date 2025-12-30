/**
 * Timeline Tab Component
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GanttChart } from '@/components/project-management/GanttChart';
import { Project } from '@/services/api/project-service';

interface TimelineTabProps {
  project: Project;
}

export const TimelineTab = ({ project }: TimelineTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <GanttChart projects={[{
          id: project.id,
          title: project.name,
          start_date: project.start_date || new Date().toISOString(),
          end_date: project.end_date || new Date().toISOString(),
          status: project.status,
          progress: project.progress,
          clients: project.client ? { name: project.client.name } : undefined
        }]} />
      </CardContent>
    </Card>
  );
};

