/**
 * Resources Tab Component
 */

import { ResourceManagement } from "@/components/project-management/ResourceManagement";
import { Project } from "@/services/api/project-service";
import { Resource } from "@/components/project-management/fragments/types";

interface ResourcesTabProps {
  resources: Resource[];
  projects: Project[];
}

export const ResourcesTab = ({ resources, projects }: ResourcesTabProps) => {
  return (
    <div className="space-y-4">
      <ResourceManagement 
        resources={resources} 
        projects={projects.map(p => ({
          id: p.id,
          title: p.name,
          status: p.status,
          assigned_to: p.project_manager_id || '',
          estimated_hours: 0,
          actual_hours: 0
        }))} 
      />
    </div>
  );
};

