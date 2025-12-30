/**
 * Employee Metrics Cards Component
 * Displays summary statistics for employees
 */

import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, Shield, Briefcase, Building2 } from "lucide-react";

interface EmployeeMetricsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
    managers: number;
    departments: number;
  };
}

export const EmployeeMetrics = ({ stats }: EmployeeMetricsProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 flex-shrink-0" />
            <div className="ml-4 min-w-0">
              <p className="text-sm text-muted-foreground truncate">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600 flex-shrink-0" />
            <div className="ml-4 min-w-0">
              <p className="text-sm text-muted-foreground truncate">Active</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <UserX className="h-8 w-8 text-red-600 flex-shrink-0" />
            <div className="ml-4 min-w-0">
              <p className="text-sm text-muted-foreground truncate">Trash</p>
              <p className="text-2xl font-bold">{stats.inactive}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-purple-600 flex-shrink-0" />
            <div className="ml-4 min-w-0">
              <p className="text-sm text-muted-foreground truncate">Admins</p>
              <p className="text-2xl font-bold">{stats.admins}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-orange-600 flex-shrink-0" />
            <div className="ml-4 min-w-0">
              <p className="text-sm text-muted-foreground truncate">Managers</p>
              <p className="text-2xl font-bold">{stats.managers}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-indigo-600 flex-shrink-0" />
            <div className="ml-4 min-w-0">
              <p className="text-sm text-muted-foreground truncate">Depts</p>
              <p className="text-2xl font-bold">{stats.departments}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

