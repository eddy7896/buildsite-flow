import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { Clock, Calendar as CalendarIcon, Users, TrendingUp } from "lucide-react";

const Attendance = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Mock data - replace with actual API calls
  const attendanceStats = {
    present: 42,
    absent: 3,
    late: 2,
    onLeave: 1
  };

  const todayAttendance = [
    { id: 1, name: "John Doe", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "present", hours: "9.0" },
    { id: 2, name: "Jane Smith", checkIn: "09:15 AM", checkOut: "06:15 PM", status: "late", hours: "9.0" },
    { id: 3, name: "Mike Johnson", checkIn: "-", checkOut: "-", status: "absent", hours: "0.0" },
    { id: 4, name: "Sarah Wilson", checkIn: "09:00 AM", checkOut: "06:00 PM", status: "present", hours: "9.0" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'default';
      case 'late': return 'secondary';
      case 'absent': return 'destructive';
      case 'on-leave': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Track and manage employee attendance</p>
        </div>
        <Button>
          <CalendarIcon className="mr-2 h-4 w-4" />
          View Reports
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Present</p>
                <p className="text-2xl font-bold">{attendanceStats.present}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Late</p>
                <p className="text-2xl font-bold">{attendanceStats.late}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold">{attendanceStats.absent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">On Leave</p>
                <p className="text-2xl font-bold">{attendanceStats.onLeave}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
              <CardDescription>Employee check-in and check-out records for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAttendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {record.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{record.name}</h4>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>In: {record.checkIn}</span>
                          <span>Out: {record.checkOut}</span>
                          <span>Hours: {record.hours}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Select a date to view attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Attendance;