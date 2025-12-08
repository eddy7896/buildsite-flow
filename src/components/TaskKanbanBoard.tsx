import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Calendar, User, MoreVertical, Edit, Trash2 } from "lucide-react";
import { db } from '@/lib/database';
import { useToast } from "@/hooks/use-toast";
import { TaskFormDialog } from "./TaskFormDialog";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Task {
  id: string;
  title: string;
  description?: string;
  project_id?: string;
  assignee_id?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  estimated_hours?: number;
  created_at: string;
  projects?: { name: string } | null;
  profiles?: { full_name: string; avatar_url?: string } | null;
}

const statusColumns = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-100' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'review', title: 'Review', color: 'bg-yellow-100' },
  { id: 'completed', title: 'Completed', color: 'bg-green-100' },
];

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

interface TaskKanbanBoardProps {
  projectId?: string;
}

export function TaskKanbanBoard({ projectId }: TaskKanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let query = db
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch projects and profiles separately
      const projectIds = new Set<string>();
      const assigneeIds = new Set<string>();
      (data || []).forEach(task => {
        if (task.project_id) projectIds.add(task.project_id);
        if (task.assignee_id) assigneeIds.add(task.assignee_id);
      });

      let projectMap = new Map<string, { name: string }>();
      if (projectIds.size > 0) {
        const { data: projects } = await db
          .from("projects")
          .select("id, name")
          .in("id", Array.from(projectIds));

        if (projects) {
          projects.forEach(project => {
            projectMap.set(project.id, { name: project.name });
          });
        }
      }

      let profileMap = new Map<string, { full_name: string; avatar_url?: string }>();
      if (assigneeIds.size > 0) {
        const { data: profiles } = await db
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", Array.from(assigneeIds));

        if (profiles) {
          profiles.forEach(profile => {
            profileMap.set(profile.user_id, {
              full_name: profile.full_name,
              avatar_url: profile.avatar_url || undefined
            });
          });
        }
      }
      
      // Type the response data properly with joined data
      const typedTasks: Task[] = (data || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        project_id: task.project_id,
        assignee_id: task.assignee_id,
        status: task.status as Task['status'],
        priority: task.priority as Task['priority'],
        due_date: task.due_date,
        estimated_hours: task.estimated_hours,
        created_at: task.created_at,
        projects: task.project_id ? (projectMap.get(task.project_id) || null) : null,
        profiles: task.assignee_id ? (profileMap.get(task.assignee_id) || null) : null
      }));
      
      setTasks(typedTasks);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const { updateRecord } = await import('@/services/api/postgresql-service');
      await updateRecord("tasks", { 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      }, { id: taskId });

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      toast({
        title: "Success",
        description: "Task status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTask) return;

    try {
      const { deleteRecord } = await import('@/services/api/postgresql-service');
      await deleteRecord("tasks", { id: deleteTask.id });

      setTasks(tasks.filter(task => task.id !== deleteTask.id));
      setDeleteTask(null);

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    const task = tasks.find(t => t.id === taskId);
    
    if (task && task.status !== status) {
      updateTaskStatus(taskId, status);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Task Board</h3>
        <TaskFormDialog onTaskSaved={fetchTasks} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map((column) => (
          <div
            key={column.id}
            className={`${column.color} rounded-lg p-4 min-h-[500px]`}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, column.id as Task['status'])}
          >
            <h4 className="font-medium mb-4 flex items-center justify-between">
              {column.title}
              <Badge variant="secondary">
                {tasks.filter(task => task.status === column.id).length}
              </Badge>
            </h4>

            <div className="space-y-3">
              {tasks
                .filter(task => task.status === column.id)
                .map((task) => (
                  <Card
                    key={task.id}
                    className="cursor-move hover:shadow-md transition-shadow bg-white"
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium line-clamp-2">
                          {task.title}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <TaskFormDialog
                                task={{
                                  ...task,
                                  due_date: task.due_date ? new Date(task.due_date) : undefined
                                }}
                                onTaskSaved={fetchTasks}
                                trigger={
                                  <div className="flex items-center cursor-pointer">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </div>
                                }
                              />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeleteTask(task)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className={priorityColors[task.priority]}
                        >
                          {task.priority}
                        </Badge>

                        {task.estimated_hours && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {task.estimated_hours}h
                          </div>
                        )}
                      </div>

                      {task.due_date && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(task.due_date), "MMM dd")}
                        </div>
                      )}

                      {task.projects?.name && (
                        <Badge variant="outline" className="text-xs">
                          {task.projects.name}
                        </Badge>
                      )}

                      {task.profiles?.full_name && (
                        <div className="flex items-center text-xs">
                          <Avatar className="h-5 w-5 mr-2">
                            <AvatarImage src={task.profiles.avatar_url} />
                            <AvatarFallback>
                              {task.profiles.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{task.profiles.full_name}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteTask} onOpenChange={() => setDeleteTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTask?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}