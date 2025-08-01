import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Calendar, Users } from "lucide-react";

const Projects = () => {
  // Mock data - replace with actual API calls
  const projects = [
    { id: 1, name: "Website Redesign", description: "Complete overhaul of company website", status: "in-progress", progress: 65, deadline: "2024-02-15", team: 5 },
    { id: 2, name: "Mobile App", description: "Develop iOS and Android mobile application", status: "planning", progress: 20, deadline: "2024-04-30", team: 8 },
    { id: 3, name: "CRM Integration", description: "Integrate new CRM system with existing tools", status: "completed", progress: 100, deadline: "2024-01-20", team: 3 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in-progress': return 'secondary';
      case 'planning': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Projects</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Manage and track project progress</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 lg:gap-6">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader className="pb-4">
              <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
                <div className="flex-1">
                  <CardTitle className="text-lg lg:text-xl">{project.name}</CardTitle>
                  <CardDescription className="text-sm lg:text-base mt-1">{project.description}</CardDescription>
                </div>
                <Badge variant={getStatusColor(project.status)} className="self-start">
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="w-full h-2" />
                </div>
                <div className="flex flex-col space-y-2 sm:flex-row sm:gap-6 sm:space-y-0 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>Due: {project.deadline}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span>{project.team} team members</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Projects;