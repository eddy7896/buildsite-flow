/**
 * Project Header Component
 */

import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { Project } from '@/services/api/project-service';

interface ProjectHeaderProps {
  project: Project;
  onBack: () => void;
  onEdit: () => void;
}

export const ProjectHeader = ({ project, onBack, onEdit }: ProjectHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.project_code && (
            <p className="text-muted-foreground">Code: {project.project_code}</p>
          )}
        </div>
      </div>
      <Button onClick={onEdit}>
        <Edit className="h-4 w-4 mr-2" />
        Edit Project
      </Button>
    </div>
  );
};

