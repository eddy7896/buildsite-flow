import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Employees = () => {
  const navigate = useNavigate();
  
  // Mock data - replace with actual API calls
  const employees = [
    { id: 1, name: "John Doe", email: "john@company.com", phone: "+1-555-0101", department: "Engineering", position: "Senior Developer", status: "active", hireDate: "2023-01-15" },
    { id: 2, name: "Jane Smith", email: "jane@company.com", phone: "+1-555-0102", department: "Marketing", position: "Marketing Manager", status: "active", hireDate: "2022-08-20" },
    { id: 3, name: "Mike Johnson", email: "mike@company.com", phone: "+1-555-0103", department: "Sales", position: "Sales Representative", status: "on-leave", hireDate: "2023-03-10" },
    { id: 4, name: "Sarah Wilson", email: "sarah@company.com", phone: "+1-555-0104", department: "HR", position: "HR Specialist", status: "active", hireDate: "2022-11-05" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'on-leave': return 'secondary';
      case 'inactive': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage employee information and records</p>
        </div>
        <Button onClick={() => navigate('/create-employee')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search employees..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {employees.map((employee) => (
          <Card key={employee.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{employee.name}</h3>
                    <p className="text-muted-foreground">{employee.position}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {employee.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {employee.phone}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{employee.department}</Badge>
                    <Badge variant={getStatusColor(employee.status)}>
                      {employee.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Hired: {new Date(employee.hireDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Employees;